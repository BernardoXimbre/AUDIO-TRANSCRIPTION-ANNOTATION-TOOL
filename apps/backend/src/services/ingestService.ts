import { prisma } from '../db'

interface IngestResult {
  audioFiles: any[]
  transcripts: any[]
  autoRejectedCount: number
}

export const ingestService = {
  async processIngest(files: any[], transcriptData: any[]): Promise<IngestResult> {
    // Task 1.1: Stub - just return empty arrays
    // Task 1.2+ will add actual validation and processing
    
    return {
      audioFiles: [],
      transcripts: [],
      autoRejectedCount: 0
    }
  }
}
