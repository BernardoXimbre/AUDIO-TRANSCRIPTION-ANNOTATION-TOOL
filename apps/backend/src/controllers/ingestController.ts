import { Request, Response } from 'express';
import { prisma } from '../db';
import { ingestService } from '../services/ingestService';
import { validateAudioFileFromPath, validateBatchSize, sanitizeFilename } from '../middleware/uploadValidator';

interface MulterRequest extends Request {
  files?: Express.Multer.File[];
}

interface QueryFilter {
  isAutoRejected: boolean;
  status?: string;
  audioFile?: {
    duration: {
      gte?: number;
      lte?: number;
    };
  };
}

interface ValidationError {
  file: string;
  error: string;
  reason: string;
}

interface ParsedTranscript {
  path: string;
  label: string;
}

export async function ingestAudio(req: Request, res: Response) {
  try {
    const files = (req as unknown as MulterRequest).files || [];

    if (!files || files.length === 0) {
      return res.status(400).json({
        error: 'NO_FILES_PROVIDED',
        reason: 'No audio files were uploaded',
        status: 400
      });
    }

    let transcripts: ParsedTranscript[] = [];

    // Parse transcript JSON from request body
    if (req.body.transcripts) {
      try {
        transcripts = typeof req.body.transcripts === 'string'
          ? JSON.parse(req.body.transcripts)
          : req.body.transcripts;

        // Validate transcript format
        if (!Array.isArray(transcripts)) {
          return res.status(400).json({
            error: 'INVALID_TRANSCRIPT_FORMAT',
            reason: 'Transcripts must be a JSON array',
            status: 400
          });
        }

        // Validate each transcript has required fields
        for (const t of transcripts) {
          if (!t.path || !t.label) {
            return res.status(400).json({
              error: 'INVALID_TRANSCRIPT_FORMAT',
              reason: 'Each transcript must have "path" and "label" fields',
              status: 400
            });
          }
        }
      } catch (parseError) {
        return res.status(400).json({
          error: 'MALFORMED_JSON',
          reason: `Failed to parse transcripts: ${String(parseError)}`,
          status: 400
        });
      }
    } else {
      return res.status(400).json({
        error: 'NO_TRANSCRIPTS_PROVIDED',
        reason: 'No transcript JSON was provided in request body',
        status: 400
      });
    }

    // Validate batch size
    const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
    const batchSizeValidation = validateBatchSize(totalSize);
    if (!batchSizeValidation.valid) {
      return res.status(400).json({
        error: batchSizeValidation.error,
        reason: batchSizeValidation.reason,
        status: 400
      });
    }

    // Validate each file
    const validationErrors: ValidationError[] = [];
    const validFiles: Express.Multer.File[] = [];

    for (const file of files) {
      // Use path-based validation since multer saves to disk
      const fileValidation = await validateAudioFileFromPath(file.path, file.originalname);
      if (!fileValidation.valid) {
        validationErrors.push({
          file: file.originalname,
          error: fileValidation.error || 'UNKNOWN_ERROR',
          reason: fileValidation.reason || 'Unknown validation error'
        });
      } else {
        validFiles.push(file);
      }
    }

    // If there are validation errors, report them
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'VALIDATION_FAILED',
        invalidFiles: validationErrors,
        validCount: validFiles.length,
        totalCount: files.length,
        status: 400
      });
    }

    // Sanitize filenames
    const sanitizedFiles = validFiles.map((f) => ({
      ...f,
      originalname: sanitizeFilename(f.originalname)
    }));

    // Process ingest with service
    const result = await ingestService.processIngest(sanitizedFiles, transcripts);

    return res.status(result.errors.length > 0 ? 207 : 200).json({
      success: result.errors.length === 0,
      ingested: result.ingested,
      rejected: result.rejected,
      unmatched: result.unmatched,
      errors: result.errors
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Ingest error:', message, error);
    return res.status(400).json({
      success: false,
      error: message,
      errors: [message]
    });
  }
}

export async function getQueue(req: Request, res: Response) {
  try {
    const { status, minDuration, maxDuration } = req.query;

    const query: QueryFilter = {
      isAutoRejected: false // Exclude auto-rejected
    };

    if (status) query.status = status as string;
    if (minDuration || maxDuration) {
      query.audioFile = {
        duration: {}
      };
      if (minDuration) query.audioFile.duration.gte = parseFloat(minDuration as string);
      if (maxDuration) query.audioFile.duration.lte = parseFloat(maxDuration as string);
    }

    const items = await prisma.transcript.findMany({
      where: query,
      include: {
        audioFile: {
          select: { filename: true, duration: true, filepath: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ error: String(error), status: 500 });
  }
}
