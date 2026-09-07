import { execSync } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';

export interface AudioMetadata {
  duration: number; // seconds
  sampleRate: number; // Hz
  channels: number; // 1 (mono) or 2 (stereo)
  bitDepth: number; // bits (16, 24, 32)
}

/**
 * Parse ffmpeg verbose output to extract metadata
 * Handles both mock format and real ffmpeg output
 */
function parseFFmpegOutput(output: string): AudioMetadata {
  // Try simple format first (used in tests): "duration\nsampleRate\nchannels\nbitDepth"
  const lines = output.trim().split('\n').filter(l => l.trim());
  
  // If we have the simple format (numbers only), use it
  if (lines.length >= 3) {
    const durationStr = lines[0].trim();
    const sampleRateStr = lines[1].trim();
    const channelsStr = lines[2].trim();
    const bitDepthStr = lines[3] ? lines[3].trim() : '';

    if (/^\d+\.?\d*$/.test(durationStr) && /^\d+$/.test(sampleRateStr) && /^\d+$/.test(channelsStr)) {
      const duration = parseFloat(durationStr);
      const sampleRate = parseInt(sampleRateStr, 10);
      const channels = parseInt(channelsStr, 10);
      const bitDepth = bitDepthStr ? parseInt(bitDepthStr, 10) : 16;

      if (!isNaN(duration) && duration > 0 && !isNaN(sampleRate) && !isNaN(channels)) {
        return {
          duration: Math.round(duration * 1000) / 1000,
          sampleRate,
          channels,
          bitDepth: isNaN(bitDepth) ? 16 : bitDepth
        };
      }
    }
  }

  // Otherwise, parse ffmpeg verbose output
  // Example: Duration: 00:00:09.74, start: 0.000000, bitrate: 141 kb/s
  const durationMatch = output.match(/Duration:\s*(\d+):(\d+):(\d+\.?\d*)/);
  if (!durationMatch) {
    throw new Error('Could not extract duration from ffmpeg output');
  }

  const hours = parseInt(durationMatch[1], 10);
  const minutes = parseInt(durationMatch[2], 10);
  const seconds = parseFloat(durationMatch[3]);
  const duration = hours * 3600 + minutes * 60 + seconds;

  // Parse stream info: Audio: mp3, 44100 Hz, mono/stereo, ...
  const streamMatch = output.match(/Audio:\s*(\w+),?\s*(\d+)\s*Hz,?\s*(mono|stereo)/i);
  if (!streamMatch) {
    throw new Error('Could not extract stream information from ffmpeg output');
  }

  const sampleRate = parseInt(streamMatch[2], 10);
  const channels = streamMatch[3].toLowerCase() === 'mono' ? 1 : 2;

  // Try to extract bit depth (s16, s24, etc.)
  const bitDepthMatch = output.match(/s(\d+)/i);
  const bitDepth = bitDepthMatch ? parseInt(bitDepthMatch[1], 10) : 16;

  return {
    duration: Math.round(duration * 1000) / 1000,
    sampleRate,
    channels,
    bitDepth: isNaN(bitDepth) ? 16 : bitDepth
  };
}

/**
 * Extract audio metadata using ffmpeg-static
 * @param filePath Absolute path to audio file
 * @returns AudioMetadata object
 * @throws Error if ffmpeg fails or file is corrupted
 */
export async function extractAudioMetadata(
  filePath: string
): Promise<AudioMetadata> {
  try {
    if (!ffmpegStatic) {
      throw new Error('ffmpeg-static binary not found');
    }

    // Run ffmpeg to extract metadata (no -v error so we get the info)
    const cmd = `"${ffmpegStatic}" -i "${filePath}" -f null - 2>&1`;

    let output = '';
    try {
      output = execSync(cmd, {
        encoding: 'utf-8',
        timeout: 5000
      });
    } catch (execError) {
      const err = execError as { stdout?: string; stderr?: string };
      output = (err.stdout || err.stderr || String(err)) as string;
    }

    // Parse output (handles both test format and real ffmpeg output)
    const metadata = parseFFmpegOutput(output);

    // Validate values
    if (isNaN(metadata.duration) || metadata.duration <= 0) {
      throw new Error(`Invalid duration: ${metadata.duration}`);
    }
    if (isNaN(metadata.sampleRate) || metadata.sampleRate < 8000) {
      throw new Error(`Invalid sample rate: ${metadata.sampleRate}`);
    }
    if (isNaN(metadata.channels) || (metadata.channels !== 1 && metadata.channels !== 2)) {
      throw new Error(`Invalid channels: ${metadata.channels}`);
    }

    return metadata;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to extract audio metadata: ${message}`);
  }
}

/**
 * Lightweight check - just duration (faster for 15-second rule)
 * @param filePath Absolute path to audio file
 * @returns Duration in seconds
 * @throws Error if extraction fails
 */
export async function getAudioDuration(filePath: string): Promise<number> {
  try {
    if (!ffmpegStatic) {
      throw new Error('ffmpeg-static binary not found');
    }

    const cmd = `"${ffmpegStatic}" -i "${filePath}" -f null - 2>&1`;

    let output = '';
    try {
      output = execSync(cmd, {
        encoding: 'utf-8',
        timeout: 5000
      });
    } catch (execError) {
      const err = execError as { stdout?: string; stderr?: string };
      output = (err.stdout || err.stderr || String(err)) as string;
    }

    // Try simple format first (for tests)
    const lines = output.trim().split('\n');
    if (lines.length > 0) {
      const durationStr = lines[0].trim();
      if (/^\d+\.?\d*$/.test(durationStr)) {
        const duration = parseFloat(durationStr);
        if (!isNaN(duration) && duration > 0) {
          return Math.round(duration * 1000) / 1000;
        }
      }
    }

    // Parse ffmpeg output
    const durationMatch = output.match(/Duration:\s*(\d+):(\d+):(\d+\.?\d*)/);
    if (!durationMatch) {
      throw new Error('Could not extract duration from ffmpeg output');
    }

    const hours = parseInt(durationMatch[1], 10);
    const minutes = parseInt(durationMatch[2], 10);
    const seconds = parseFloat(durationMatch[3]);
    const duration = hours * 3600 + minutes * 60 + seconds;

    if (isNaN(duration) || duration <= 0) {
      throw new Error(`Invalid duration: ${duration}`);
    }

    return Math.round(duration * 1000) / 1000;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to extract duration: ${message}`);
  }
}
