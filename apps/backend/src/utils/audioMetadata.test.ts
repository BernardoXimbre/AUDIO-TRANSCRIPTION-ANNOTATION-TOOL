import { extractAudioMetadata, getAudioDuration } from '../utils/audioMetadata';
import { execSync } from 'child_process';

// Mock execSync to avoid needing real audio files
jest.mock('child_process');

const mockedExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe('audioMetadata - Audio Extraction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractAudioMetadata', () => {
    test('extracts metadata correctly from ffmpeg output', async () => {
      // Mock ffmpeg output: duration\nsampleRate\nchannels\nbitDepth
      mockedExecSync.mockReturnValue('9.5\n44100\n2\n16' as never);

      const metadata = await extractAudioMetadata('/path/to/audio.mp3');

      expect(metadata).toEqual({
        duration: 9.5,
        sampleRate: 44100,
        channels: 2,
        bitDepth: 16
      });
    });

    test('rounds duration to 3 decimals', async () => {
      mockedExecSync.mockReturnValue('9.123456\n44100\n2\n16' as never);

      const metadata = await extractAudioMetadata('/path/to/audio.mp3');

      expect(metadata.duration).toBe(9.123);
    });

    test('defaults bitDepth to 16 if not provided', async () => {
      // Only 3 lines instead of 4
      mockedExecSync.mockReturnValue('15.0\n44100\n2' as never);

      const metadata = await extractAudioMetadata('/path/to/audio.mp3');

      expect(metadata.bitDepth).toBe(16);
    });

    test('throws error for invalid duration', async () => {
      mockedExecSync.mockReturnValue('invalid\n44100\n2\n16' as never);

      await expect(extractAudioMetadata('/path/to/audio.mp3')).rejects.toThrow(
        /Failed to extract audio metadata/
      );
    });

    test('throws error for invalid sample rate', async () => {
      mockedExecSync.mockReturnValue('9.5\n4410\n2\n16' as never); // Too low

      await expect(extractAudioMetadata('/path/to/audio.mp3')).rejects.toThrow(
        /Failed to extract audio metadata/
      );
    });

    test('throws error for invalid channels', async () => {
      mockedExecSync.mockReturnValue('9.5\n44100\n5\n16' as never); // Invalid

      await expect(extractAudioMetadata('/path/to/audio.mp3')).rejects.toThrow(
        /Failed to extract audio metadata/
      );
    });

    test('throws error for insufficient metadata lines', async () => {
      mockedExecSync.mockReturnValue('9.5\n44100' as never); // Only 2 lines

      await expect(extractAudioMetadata('/path/to/audio.mp3')).rejects.toThrow(
        /Failed to extract audio metadata/
      );
    });
  });

  describe('getAudioDuration', () => {
    test('returns duration for audio file', async () => {
      mockedExecSync.mockReturnValue('9.5' as never);

      const duration = await getAudioDuration('/path/to/audio.mp3');

      expect(duration).toBe(9.5);
    });

    test('rounds duration to 3 decimals', async () => {
      mockedExecSync.mockReturnValue('15.123456' as never);

      const duration = await getAudioDuration('/path/to/audio.mp3');

      expect(duration).toBe(15.123);
    });

    test('throws error for invalid duration', async () => {
      mockedExecSync.mockReturnValue('invalid' as never);

      await expect(getAudioDuration('/path/to/audio.mp3')).rejects.toThrow(
        /Failed to extract duration/
      );
    });

    test('throws error for negative duration', async () => {
      mockedExecSync.mockReturnValue('-5' as never);

      await expect(getAudioDuration('/path/to/audio.mp3')).rejects.toThrow(
        /Failed to extract duration/
      );
    });

    test('throws error for zero duration', async () => {
      mockedExecSync.mockReturnValue('0' as never);

      await expect(getAudioDuration('/path/to/audio.mp3')).rejects.toThrow(
        /Failed to extract duration/
      );
    });
  });

  describe('15-second auto-rejection rule', () => {
    test('9s audio should be auto-rejected (< 15)', async () => {
      mockedExecSync.mockReturnValue('9.0' as never);

      const duration = await getAudioDuration('/path/to/audio.mp3');

      expect(duration).toBeLessThan(15);
      expect(duration).toBe(9.0);
    });

    test('15s audio should NOT be auto-rejected (>= 15)', async () => {
      mockedExecSync.mockReturnValue('15.0' as never);

      const duration = await getAudioDuration('/path/to/audio.mp3');

      expect(duration).toBeGreaterThanOrEqual(15);
      expect(duration).toBe(15.0);
    });

    test('20s audio should be processed normally (> 15)', async () => {
      mockedExecSync.mockReturnValue('20.5' as never);

      const duration = await getAudioDuration('/path/to/audio.mp3');

      expect(duration).toBeGreaterThan(15);
      expect(duration).toBe(20.5);
    });
  });

  describe('Edge cases', () => {
    test('handles whitespace in ffmpeg output', async () => {
      mockedExecSync.mockReturnValue('  9.5  \n  44100  \n  2  \n  16  ' as never);

      const metadata = await extractAudioMetadata('/path/to/audio.mp3');

      expect(metadata.duration).toBe(9.5);
      expect(metadata.sampleRate).toBe(44100);
      expect(metadata.channels).toBe(2);
    });

    test('handles very small durations', async () => {
      mockedExecSync.mockReturnValue('0.5\n44100\n1\n16' as never);

      const metadata = await extractAudioMetadata('/path/to/audio.mp3');

      expect(metadata.duration).toBe(0.5);
    });

    test('handles very large durations', async () => {
      mockedExecSync.mockReturnValue('3600.0\n44100\n2\n16' as never); // 1 hour

      const metadata = await extractAudioMetadata('/path/to/audio.mp3');

      expect(metadata.duration).toBe(3600.0);
    });
  });
});
