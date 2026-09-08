import { prisma } from '../db';
import * as path from 'path';

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
      // Fetch all transcripts grouped by audio file
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

      // Group transcripts by audio file ID
      const groupedByAudio = new Map<string, typeof transcripts>();
      for (const transcript of transcripts) {
        if (!groupedByAudio.has(transcript.audioFileId)) {
          groupedByAudio.set(transcript.audioFileId, []);
        }
        groupedByAudio.get(transcript.audioFileId)!.push(transcript);
      }

      // Generate export files for each audio
      const results: ExportResult[] = [];

      for (const [audioFileId, audioTranscripts] of groupedByAudio) {
        const audioFile = audioTranscripts[0].audioFile;

        // Generate records for this audio
        const records: ExportRow[] = [];

        for (const transcript of audioTranscripts) {
          const recording = await prisma.recording.findFirst({
            where: {
              audioFileId
            }
          });

          const row: ExportRow = {
            audioPath: audioFile.filename,
            duration: audioFile.duration,
            recordingConditions: {
              sampleRate: audioFile.sampleRate,
              channels: audioFile.channels,
              bitDepth: audioFile.bitDepth,
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

        // Format as JSON with indentation (not JSONL, but pretty JSON)
        const jsonContent = JSON.stringify(records, null, 2);

        // Generate filename based on audio name
        const audioNameWithoutExt = path.parse(audioFile.filename).name;
        const filename = `annotations-${audioNameWithoutExt}.json`;

        results.push({
          filename,
          content: jsonContent
        });
      }

      return results;
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
