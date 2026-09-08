import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { ingestAudio, getQueue } from './controllers/ingestController';
import { getRecording, updateRecording } from './controllers/recordingController';
import { annotationController } from './controllers/annotationController';
import { transcriptController } from './controllers/transcriptController';
import { exportController } from './controllers/exportController';

const app: Express = express();
const PORT = process.env.PORT || 5000;
const AUDIO_UPLOAD_DIR = process.env.AUDIO_UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads');
const AUDIO_UPLOAD_LIMIT = process.env.MAX_FILE_SIZE_MB ? parseInt(process.env.MAX_FILE_SIZE_MB) * 1024 * 1024 : 100 * 1024 * 1024; // 100MB per file

const prisma = new PrismaClient();

// File upload configuration
const upload = multer({
  dest: AUDIO_UPLOAD_DIR,
  limits: { fileSize: AUDIO_UPLOAD_LIMIT } // 100MB per file
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Static file serving for audio files
app.use('/uploads', express.static('./uploads'));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.post('/api/ingest', upload.any() as any, ingestAudio);
app.get('/api/queue', getQueue);
app.get('/api/recording/:audioFileId', getRecording);
app.patch('/api/recording/:audioFileId', updateRecording);
app.post('/api/export', exportController.exportDataset);
app.use('/api/transcript', transcriptController);
app.use('/api/annotation', annotationController);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    status: 404
  });
});

// Error handling middleware
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('Error:', error);
  const status = (error as { status?: number }).status || 500;
  res.status(status).json({
    error: error.message || 'Internal server error',
    status
  });
});

/**
 * Initialize database: create schema if it doesn't exist
 */
async function initDatabase(): Promise<void> {
  try {
    await prisma.audioFile.findFirst();
  } catch {
    console.log('Initializing database schema...');
    const { execSync } = await import('child_process');
    execSync('npx prisma db push --skip-generate', {
      stdio: 'inherit',
      cwd: __dirname + '/..'
    });
  }
}

/**
 * Start server
 */
async function startServer(): Promise<void> {
  await initDatabase();
  
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Ingest API: POST http://localhost:${PORT}/api/ingest`);
    console.log(`Queue API: GET http://localhost:${PORT}/api/queue`);
  });
}

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

export default app;
