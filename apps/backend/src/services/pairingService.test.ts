import {
  pairingService,
  AudioFileRecord,
  TranscriptRecord,
  PairingReport
} from './pairingService';

describe('pairingService', () => {
  describe('matchTranscriptsToAudio', () => {
    it('should match audio and transcript with exact filename match', () => {
      const audioFiles: AudioFileRecord[] = [
        { filename: 'op_880.wav', filePath: '/audio/op_880.wav', duration: 45.5 }
      ];
      const transcripts: TranscriptRecord[] = [
        { path: 'op_880.wav', label: 'Test label' }
      ];

      const result = pairingService.matchTranscriptsToAudio(audioFiles, transcripts);

      expect(result.matched).toHaveLength(1);
      expect(result.matched[0].filename).toBe('op_880.wav');
      expect(result.matched[0].transcriptPath).toBe('op_880.wav');
      expect(result.unmatchedAudio).toHaveLength(0);
      expect(result.unmatchedTranscripts).toHaveLength(0);
    });

    it('should match audio and transcript ignoring extension', () => {
      const audioFiles: AudioFileRecord[] = [
        { filename: 'op_880.wav', filePath: '/audio/op_880.wav', duration: 45.5 }
      ];
      const transcripts: TranscriptRecord[] = [
        { path: 'op_880', label: 'Test label' }
      ];

      const result = pairingService.matchTranscriptsToAudio(audioFiles, transcripts);

      expect(result.matched).toHaveLength(1);
      expect(result.matched[0].filename).toBe('op_880.wav');
      expect(result.matched[0].transcriptPath).toBe('op_880');
      expect(result.unmatchedAudio).toHaveLength(0);
      expect(result.unmatchedTranscripts).toHaveLength(0);
    });

    it('should match audio and transcript with transcript extension', () => {
      const audioFiles: AudioFileRecord[] = [
        { filename: 'op_880.wav', filePath: '/audio/op_880.wav', duration: 45.5 }
      ];
      const transcripts: TranscriptRecord[] = [
        { path: 'op_880.json', label: 'Test label' }
      ];

      const result = pairingService.matchTranscriptsToAudio(audioFiles, transcripts);

      expect(result.matched).toHaveLength(1);
      expect(result.matched[0].filename).toBe('op_880.wav');
      expect(result.matched[0].transcriptPath).toBe('op_880.json');
    });

    it('should be case-insensitive', () => {
      const audioFiles: AudioFileRecord[] = [
        { filename: 'OP_880.WAV', filePath: '/audio/OP_880.WAV', duration: 45.5 }
      ];
      const transcripts: TranscriptRecord[] = [
        { path: 'op_880', label: 'Test label' }
      ];

      const result = pairingService.matchTranscriptsToAudio(audioFiles, transcripts);

      expect(result.matched).toHaveLength(1);
      expect(result.unmatchedAudio).toHaveLength(0);
      expect(result.unmatchedTranscripts).toHaveLength(0);
    });

    it('should detect unmatched audio files', () => {
      const audioFiles: AudioFileRecord[] = [
        { filename: 'op_880.wav', filePath: '/audio/op_880.wav', duration: 45.5 },
        { filename: 'op_881.wav', filePath: '/audio/op_881.wav', duration: 30.0 }
      ];
      const transcripts: TranscriptRecord[] = [
        { path: 'op_880', label: 'Test label' }
      ];

      const result = pairingService.matchTranscriptsToAudio(audioFiles, transcripts);

      expect(result.matched).toHaveLength(1);
      expect(result.unmatchedAudio).toHaveLength(1);
      expect(result.unmatchedAudio[0]).toBe('op_881.wav');
      expect(result.unmatchedTranscripts).toHaveLength(0);
    });

    it('should detect unmatched transcript files', () => {
      const audioFiles: AudioFileRecord[] = [
        { filename: 'op_880.wav', filePath: '/audio/op_880.wav', duration: 45.5 }
      ];
      const transcripts: TranscriptRecord[] = [
        { path: 'op_880', label: 'Test label' },
        { path: 'op_881', label: 'Another label' }
      ];

      const result = pairingService.matchTranscriptsToAudio(audioFiles, transcripts);

      expect(result.matched).toHaveLength(1);
      expect(result.unmatchedAudio).toHaveLength(0);
      expect(result.unmatchedTranscripts).toHaveLength(1);
      expect(result.unmatchedTranscripts[0]).toBe('op_881');
    });

    it('should handle multiple files with partial matching', () => {
      const audioFiles: AudioFileRecord[] = [
        { filename: 'op_880.wav', filePath: '/audio/op_880.wav', duration: 45.5 },
        { filename: 'op_881.wav', filePath: '/audio/op_881.wav', duration: 30.0 },
        { filename: 'op_882.wav', filePath: '/audio/op_882.wav', duration: 20.0 }
      ];
      const transcripts: TranscriptRecord[] = [
        { path: 'op_880', label: 'First' },
        { path: 'op_881.json', label: 'Second' },
        { path: 'op_883', label: 'Third (no audio)' }
      ];

      const result = pairingService.matchTranscriptsToAudio(audioFiles, transcripts);

      expect(result.matched).toHaveLength(2);
      expect(result.unmatchedAudio).toHaveLength(1);
      expect(result.unmatchedAudio[0]).toBe('op_882.wav');
      expect(result.unmatchedTranscripts).toHaveLength(1);
      expect(result.unmatchedTranscripts[0]).toBe('op_883');
    });

    it('should handle empty audio files list', () => {
      const audioFiles: AudioFileRecord[] = [];
      const transcripts: TranscriptRecord[] = [
        { path: 'op_880', label: 'Test label' }
      ];

      const result = pairingService.matchTranscriptsToAudio(audioFiles, transcripts);

      expect(result.matched).toHaveLength(0);
      expect(result.unmatchedAudio).toHaveLength(0);
      expect(result.unmatchedTranscripts).toHaveLength(1);
    });

    it('should handle empty transcripts list', () => {
      const audioFiles: AudioFileRecord[] = [
        { filename: 'op_880.wav', filePath: '/audio/op_880.wav', duration: 45.5 }
      ];
      const transcripts: TranscriptRecord[] = [];

      const result = pairingService.matchTranscriptsToAudio(audioFiles, transcripts);

      expect(result.matched).toHaveLength(0);
      expect(result.unmatchedAudio).toHaveLength(1);
      expect(result.unmatchedTranscripts).toHaveLength(0);
    });

    it('should prefer exact extension match over extension-agnostic match', () => {
      const audioFiles: AudioFileRecord[] = [
        { filename: 'op_880.wav', filePath: '/audio/op_880.wav', duration: 45.5 }
      ];
      const transcripts: TranscriptRecord[] = [
        { path: 'op_880.wav', label: 'Exact match' },
        { path: 'op_880', label: 'No extension' }
      ];

      const result = pairingService.matchTranscriptsToAudio(audioFiles, transcripts);

      // Should match first transcript exactly, but second should be unmatched
      expect(result.matched).toHaveLength(1);
      expect(result.matched[0].transcriptPath).toBe('op_880.wav');
      expect(result.unmatchedTranscripts).toHaveLength(1);
      expect(result.unmatchedTranscripts[0]).toBe('op_880');
    });
  });

  describe('manualPair', () => {
    it('should successfully pair audio and transcript', () => {
      const audioFiles: AudioFileRecord[] = [
        { filename: 'op_880.wav', filePath: '/audio/op_880.wav', duration: 45.5 }
      ];
      const transcripts: TranscriptRecord[] = [
        { path: 'op_880', label: 'Test label' }
      ];
      const existingMatches = [];

      const result = pairingService.manualPair(
        audioFiles,
        transcripts,
        { audioFilename: 'op_880.wav', transcriptPath: 'op_880' },
        existingMatches
      );

      expect(result).toHaveLength(1);
      expect(result[0].filename).toBe('op_880.wav');
      expect(result[0].transcriptPath).toBe('op_880');
    });

    it('should throw error if audio file does not exist', () => {
      const audioFiles: AudioFileRecord[] = [
        { filename: 'op_880.wav', filePath: '/audio/op_880.wav', duration: 45.5 }
      ];
      const transcripts: TranscriptRecord[] = [
        { path: 'op_880', label: 'Test label' }
      ];

      expect(() => {
        pairingService.manualPair(
          audioFiles,
          transcripts,
          { audioFilename: 'op_999.wav', transcriptPath: 'op_880' },
          []
        );
      }).toThrow('Audio file not found');
    });

    it('should throw error if transcript does not exist', () => {
      const audioFiles: AudioFileRecord[] = [
        { filename: 'op_880.wav', filePath: '/audio/op_880.wav', duration: 45.5 }
      ];
      const transcripts: TranscriptRecord[] = [
        { path: 'op_880', label: 'Test label' }
      ];

      expect(() => {
        pairingService.manualPair(
          audioFiles,
          transcripts,
          { audioFilename: 'op_880.wav', transcriptPath: 'op_999' },
          []
        );
      }).toThrow('Transcript not found');
    });

    it('should replace existing pair when re-pairing', () => {
      const audioFiles: AudioFileRecord[] = [
        { filename: 'op_880.wav', filePath: '/audio/op_880.wav', duration: 45.5 }
      ];
      const transcripts: TranscriptRecord[] = [
        { path: 'op_880', label: 'First' },
        { path: 'op_881', label: 'Second' }
      ];
      const existingMatches = [
        { filename: 'op_880.wav', transcriptPath: 'op_880' }
      ];

      const result = pairingService.manualPair(
        audioFiles,
        transcripts,
        { audioFilename: 'op_880.wav', transcriptPath: 'op_881' },
        existingMatches
      );

      expect(result).toHaveLength(1);
      expect(result[0].transcriptPath).toBe('op_881');
    });

    it('should be case-insensitive for file matching', () => {
      const audioFiles: AudioFileRecord[] = [
        { filename: 'OP_880.WAV', filePath: '/audio/OP_880.WAV', duration: 45.5 }
      ];
      const transcripts: TranscriptRecord[] = [
        { path: 'op_880', label: 'Test label' }
      ];

      const result = pairingService.manualPair(
        audioFiles,
        transcripts,
        { audioFilename: 'op_880.wav', transcriptPath: 'OP_880' },
        []
      );

      expect(result).toHaveLength(1);
    });
  });

  describe('manualUnpair', () => {
    it('should successfully unpair audio and transcript', () => {
      const existingMatches = [
        { filename: 'op_880.wav', transcriptPath: 'op_880' },
        { filename: 'op_881.wav', transcriptPath: 'op_881' }
      ];

      const result = pairingService.manualUnpair(
        { audioFilename: 'op_880.wav', transcriptPath: 'op_880' },
        existingMatches
      );

      expect(result).toHaveLength(1);
      expect(result[0].filename).toBe('op_881.wav');
    });

    it('should be case-insensitive for unpairing', () => {
      const existingMatches = [
        { filename: 'op_880.wav', transcriptPath: 'op_880' }
      ];

      const result = pairingService.manualUnpair(
        { audioFilename: 'OP_880.WAV', transcriptPath: 'OP_880' },
        existingMatches
      );

      expect(result).toHaveLength(0);
    });

    it('should do nothing if pair does not exist', () => {
      const existingMatches = [
        { filename: 'op_880.wav', transcriptPath: 'op_880' }
      ];

      const result = pairingService.manualUnpair(
        { audioFilename: 'op_999.wav', transcriptPath: 'op_999' },
        existingMatches
      );

      expect(result).toHaveLength(1);
    });
  });

  describe('getUnmatchedItems', () => {
    it('should return zero unmatched count when all matched', () => {
      const report: PairingReport = {
        matched: [{ filename: 'op_880.wav', transcriptPath: 'op_880' }],
        unmatchedAudio: [],
        unmatchedTranscripts: []
      };

      const result = pairingService.getUnmatchedItems(report);

      expect(result.unmatchedCount).toBe(0);
      expect(result.audioMissing).toBe(false);
      expect(result.transcriptMissing).toBe(false);
    });

    it('should report unmatched audio', () => {
      const report: PairingReport = {
        matched: [],
        unmatchedAudio: ['op_880.wav', 'op_881.wav'],
        unmatchedTranscripts: []
      };

      const result = pairingService.getUnmatchedItems(report);

      expect(result.unmatchedCount).toBe(2);
      expect(result.audioMissing).toBe(true);
      expect(result.transcriptMissing).toBe(false);
    });

    it('should report unmatched transcripts', () => {
      const report: PairingReport = {
        matched: [],
        unmatchedAudio: [],
        unmatchedTranscripts: ['op_880', 'op_881']
      };

      const result = pairingService.getUnmatchedItems(report);

      expect(result.unmatchedCount).toBe(2);
      expect(result.audioMissing).toBe(false);
      expect(result.transcriptMissing).toBe(true);
    });

    it('should report both unmatched audio and transcripts', () => {
      const report: PairingReport = {
        matched: [],
        unmatchedAudio: ['op_880.wav'],
        unmatchedTranscripts: ['op_881', 'op_882']
      };

      const result = pairingService.getUnmatchedItems(report);

      expect(result.unmatchedCount).toBe(3);
      expect(result.audioMissing).toBe(true);
      expect(result.transcriptMissing).toBe(true);
    });
  });
});
