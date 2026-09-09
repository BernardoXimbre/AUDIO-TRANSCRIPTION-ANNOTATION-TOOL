import { prisma } from '../db';

interface ExportRow {
  audioPath: string;
  duration: number;
  recordingConditions: {
    sampleRate: number | null;
    channels: number | null;
    bitDepth: number | null;
    speechRate: number | null;
    distanceEstimate: string | null;
  };
  transcript: {
    original: string;
    corrected: string;
  };
  annotations: Array<{
    type: string;
    startOffset: number;
    endOffset: number;
    attributes: Record<string, unknown>;
  }>;
}

interface ExportResult {
  filename: string;
  content: string;
}

export const exportService = {
  async generateJSONLByAudio(): Promise<ExportResult[]> {
    try {
      // Fetch all transcripts
      const transcripts = await prisma.transcript.findMany({
        include: {
          audioFile: true,
          annotations: {
            orderBy: {
              startOffset: 'asc'
            }
          }
        }
      });

      // Generate single consolidated records array
      const records: ExportRow[] = [];

      for (const transcript of transcripts) {
        const recording = await prisma.recording.findFirst({
          where: {
            audioFileId: transcript.audioFileId
          }
        });

        const row: ExportRow = {
          audioPath: transcript.audioFile.filename,
          duration: transcript.audioFile.duration,
          recordingConditions: {
            sampleRate: transcript.audioFile.sampleRate,
            channels: transcript.audioFile.channels,
            bitDepth: transcript.audioFile.bitDepth,
            speechRate: recording?.speechRate ?? null,
            distanceEstimate: recording?.distanceEstimate ?? null
          },
          transcript: {
            original: transcript.originalText,
            corrected: transcript.correctedText
          },
          annotations: transcript.annotations.map(ann => ({
            type: ann.type,
            startOffset: ann.startOffset,
            endOffset: ann.endOffset,
            attributes: ann.attributes as Record<string, unknown>
          }))
        };

        records.push(row);
      }

      // Format as single JSON array with indentation
      const jsonContent = JSON.stringify(records, null, 2);

      // Generate filename with export date
      const filename = `annotations-export-${new Date().toISOString().split('T')[0]}.json`;

      return [{
        filename,
        content: jsonContent
      }];
    } catch (error) {
      console.error('Error generating export:', error);
      throw error;
    }
  },

  // Alternative: single JSONL file with formatted JSON per line
  async generateFormattedJSONL(): Promise<ExportResult> {
    try {
      const transcripts = await prisma.transcript.findMany({
        include: {
          audioFile: true,
          annotations: {
            orderBy: {
              startOffset: 'asc'
            }
          }
        }
      });

      const records: ExportRow[] = [];

      for (const transcript of transcripts) {
        const recording = await prisma.recording.findFirst({
          where: {
            audioFileId: transcript.audioFileId
          }
        });

        const row: ExportRow = {
          audioPath: transcript.audioFile.filename,
          duration: transcript.audioFile.duration,
          recordingConditions: {
            sampleRate: transcript.audioFile.sampleRate,
            channels: transcript.audioFile.channels,
            bitDepth: transcript.audioFile.bitDepth,
            speechRate: recording?.speechRate ?? null,
            distanceEstimate: recording?.distanceEstimate ?? null
          },
          transcript: {
            original: transcript.originalText,
            corrected: transcript.correctedText
          },
          annotations: transcript.annotations.map(ann => ({
            type: ann.type,
            startOffset: ann.startOffset,
            endOffset: ann.endOffset,
            attributes: ann.attributes as Record<string, unknown>
          }))
        };

        records.push(row);
      }

      // Format each record as pretty JSON, one per line
      const jsonlLines = records.map(record => JSON.stringify(record, null, 2));
      const jsonlContent = jsonlLines.join('\n\n'); // Double newline for readability

      return {
        filename: `annotations-export-${new Date().toISOString().split('T')[0]}.jsonl`,
        content: jsonlContent
      };
    } catch (error) {
      console.error('Error generating JSONL:', error);
      throw error;
    }
  }
};
