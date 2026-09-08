/**
 * Test 5: Export JSONL Schema
 *
 * Scenario: Export corrected transcripts and annotations as formatted JSON.
 * Acceptance: JSON output is valid, contains all required fields, formatted with indentation,
 * and filename matches audio name.
 */

import { PrismaClient } from '@prisma/client';
import { exportService } from '../services/exportService';

const prisma = new PrismaClient();

describe('Export JSONL Schema (Test 5)', () => {
  let audioFileId1: string;
  let audioFileId2: string;
  let transcriptId1: string;
  let transcriptId2: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.annotation.deleteMany({});
    await prisma.recording.deleteMany({});
    await prisma.transcript.deleteMany({});
    await prisma.audioFile.deleteMany({});

    // Create test audio files
    const audioFile1 = await prisma.audioFile.create({
      data: {
        filename: 'export-test-1.wav',
        filepath: '/uploads/export-test-1.wav',
        url: '/uploads/export-test-1.wav',
        duration: 45.2,
        sampleRate: 16000,
        channels: 1,
        bitDepth: 16,
      },
    });
    audioFileId1 = audioFile1.id;

    const audioFile2 = await prisma.audioFile.create({
      data: {
        filename: 'export-test-2.wav',
        filepath: '/uploads/export-test-2.wav',
        url: '/uploads/export-test-2.wav',
        duration: 30.0,
        sampleRate: 44100,
        channels: 2,
        bitDepth: 24,
      },
    });
    audioFileId2 = audioFile2.id;

    // Create transcripts
    const transcript1 = await prisma.transcript.create({
      data: {
        audioFileId: audioFileId1,
        originalText: 'Kontrollierte Rückenlagerung des Patienten...',
        correctedText: 'Kontrollierte Rückenlagerung des Patienten durchgeführt.',
        status: 'completed',
      },
    });
    transcriptId1 = transcript1.id;

    const transcript2 = await prisma.transcript.create({
      data: {
        audioFileId: audioFileId2,
        originalText: 'Steriles Abwaschen und Abdecken des OP-Gebietes...',
        correctedText: 'Steriles Abwaschen und Abdecken des OP-Gebietes durchgeführt.',
        status: 'completed',
      },
    });
    transcriptId2 = transcript2.id;

    // Create recording conditions
    await prisma.recording.create({
      data: {
        audioFileId: audioFileId1,
        speechRate: 125,
        distanceEstimate: 'close',
      },
    });

    // Create annotations for transcript1
    await prisma.annotation.create({
      data: {
        transcriptId: transcriptId1,
        type: 'MEDICAL_TERM',
        startOffset: 0,
        endOffset: 24,
        attributes: {
          category: 'procedure',
          note: 'Patient positioning',
        },
      },
    });

    await prisma.annotation.create({
      data: {
        transcriptId: transcriptId1,
        type: 'MEASUREMENT',
        startOffset: 35,
        endOffset: 43,
        attributes: {
          value: 25,
          unit: 'cm',
          normalized: 0.25,
        },
      },
    });

    // Create annotation for transcript2
    await prisma.annotation.create({
      data: {
        transcriptId: transcriptId2,
        type: 'NUMBER',
        startOffset: 30,
        endOffset: 50,
        attributes: {
          rendering: 'words',
          value: 5,
        },
      },
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.annotation.deleteMany({});
    await prisma.recording.deleteMany({});
    await prisma.transcript.deleteMany({});
    await prisma.audioFile.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // Test 5.1: Export returns multiple results (one per audio)
  it('should return export results grouped by audio file', async () => {
    const results = await exportService.generateJSONLByAudio();

    expect(results).toHaveLength(2);
    expect(results[0]).toHaveProperty('filename');
    expect(results[0]).toHaveProperty('content');
  });

  // Test 5.2: Filenames based on audio names
  it('should generate filenames based on audio names', async () => {
    const results = await exportService.generateJSONLByAudio();

    expect(results[0].filename).toContain('export-test-1');
    expect(results[1].filename).toContain('export-test-2');
    expect(results[0].filename).toMatch(/\.json$/);
  });

  // Test 5.3: JSON is formatted with indentation
  it('should format JSON with indentation', async () => {
    const results = await exportService.generateJSONLByAudio();
    const { content } = results[0];

    // Check if content contains indentation (spaces or tabs)
    expect(content).toMatch(/\n\s+/);

    // Verify it's valid JSON
    const parsed = JSON.parse(content);
    expect(Array.isArray(parsed)).toBe(true);
  });

  // Test 5.4: All required fields present
  it('should include all required fields in each record', async () => {
    const results = await exportService.generateJSONLByAudio();
    const records = JSON.parse(results[0].content);

    const record = records[0];

    // Validate top-level fields
    expect(record).toHaveProperty('audioPath');
    expect(record).toHaveProperty('duration');
    expect(record).toHaveProperty('recordingConditions');
    expect(record).toHaveProperty('transcript');
    expect(record).toHaveProperty('annotations');

    // Validate recordingConditions
    expect(record.recordingConditions).toHaveProperty('sampleRate');
    expect(record.recordingConditions).toHaveProperty('channels');
    expect(record.recordingConditions).toHaveProperty('bitDepth');
    expect(record.recordingConditions).toHaveProperty('speechRate');
    expect(record.recordingConditions).toHaveProperty('distanceEstimate');

    // Validate transcript
    expect(record.transcript).toHaveProperty('original');
    expect(record.transcript).toHaveProperty('corrected');
  });

  // Test 5.5: Correct annotation serialization
  it('should serialize annotations with correct attributes', async () => {
    const results = await exportService.generateJSONLByAudio();
    const records = JSON.parse(results[0].content);

    expect(records[0].annotations).toHaveLength(2);

    const medicalAnnotation = records[0].annotations[0];
    expect(medicalAnnotation.type).toBe('MEDICAL_TERM');
    expect(medicalAnnotation.startOffset).toBe(0);
    expect(medicalAnnotation.endOffset).toBe(24);
    expect(medicalAnnotation.attributes.category).toBe('procedure');

    const measurementAnnotation = records[0].annotations[1];
    expect(measurementAnnotation.type).toBe('MEASUREMENT');
    expect(measurementAnnotation.attributes.value).toBe(25);
  });

  // Test 5.6: Recording conditions populated
  it('should include recording conditions from database', async () => {
    const results = await exportService.generateJSONLByAudio();
    const records = JSON.parse(results[0].content);

    expect(records[0].recordingConditions.speechRate).toBe(125);
    expect(records[0].recordingConditions.distanceEstimate).toBe('close');
  });

  // Test 5.7: Corrected text preserved
  it('should preserve corrected text changes', async () => {
    const results = await exportService.generateJSONLByAudio();
    const records = JSON.parse(results[0].content);

    expect(records[0].transcript.original).toBe('Kontrollierte Rückenlagerung des Patienten...');
    expect(records[0].transcript.corrected).toBe('Kontrollierte Rückenlagerung des Patienten durchgeführt.');
  });

  // Test 5.8: Annotations sorted by startOffset
  it('should sort annotations by startOffset', async () => {
    const results = await exportService.generateJSONLByAudio();
    const records = JSON.parse(results[0].content) as Array<{ annotations: Array<{ startOffset: number }> }>;

    const offsets = records[0].annotations.map((ann: { startOffset: number }) => ann.startOffset);
    const sortedOffsets = [...offsets].sort((a, b) => a - b);

    expect(offsets).toEqual(sortedOffsets);
  });

  // Test 5.9: Valid JSON output
  it('should produce valid JSON that can be parsed', async () => {
    const results = await exportService.generateJSONLByAudio();

    results.forEach(result => {
      expect(() => {
        JSON.parse(result.content);
      }).not.toThrow();
    });
  });

  // Test 5.10: No null audioPath
  it('should never have null audioPath', async () => {
    const results = await exportService.generateJSONLByAudio();
    const records = JSON.parse(results[0].content) as Array<{ audioPath: string | null }>;

    records.forEach((record: { audioPath: string | null }) => {
      expect(record.audioPath).not.toBeNull();
      expect(typeof record.audioPath).toBe('string');
      expect(record.audioPath.length).toBeGreaterThan(0);
    });
  });

  // Test 5.11: Audio file metadata correct
  it('should include correct audio file metadata', async () => {
    const results = await exportService.generateJSONLByAudio();
    const records = JSON.parse(results[0].content);

    expect(records[0].audioPath).toBe('export-test-1.wav');
    expect(records[0].duration).toBe(45.2);
  });

  // Test 5.12: Multiple audio files handled
  it('should generate separate entries for each audio file', async () => {
    const results = await exportService.generateJSONLByAudio();

    expect(results).toHaveLength(2);

    const records1 = JSON.parse(results[0].content);
    const records2 = JSON.parse(results[1].content);

    expect(records1[0].audioPath).toBe('export-test-1.wav');
    expect(records2[0].audioPath).toBe('export-test-2.wav');
  });
});
