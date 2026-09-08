import { Request, Response } from 'express';
import fs from 'fs';
import { ingestService } from '../services/ingestService';
import { validateAudioFileFromPath, validateBatchSize, sanitizeFilename } from '../middleware/uploadValidator';

interface MulterRequest extends Request {
  files?: Express.Multer.File[];
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
    const allFiles = (req as unknown as MulterRequest).files || [];

    if (!allFiles || allFiles.length === 0) {
      return res.status(400).json({
        error: 'NO_FILES_PROVIDED',
        reason: 'No files were uploaded',
        status: 400
      });
    }

    // Separate audio files from transcript files
    const audioFiles: Express.Multer.File[] = [];
    let transcriptFile: Express.Multer.File | undefined;

    for (const file of allFiles) {
      if (file.fieldname === 'transcripts' || file.originalname?.endsWith('.json')) {
        if (!transcriptFile) {
          transcriptFile = file;
        }
      } else {
        audioFiles.push(file);
      }
    }

    if (audioFiles.length === 0) {
      return res.status(400).json({
        error: 'NO_AUDIO_FILES_PROVIDED',
        reason: 'No audio files were uploaded',
        status: 400
      });
    }

    let transcripts: ParsedTranscript[] = [];
    let transcriptContent: string | undefined;

    // Get transcript from either request body or uploaded file
    if (req.body.transcripts) {
      transcriptContent = typeof req.body.transcripts === 'string'
        ? req.body.transcripts
        : JSON.stringify(req.body.transcripts);
    } else if (transcriptFile) {
      transcriptContent = fs.readFileSync(transcriptFile.path, 'utf-8');
    }

    // Parse transcript JSON
    if (transcriptContent) {
      try {
        transcripts = JSON.parse(transcriptContent);

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
        reason: 'No transcript JSON was provided in request body or as uploaded file',
        status: 400
      });
    }

    // Validate batch size
    const totalSize = audioFiles.reduce((sum, f) => sum + (f.size || 0), 0);
    const batchSizeValidation = validateBatchSize(totalSize);
    if (!batchSizeValidation.valid) {
      return res.status(400).json({
        error: batchSizeValidation.error,
        reason: batchSizeValidation.reason,
        status: 400
      });
    }

    // Validate each audio file
    const validationErrors: ValidationError[] = [];
    const validFiles: Express.Multer.File[] = [];

    for (const file of audioFiles) {
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
        totalCount: audioFiles.length,
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
    const { status } = req.query;

    const items = await ingestService.getQueue(status ? String(status) : undefined);

    res.status(200).json({
      success: true,
      count: items.length,
      items
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
}
