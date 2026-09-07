import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import { ingestAudio, getQueue } from './controllers/ingestController';

const app: Express = express();
const PORT = process.env.PORT || 5000;
const AUDIO_UPLOAD_DIR = process.env.AUDIO_UPLOAD_DIR || './uploads';
const AUDIO_UPLOAD_LIMIT = process.env.MAX_FILE_SIZE_MB ? parseInt(process.env.MAX_FILE_SIZE_MB) * 1024 * 1024 : 100 * 1024 * 1024; // 100MB per file

// File upload configuration
const upload = multer({
  dest: AUDIO_UPLOAD_DIR,
  limits: { fileSize: AUDIO_UPLOAD_LIMIT } // 100MB per file
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.post('/api/ingest', upload.any() as any, ingestAudio);
app.get('/api/queue', getQueue);

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

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`📤 Ingest API: POST http://localhost:${PORT}/api/ingest`);
  console.log(`📋 Queue API: GET http://localhost:${PORT}/api/queue`);
});

export default app;
