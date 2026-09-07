import { prisma } from '../db';
import { extractAudioMetadata } from '../utils/audioMetadata';
import { pairingService } from './pairingService';
import * as fs from 'fs';
import * as path from 'path';

const UPLOAD_DIR = process.env.AUDIO_UPLOAD_DIR || './uploads';
const AUTO_REJECT_DURATION_SECONDS = 15;

export interface PairingItem {
  audio: string;
  transcript: string;
}

export interface PairingData {
  matched: PairingItem[];
  unmatchedAudio: string[];
  unmatchedTranscript: string[];
}

export interface IngestResult {
  ingested: number;
  rejected: number;
  unmatched: { audio: string[]; transcripts: string[] };
  errors: string[];
}

interface TranscriptData {
  path: string;
  label: string;
}

/**
 * Sanitize filename to prevent path traversal attacks
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/\.\./g, '')
    .replace(/\\\\/g, '/')
    .replace(/[\u0000-\u001F\u007F]/g, '') // eslint-disable-line no-control-regex
    .replace(/^\.+/, ''); // Remove leading dots
}

/**
 * Ensure directory exists
 */
async function ensureDir(dirPath: string): Promise<void> {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Calculate speech rate (words per minute)
 */
function calculateSpeechRate(text: string, durationSeconds: number): number {
  if (durationSeconds === 0) return 0;
  const wordCount = text.split(/\s+/).length;
  const durationMinutes = durationSeconds / 60;
  return Math.round(wordCount / durationMinutes);
}

/**
 * Estimate distance category (simplified)
 */
function estimateDistance(): string {
  // TODO: Implement RMS level analysis
  // For now, return placeholder
  return 'medium';
}

export const ingestService = {
  async processIngest(
    audioFileObjects: Express.Multer.File[],
    transcriptJSON: string | TranscriptData[],
    manualPairings: PairingItem[] = []
  ): Promise<IngestResult> {
    const results: IngestResult = {
      ingested: 0,
      rejected: 0,
      unmatched: { audio: [], transcripts: [] },
      errors: []
    };

    try {
      // Validate inputs
      if (!audioFileObjects || !Array.isArray(audioFileObjects)) {
        throw new Error('Audio file objects must be an array');
      }

      if (!transcriptJSON) {
        throw new Error('Transcript data is required');
      }

      // Extract audio filenames
      const audioFilenames = audioFileObjects.map((f) => f.originalname);

      // Parse transcripts
      let transcripts: TranscriptData[];
      try {
        transcripts =
          typeof transcriptJSON === 'string' ? JSON.parse(transcriptJSON) : transcriptJSON;
        if (!Array.isArray(transcripts)) {
          throw new Error('Transcripts must be an array');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        results.errors.push(`Invalid transcript JSON: ${errorMsg}`);
        throw new Error('Invalid transcript JSON');
      }

      // Auto-pair using pairingService
      const pairing = pairingService.matchTranscriptsToAudio(
        audioFilenames.map((f) => ({
          filename: f,
          filePath: '',
          duration: 0
        })),
        transcripts
      );

      // Apply manual overrides if provided
      let finalMatched = pairing.matched;
      if (manualPairings && manualPairings.length > 0) {
        // Replace matched with manual pairings
        finalMatched = manualPairings.map((m) => ({
          filename: m.audio,
          transcriptPath: m.transcript
        }));
      }

      // Ingest matched pairs
      for (const pair of finalMatched) {
        try {
          const audioFileObj = audioFileObjects.find((f) => f.originalname === pair.filename);
          const transcriptData = transcripts.find((t) => t.path === pair.transcriptPath);

          if (!audioFileObj || !transcriptData) {
            results.errors.push(
              `Missing file for pair: ${pair.filename} ↔ ${pair.transcriptPath}`
            );
            continue;
          }

          // Extract audio metadata
          const metadata = await extractAudioMetadata(audioFileObj.path);
          const { duration, sampleRate, channels, bitDepth } = metadata;

          // Check 15-second rule: reject without saving
          if (duration < AUTO_REJECT_DURATION_SECONDS) {
            results.rejected++;
            // Clean up temp file
            fs.unlinkSync(audioFileObj.path);
            continue;
          }

          // Sanitize filename (prevent path traversal)
          const sanitizedFilename = sanitizeFilename(pair.filename);

          // Move audio file to permanent location
          const permanentPath = path.join(UPLOAD_DIR, 'permanent', sanitizedFilename);
          await ensureDir(path.dirname(permanentPath));
          fs.copyFileSync(audioFileObj.path, permanentPath);
          fs.unlinkSync(audioFileObj.path); // Remove temp file

          // Create AudioFile record
          const audioFile = await prisma.audioFile.create({
            data: {
              filename: sanitizedFilename,
              filepath: permanentPath,
              duration,
              sampleRate,
              channels,
              bitDepth
              // TODO: Extract bextMetadata from WAV if present
            }
          });

          // Create Transcript record (with immutable originalText)
          await prisma.transcript.create({
            data: {
              audioFileId: audioFile.id,
              originalText: transcriptData.label,
              correctedText: transcriptData.label, // Initially same as original
              status: 'pending'
            }
          });

          // Create Recording record with calculated values
          const speechRateWPM = calculateSpeechRate(transcriptData.label, duration);
          const distanceEstimate = estimateDistance();

          await prisma.recording.create({
            data: {
              audioFileId: audioFile.id,
              speechRate: speechRateWPM,
              distanceEstimate,
              speechRateOverride: null,
              distanceOverride: null
            }
          });

          results.ingested++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          results.errors.push(`Failed to ingest ${pair.filename}: ${errorMsg}`);
        }
      }

      // Record unmatched items
      results.unmatched = {
        audio: pairing.unmatchedAudio,
        transcripts: pairing.unmatchedTranscripts
      };

      return results;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      results.errors.push(errorMsg);
      throw error;
    }
  }
};
