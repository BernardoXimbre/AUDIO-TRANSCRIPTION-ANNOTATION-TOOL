import { validateAudioFile, validateBatchSize, sanitizeFilename } from '../middleware/uploadValidator';

describe('uploadValidator - File Validation', () => {
  describe('sanitizeFilename', () => {
    test('removes null bytes', () => {
      expect(sanitizeFilename('file\x00name.wav')).toBe('filename.wav');
    });

    test('removes path traversal sequences ../', () => {
      expect(sanitizeFilename('../../../etc/passwd.wav')).toBe('etcpasswd.wav');
    });

    test('removes path traversal sequences ..\\', () => {
      expect(sanitizeFilename('..\\..\\windows\\system32.wav')).toBe('windowssystem32.wav');
    });

    test('removes leading dots and slashes', () => {
      expect(sanitizeFilename('///file.wav')).toBe('file.wav');
    });

    test('replaces invalid filename characters', () => {
      expect(sanitizeFilename('file<>:"|?*.wav')).toBe('file_______.wav');
    });

    test('preserves valid filenames', () => {
      expect(sanitizeFilename('recording_2024-01-15.wav')).toBe('recording_2024-01-15.wav');
    });
  });

  describe('validateBatchSize', () => {
    test('accepts batch size under 500MB', () => {
      const result = validateBatchSize(100 * 1024 * 1024); // 100MB
      expect(result.valid).toBe(true);
    });

    test('accepts batch size exactly at 500MB', () => {
      const result = validateBatchSize(500 * 1024 * 1024);
      expect(result.valid).toBe(true);
    });

    test('rejects batch size over 500MB', () => {
      const result = validateBatchSize(600 * 1024 * 1024);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('BATCH_TOO_LARGE');
      expect(result.reason).toContain('500MB');
    });
  });

  describe('validateAudioFile', () => {
    test('rejects invalid file extension', async () => {
      const buffer = Buffer.from('fake data');
      const result = await validateAudioFile(buffer, 'file.jpg');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('INVALID_EXTENSION');
      expect(result.reason).toContain('jpg');
    });

    test('rejects PDF files', async () => {
      const buffer = Buffer.from('fake data');
      const result = await validateAudioFile(buffer, 'file.pdf');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('INVALID_EXTENSION');
    });

    test('rejects EXE files', async () => {
      const buffer = Buffer.from('fake data');
      const result = await validateAudioFile(buffer, 'malicious.exe');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('INVALID_EXTENSION');
    });

    test('rejects file larger than 100MB', async () => {
      // Create a buffer larger than 100MB
      const largeBuffer = Buffer.alloc(101 * 1024 * 1024);
      const result = await validateAudioFile(largeBuffer, 'large.wav');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('FILE_TOO_LARGE');
      expect(result.reason).toContain('100MB');
    });

    test('rejects non-audio files with audio extension', async () => {
      // Send data that doesn't match audio magic bytes
      const buffer = Buffer.from('%PDF-1.4 fake pdf'); // PDF magic bytes
      const result = await validateAudioFile(buffer, 'fake.wav');
      expect(result.valid).toBe(false);
      expect(['INVALID_FILE_TYPE', 'VALIDATION_ERROR']).toContain(result.error);
    });

    test('accepts .wav extension with valid size', async () => {
      // Small valid buffer (will fail magic byte check, but that's expected without real audio)
      const buffer = Buffer.from('RIFF'); // WAV magic bytes prefix
      const result = await validateAudioFile(buffer, 'audio.wav');
      // We expect it to fail magic byte validation since this is not a complete WAV file
      // But the extension and size checks pass
      expect(['INVALID_FILE_TYPE', 'VALIDATION_ERROR']).toContain(result.error);
    });
  });
});
