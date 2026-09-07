import { execSync } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';

export interface AudioMetadata {
  duration: number; // seconds
  sampleRate: number; // Hz
  channels: number; // 1 (mono) or 2 (stereo)
  bitDepth: number; // bits (16, 24, 32)
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

    // Use ffmpeg to extract metadata
    // Format: duration\nsampleRate\nchannels\nbitDepth
    const cmd = `"${ffmpegStatic}" -v error -show_entries format=duration -show_entries stream=sample_rate,channels,bits_per_sample -of default=noprint_wrappers=1:nokey=1:nokey_wrappers=1 "${filePath}"`;

    const output = execSync(cmd, {
      encoding: 'utf-8',
      timeout: 5000 // 5 second timeout
    });

    const lines = output
      .trim()
      .split('\n')
      .filter((l) => l.trim());

    if (lines.length < 3) {
      throw new Error('Insufficient metadata extracted from audio file');
    }

    const duration = parseFloat(lines[0]);
    const sampleRate = parseInt(lines[1], 10);
    const channels = parseInt(lines[2], 10);
    const bitDepth = parseInt(lines[3], 10) || 16; // Default to 16-bit if not found

    // Validate values
    if (isNaN(duration) || duration <= 0) {
      throw new Error(`Invalid duration: ${lines[0]}`);
    }
    if (isNaN(sampleRate) || sampleRate < 8000) {
      throw new Error(`Invalid sample rate: ${lines[1]}`);
    }
    if (isNaN(channels) || (channels !== 1 && channels !== 2)) {
      throw new Error(`Invalid channels: ${lines[2]}`);
    }

    return {
      duration: Math.round(duration * 1000) / 1000, // Round to 3 decimal places
      sampleRate,
      channels,
      bitDepth
    };
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

    const cmd = `"${ffmpegStatic}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1:nokey_wrappers=1 "${filePath}"`;

    const output = execSync(cmd, {
      encoding: 'utf-8',
      timeout: 5000 // 5 second timeout
    });

    const duration = parseFloat(output.trim());

    if (isNaN(duration) || duration <= 0) {
      throw new Error(`Invalid duration: ${output.trim()}`);
    }

    return Math.round(duration * 1000) / 1000; // Round to 3 decimal places
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to extract duration: ${message}`);
  }
}
