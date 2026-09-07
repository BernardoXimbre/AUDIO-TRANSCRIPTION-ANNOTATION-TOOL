import { Request, Response } from 'express';
import { prisma } from '../db';
import { ingestService } from '../services/ingestService';
import { pairingService } from '../services/pairingService';
import { validateAudioFile, validateBatchSize, sanitizeFilename } from '../middleware/uploadValidator';

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
    let transcripts: ParsedTranscript[] = [];

    // Parse transcript JSON from request body
    if (req.body.transcripts) {
      try {
        transcripts = typeof req.body.transcripts === 'string'
          ? JSON.parse(req.body.transcripts)
          : req.body.transcripts;

        // Validate transcript format
        if (!Array.isArray(transcripts)) {
          res.status(400).json({
            error: 'INVALID_TRANSCRIPT_FORMAT',
            reason: 'Transcripts must be a JSON array',
            status: 400
          });
          return;
        }

        // Validate each transcript has required fields
        for (const t of transcripts) {
          if (!t.path || !t.label) {
            res.status(400).json({
              error: 'INVALID_TRANSCRIPT_FORMAT',
              reason: 'Each transcript must have "path" and "label" fields',
              status: 400
            });
            return;
          }
        }
      } catch (parseError) {
        res.status(400).json({
          error: 'MALFORMED_JSON',
          reason: `Failed to parse transcripts: ${String(parseError)}`,
          status: 400
        });
        return;
      }
    }

    // Validate batch size
    const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
    const batchSizeValidation = validateBatchSize(totalSize);
    if (!batchSizeValidation.valid) {
      res.status(400).json({
        error: batchSizeValidation.error,
        reason: batchSizeValidation.reason,
        status: 400
      });
      return;
    }

    // Validate each file
    const validationErrors: ValidationError[] = [];
    const validFiles: Express.Multer.File[] = [];

    for (const file of files) {
      const fileValidation = await validateAudioFile(file.buffer, file.originalname);
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
      res.status(400).json({
        error: 'VALIDATION_FAILED',
        invalidFiles: validationErrors,
        validCount: validFiles.length,
        totalCount: files.length,
        status: 400
      });
      return;
    }

    // Sanitize filenames
    const sanitizedFiles = validFiles.map((f) => ({
      ...f,
      originalname: sanitizeFilename(f.originalname)
    }));

    // Convert files to audio records for pairing
    const audioRecords = sanitizedFiles.map((f) => ({
      filename: f.originalname,
      filePath: f.path || '',
      duration: 0 // Will be populated by Task 1.3 integration
    }));

    // Perform pairing
    const pairingResult = pairingService.matchTranscriptsToAudio(
      audioRecords,
      transcripts
    );

    // Process ingest (Task 1.1 stub)
    const result = await ingestService.processIngest(sanitizedFiles, transcripts);

    res.status(200).json({
      success: true,
      audioFiles: result.audioFiles,
      transcripts: result.transcripts,
      autoRejectedCount: result.autoRejectedCount,
      pairing: {
        matched: pairingResult.matched,
        unmatchedAudio: pairingResult.unmatchedAudio,
        unmatchedTranscripts: pairingResult.unmatchedTranscripts
      }
    });
  } catch (error) {
    res.status(500).json({
      error: String(error),
      status: 500
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
