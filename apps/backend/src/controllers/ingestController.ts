import { Request, Response } from 'express';
import { prisma } from '../db';
import { ingestService } from '../services/ingestService';

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

export async function ingestAudio(req: Request, res: Response) {
  try {
    // Files will be in req.files (after multer middleware)
    // Transcript JSON in req.body.transcripts

    const files = (req as unknown as MulterRequest).files || [];
    const transcripts = req.body.transcripts || [];

    const result = await ingestService.processIngest(files, transcripts);

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
