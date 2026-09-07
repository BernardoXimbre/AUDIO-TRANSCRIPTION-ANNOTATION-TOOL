import path from 'path';

// Allowed audio MIME types
const ALLOWED_MIME_TYPES = ['audio/wav', 'audio/mpeg', 'audio/mp4'];
const ALLOWED_EXTENSIONS = ['.wav', '.mp3', '.m4a'];
const MAX_FILE_SIZE = (process.env.MAX_FILE_SIZE_MB ? parseInt(process.env.MAX_FILE_SIZE_MB, 10) : 100) * 1024 * 1024; // 100MB
const MAX_BATCH_SIZE = (process.env.MAX_BATCH_SIZE_MB ? parseInt(process.env.MAX_BATCH_SIZE_MB, 10) : 500) * 1024 * 1024; // 500MB

export interface ValidationResult {
  valid: boolean;
  error?: string;
  reason?: string;
}

/**
 * Sanitize filename to prevent path traversal attacks
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/\0/g, '') // Remove null bytes
    .replace(/\.\.\//g, '') // Remove ../
    .replace(/\.\.\\/g, '') // Remove ..\
    .replace(/\//g, '') // Remove all forward slashes
    .replace(/\\/g, '') // Remove all backslashes
    .replace(/^[.]+/, '') // Remove leading dots
    .replace(/[<>:"|?*]/g, '_'); // Replace invalid chars with underscore
}

/**
 * Validate audio file by magic bytes
 */
export async function validateAudioFile(
  buffer: Buffer,
  filename: string
): Promise<ValidationResult> {
  // Check file extension
  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: 'INVALID_EXTENSION',
      reason: `Invalid file extension: ${ext}. Allowed: .wav, .mp3, .m4a`
    };
  }

  // Check file size
  if (buffer.length > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'FILE_TOO_LARGE',
      reason: `File exceeds 100MB limit (${(buffer.length / 1024 / 1024).toFixed(2)}MB)`
    };
  }

  // Check magic bytes using dynamic import
  try {
    const { fileTypeFromBuffer } = await import('file-type');
    const fileType = await fileTypeFromBuffer(buffer);
    if (!fileType || !ALLOWED_MIME_TYPES.includes(fileType.mime)) {
      return {
        valid: false,
        error: 'INVALID_FILE_TYPE',
        reason: `Invalid audio format. Detected: ${fileType?.mime || 'unknown'}`
      };
    }
  } catch {
    return {
      valid: false,
      error: 'VALIDATION_ERROR',
      reason: 'Could not validate file type'
    };
  }

  return { valid: true };
}

/**
 * Validate batch size
 */
export function validateBatchSize(totalSize: number): ValidationResult {
  if (totalSize > MAX_BATCH_SIZE) {
    return {
      valid: false,
      error: 'BATCH_TOO_LARGE',
      reason: `Batch exceeds 500MB limit (${(totalSize / 1024 / 1024).toFixed(2)}MB)`
    };
  }
  return { valid: true };
}
