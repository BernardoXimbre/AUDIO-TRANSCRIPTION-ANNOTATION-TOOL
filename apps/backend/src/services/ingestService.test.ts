import { ingestService } from './ingestService';
import { transcriptRepository } from '../repositories/transcriptRepository';

// Mock the repository
jest.mock('../repositories/transcriptRepository');

describe('ingestService - getQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all transcripts when no filter is provided', async () => {
    const mockTranscripts = [
      {
        id: '1',
        status: 'pending',
        annotator: null,
        audioFile: {
          id: 'audio-1',
          filename: '01_20s.mp3',
          duration: 20,
          filepath: './uploads/01_20s.mp3',
          sampleRate: 44100,
          channels: 1
        }
      },
      {
        id: '2',
        status: 'in_progress',
        annotator: 'John',
        audioFile: {
          id: 'audio-2',
          filename: '02_30s.mp3',
          duration: 30,
          filepath: './uploads/02_30s.mp3',
          sampleRate: 44100,
          channels: 1
        }
      }
    ];

    (transcriptRepository.findMany as jest.Mock).mockResolvedValue(mockTranscripts);

    const result = await ingestService.getQueue();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('2');
  });

  it('should filter by status when provided', async () => {
    const mockTranscripts = [
      {
        id: '1',
        status: 'pending',
        annotator: null,
        audioFile: {
          id: 'audio-1',
          filename: '01_20s.mp3',
          duration: 20,
          filepath: './uploads/01_20s.mp3',
          sampleRate: 44100,
          channels: 1
        }
      }
    ];

    (transcriptRepository.findMany as jest.Mock).mockResolvedValue(mockTranscripts);

    const result = await ingestService.getQueue('pending');

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('pending');
    expect(transcriptRepository.findMany).toHaveBeenCalledWith(
      { status: 'pending' },
      expect.any(Object),
      expect.any(Object)
    );
  });

  it('should sort by duration ascending by default', async () => {
    const mockTranscripts = [
      {
        id: '1',
        status: 'pending',
        annotator: null,
        audioFile: {
          id: 'audio-1',
          filename: '01_20s.mp3',
          duration: 20,
          filepath: './uploads/01_20s.mp3',
          sampleRate: 44100,
          channels: 1
        }
      },
      {
        id: '2',
        status: 'pending',
        annotator: null,
        audioFile: {
          id: 'audio-2',
          filename: '02_30s.mp3',
          duration: 30,
          filepath: './uploads/02_30s.mp3',
          sampleRate: 44100,
          channels: 1
        }
      }
    ];

    (transcriptRepository.findMany as jest.Mock).mockResolvedValue(mockTranscripts);

    const result = await ingestService.getQueue();

    // Verify sorting parameter was passed
    expect(transcriptRepository.findMany).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      { audioFile: { duration: 'asc' } }
    );

    // Verify results are sorted by duration
    expect(result[0].audioFile.duration).toBe(20);
    expect(result[1].audioFile.duration).toBe(30);
  });

  it('should return correct fields from audioFile', async () => {
    const mockTranscripts = [
      {
        id: 'transcript-1',
        status: 'pending',
        annotator: null,
        audioFile: {
          id: 'audio-1',
          filename: '01_20s.mp3',
          duration: 20.5,
          filepath: './uploads/01_20s.mp3',
          sampleRate: 44100,
          channels: 2
        }
      }
    ];

    (transcriptRepository.findMany as jest.Mock).mockResolvedValue(mockTranscripts);

    const result = await ingestService.getQueue();

    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('status');
    expect(result[0]).toHaveProperty('annotator');
    expect(result[0]).toHaveProperty('audioFile');
    expect(result[0].audioFile).toHaveProperty('id');
    expect(result[0].audioFile).toHaveProperty('filename');
    expect(result[0].audioFile).toHaveProperty('duration');
    expect(result[0].audioFile).toHaveProperty('filepath');
    expect(result[0].audioFile).toHaveProperty('sampleRate');
    expect(result[0].audioFile).toHaveProperty('channels');
  });

  it('should return empty array when no transcripts exist', async () => {
    (transcriptRepository.findMany as jest.Mock).mockResolvedValue([]);

    const result = await ingestService.getQueue();

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle database errors gracefully', async () => {
    const dbError = new Error('Database connection failed');
    (transcriptRepository.findMany as jest.Mock).mockRejectedValue(dbError);

    await expect(ingestService.getQueue()).rejects.toThrow('Database connection failed');
  });
});
