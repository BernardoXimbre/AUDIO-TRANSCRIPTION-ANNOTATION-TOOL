interface IngestResult {
  audioFiles: Record<string, unknown>[];
  transcripts: Record<string, unknown>[];
  autoRejectedCount: number;
}

interface TranscriptData {
  path: string;
  label: string;
}

export const ingestService = {
  async processIngest(
    _files: Express.Multer.File[],
    _transcriptData: TranscriptData[]
  ): Promise<IngestResult> {
    // Task 1.1: Stub - just return empty arrays
    // Task 1.2+ will add actual validation and processing

    return {
      audioFiles: [],
      transcripts: [],
      autoRejectedCount: 0
    };
  }
};
