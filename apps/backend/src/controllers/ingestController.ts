import { Request, Response } from 'express';
import { prisma } from '../db';
import { ingestService } from '../services/ingestService';
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

export async function ingestAudio(req: Request, res: Response) {
  try {
    // Files will be in req.files (after multer middleware)
    // Transcript JSON in req.body.transcripts

    const files = (req as unknown as MulterRequest).files || [];
    const transcripts = req.body.transcripts || [];

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

    const result = await ingestService.processIngest(sanitizedFiles, transcripts);

    res.status(200).json({
      success: true,
      audioFiles: result.audioFiles,
      transcripts: result.transcripts,
      autoRejectedCount: result.autoRejectedCount
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
