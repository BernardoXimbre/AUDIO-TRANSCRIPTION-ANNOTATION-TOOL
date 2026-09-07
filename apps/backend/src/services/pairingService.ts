import * as path from 'path';

export interface AudioFileRecord {
  filename: string;
  filePath: string;
  duration: number;
}

export interface TranscriptRecord {
  path: string;
  label: string;
}

export interface PairingResult {
  filename: string;
  transcriptPath: string;
}

export interface PairingReport {
  matched: PairingResult[];
  unmatchedAudio: string[];
  unmatchedTranscripts: string[];
}

export interface ManualPairingRequest {
  audioFilename: string;
  transcriptPath: string;
}

const normalizeFilename = (filename: string): string => {
  return path.basename(filename).toLowerCase();
};

const getFilenameWithoutExtension = (filename: string): string => {
  const normalized = normalizeFilename(filename);
  return normalized.replace(/\.[^.]+$/, '');
};

export const pairingService = {
  /**
   * Auto-matches audio files to transcripts by filename
   * Supports exact match and extension-agnostic matching
   * E.g., "op_880.wav" matches transcript path "op_880" or "op_880.json"
   */
  matchTranscriptsToAudio(
    audioFiles: AudioFileRecord[],
    transcripts: TranscriptRecord[]
  ): PairingReport {
    const matched: PairingResult[] = [];
    const matchedAudioFilenames = new Set<string>();
    const matchedTranscriptPaths = new Set<string>();

    for (const transcript of transcripts) {
      // Skip if this transcript is already matched
      if (matchedTranscriptPaths.has(transcript.path)) {
        continue;
      }

      const transcriptNormalized = normalizeFilename(transcript.path);
      const transcriptWithoutExt = getFilenameWithoutExtension(transcript.path);

      for (const audio of audioFiles) {
        // Skip if this audio file is already matched
        if (matchedAudioFilenames.has(audio.filename)) {
          continue;
        }

        const audioNormalized = normalizeFilename(audio.filename);
        const audioWithoutExt = getFilenameWithoutExtension(audio.filename);

        // Exact match (including extension)
        if (audioNormalized === transcriptNormalized) {
          matched.push({
            filename: audio.filename,
            transcriptPath: transcript.path
          });
          matchedAudioFilenames.add(audio.filename);
          matchedTranscriptPaths.add(transcript.path);
          break;
        }

        // Extension-agnostic match (filenames without extensions match)
        if (
          audioWithoutExt === transcriptWithoutExt &&
          audioWithoutExt.length > 0
        ) {
          matched.push({
            filename: audio.filename,
            transcriptPath: transcript.path
          });
          matchedAudioFilenames.add(audio.filename);
          matchedTranscriptPaths.add(transcript.path);
          break;
        }
      }
    }

    const unmatchedAudio = audioFiles
      .map((a) => a.filename)
      .filter((filename) => !matchedAudioFilenames.has(filename));

    const unmatchedTranscripts = transcripts
      .map((t) => t.path)
      .filter((path_) => !matchedTranscriptPaths.has(path_));

    return {
      matched,
      unmatchedAudio,
      unmatchedTranscripts
    };
  },

  /**
   * Manually pair an audio file with a transcript
   */
  manualPair(
    audioFiles: AudioFileRecord[],
    transcripts: TranscriptRecord[],
    request: ManualPairingRequest,
    existingMatches: PairingResult[]
  ): PairingResult[] {
    // Validate audio file exists
    const audioExists = audioFiles.some(
      (a) => normalizeFilename(a.filename) === normalizeFilename(request.audioFilename)
    );
    if (!audioExists) {
      throw new Error(`Audio file not found: ${request.audioFilename}`);
    }

    // Validate transcript exists
    const transcriptExists = transcripts.some(
      (t) => normalizeFilename(t.path) === normalizeFilename(request.transcriptPath)
    );
    if (!transcriptExists) {
      throw new Error(`Transcript not found: ${request.transcriptPath}`);
    }

    // Remove any existing pairs for these items
    const filtered = existingMatches.filter(
      (pair) =>
        normalizeFilename(pair.filename) !==
          normalizeFilename(request.audioFilename) &&
        normalizeFilename(pair.transcriptPath) !==
          normalizeFilename(request.transcriptPath)
    );

    // Add new pairing
    filtered.push({
      filename: request.audioFilename,
      transcriptPath: request.transcriptPath
    });

    return filtered;
  },

  /**
   * Manually unpair an audio file from a transcript
   */
  manualUnpair(
    request: ManualPairingRequest,
    existingMatches: PairingResult[]
  ): PairingResult[] {
    return existingMatches.filter(
      (pair) =>
        normalizeFilename(pair.filename) !==
          normalizeFilename(request.audioFilename) ||
        normalizeFilename(pair.transcriptPath) !==
          normalizeFilename(request.transcriptPath)
    );
  },

  /**
   * Get unmatched items summary
   */
  getUnmatchedItems(report: PairingReport): {
    unmatchedCount: number;
    audioMissing: boolean;
    transcriptMissing: boolean;
  } {
    return {
      unmatchedCount:
        report.unmatchedAudio.length + report.unmatchedTranscripts.length,
      audioMissing: report.unmatchedAudio.length > 0,
      transcriptMissing: report.unmatchedTranscripts.length > 0
    };
  }
};
