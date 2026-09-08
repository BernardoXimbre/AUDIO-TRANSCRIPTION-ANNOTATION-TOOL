/**
 * Test 3: Annotation Span Persistence
 * 
 * Scenario: Create, edit, delete annotations; verify round-trip data integrity.
 * Acceptance: Annotations are stored with all attributes intact; 
 * edit and delete operations persist correctly.
 */

import { PrismaClient } from '@prisma/client';
import { annotationService } from '../services/annotationService';
import { annotationRepository } from '../repositories/annotationRepository';

const prisma = new PrismaClient();

describe('Annotation Span Persistence (Test 3)', () => {
  let transcriptId: string;
  let audioFileId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.annotation.deleteMany({});
    await prisma.transcript.deleteMany({});
    await prisma.audioFile.deleteMany({});

    // Create test audio file
    const audioFile = await prisma.audioFile.create({
      data: {
        filename: 'test-annotation.wav',
        filepath: '/uploads/test-annotation.wav',
        url: '/uploads/test-annotation.wav',
        duration: 30,
        sampleRate: 44100,
        channels: 1,
        bitDepth: 16,
      },
    });
    audioFileId = audioFile.id;

    // Create test transcript
    const testText =
      'Der Patient wurde zunächst ausführlich untersucht und anschließend für die geplante Operation vorbereitet.';
    const transcript = await prisma.transcript.create({
      data: {
        audioFileId,
        originalText: testText,
        correctedText: testText,
        status: 'pending',
      },
    });
    transcriptId = transcript.id;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.annotation.deleteMany({});
    await prisma.transcript.deleteMany({});
    await prisma.audioFile.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a MEDICAL_TERM annotation with all attributes', async () => {
    const annotation = await annotationRepository.create({
      transcriptId,
      type: 'MEDICAL_TERM',
      startOffset: 10,
      endOffset: 20,
      attributes: {
        category: 'procedure',
        note: 'Important procedure',
      },
    });

    expect(annotation).toBeDefined();
    expect(annotation.type).toBe('MEDICAL_TERM');
    expect(annotation.startOffset).toBe(10);
    expect(annotation.endOffset).toBe(20);
    expect(annotation.attributes).toEqual({
      category: 'procedure',
      note: 'Important procedure',
    });
  });

  it('should retrieve annotation by ID and verify round-trip integrity', async () => {
    // Create
    const created = await annotationRepository.create({
      transcriptId,
      type: 'MEDICAL_TERM',
      startOffset: 10,
      endOffset: 20,
      attributes: {
        category: 'procedure',
        note: 'Important procedure',
      },
    });

    // Retrieve and verify
    const fetched = await annotationRepository.findById(created.id);

    expect(fetched).toBeDefined();
    expect(fetched!.id).toBe(created.id);
    expect(fetched!.type).toBe('MEDICAL_TERM');
    expect(fetched!.attributes).toEqual({
      category: 'procedure',
      note: 'Important procedure',
    });
    expect(fetched!.startOffset).toBe(10);
    expect(fetched!.endOffset).toBe(20);
  });

  it('should list all annotations for a transcript', async () => {
    // Create multiple annotations
    const annot1 = await annotationRepository.create({
      transcriptId,
      type: 'MEDICAL_TERM',
      startOffset: 10,
      endOffset: 20,
      attributes: { category: 'procedure', note: 'Procedure 1' },
    });

    const annot2 = await annotationRepository.create({
      transcriptId,
      type: 'NUMBER',
      startOffset: 50,
      endOffset: 55,
      attributes: { rendering: 'digits', value: 42 },
    });

    // List by transcript
    const annotations = await annotationRepository.findByTranscriptId(
      transcriptId
    );

    expect(annotations).toHaveLength(2);
    expect(annotations.map((a) => a.id)).toContain(annot1.id);
    expect(annotations.map((a) => a.id)).toContain(annot2.id);
  });

  it('should update annotation attributes and persist correctly', async () => {
    // Create
    const created = await annotationRepository.create({
      transcriptId,
      type: 'MEDICAL_TERM',
      startOffset: 10,
      endOffset: 20,
      attributes: {
        category: 'procedure',
        note: 'Original note',
      },
    });

    // Update
    const updated = await annotationRepository.update(created.id, {
      attributes: {
        category: 'diagnosis',
        note: 'Changed to diagnosis',
      },
    });

    expect(updated.attributes).toEqual({
      category: 'diagnosis',
      note: 'Changed to diagnosis',
    });

    // Verify persistence: fetch again
    const refetched = await annotationRepository.findById(created.id);
    expect(refetched!.attributes.category).toBe('diagnosis');
    expect(refetched!.attributes.note).toBe('Changed to diagnosis');
  });

  it('should delete annotation and verify removal', async () => {
    // Create
    const created = await annotationRepository.create({
      transcriptId,
      type: 'MEDICAL_TERM',
      startOffset: 10,
      endOffset: 20,
      attributes: { category: 'procedure', note: 'Test' },
    });

    // Delete
    await annotationRepository.delete(created.id);

    // Verify deletion
    const fetched = await annotationRepository.findById(created.id);
    expect(fetched).toBeNull();

    // Verify not in list
    const remaining = await annotationRepository.findByTranscriptId(
      transcriptId
    );
    expect(remaining).not.toContainEqual(
      expect.objectContaining({ id: created.id })
    );
  });

  it('should validate offset ranges and reject invalid spans', async () => {
    // Test invalid offsets (endOffset <= startOffset)
    const result = annotationService.validateOffsetRange(
      20,
      10,
      100 // textLength
    );

    expect(result.valid).toBe(false);
    expect(result.error).toBe('startOffset must be less than endOffset');
  });

  it('should reject offsets outside text bounds', async () => {
    const transcript = await prisma.transcript.findUnique({
      where: { id: transcriptId },
    });
    const textLength = transcript!.correctedText.length;

    // Test offset beyond text length
    const result = annotationService.validateOffsetRange(
      0,
      textLength + 100,
      textLength
    );

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/endOffset exceeds text length/);
  });

  it('should handle NUMBER annotation with rendering and value attributes', async () => {
    const annotation = await annotationRepository.create({
      transcriptId,
      type: 'NUMBER',
      startOffset: 10,
      endOffset: 15,
      attributes: {
        rendering: 'words',
        value: 12,
      },
    });

    expect(annotation.attributes.rendering).toBe('words');
    expect(annotation.attributes.value).toBe(12);

    // Verify round-trip
    const fetched = await annotationRepository.findById(annotation.id);
    expect(fetched!.attributes.value).toBe(12);
    expect(fetched!.attributes.rendering).toBe('words');
  });

  it('should handle FORMATTING_COMMAND annotation with command and isLiteral', async () => {
    const annotation = await annotationRepository.create({
      transcriptId,
      type: 'FORMATTING_COMMAND',
      startOffset: 50,
      endOffset: 60,
      attributes: {
        command: 'paragraph',
        isLiteral: false,
      },
    });

    expect(annotation.attributes.command).toBe('paragraph');
    expect(annotation.attributes.isLiteral).toBe(false);

    // Verify round-trip
    const fetched = await annotationRepository.findById(annotation.id);
    expect(fetched!.attributes.command).toBe('paragraph');
    expect(fetched!.attributes.isLiteral).toBe(false);
  });

  it('should handle NAMED_ENTITY annotation with category attribute', async () => {
    const annotation = await annotationRepository.create({
      transcriptId,
      type: 'NAMED_ENTITY',
      startOffset: 4,
      endOffset: 11,
      attributes: {
        category: 'person',
      },
    });

    expect(annotation.attributes.category).toBe('person');

    // Verify round-trip
    const fetched = await annotationRepository.findById(annotation.id);
    expect(fetched!.attributes.category).toBe('person');
  });

  it('should handle MEASUREMENT annotation with value, unit, and normalized', async () => {
    const annotation = await annotationRepository.create({
      transcriptId,
      type: 'MEASUREMENT',
      startOffset: 10,
      endOffset: 20,
      attributes: {
        value: 1500,
        unit: 'mg',
        normalized: 1.5,
      },
    });

    expect(annotation.attributes.value).toBe(1500);
    expect(annotation.attributes.unit).toBe('mg');
    expect(annotation.attributes.normalized).toBe(1.5);

    // Verify round-trip
    const fetched = await annotationRepository.findById(annotation.id);
    expect(fetched!.attributes.value).toBe(1500);
    expect(fetched!.attributes.unit).toBe('mg');
    expect(fetched!.attributes.normalized).toBe(1.5);
  });

  it('should handle SPELLED_OUT annotation with resolved attribute', async () => {
    const annotation = await annotationRepository.create({
      transcriptId,
      type: 'SPELLED_OUT',
      startOffset: 10,
      endOffset: 20,
      attributes: {
        resolved: 'ABC',
      },
    });

    expect(annotation.attributes.resolved).toBe('ABC');

    // Verify round-trip
    const fetched = await annotationRepository.findById(annotation.id);
    expect(fetched!.attributes.resolved).toBe('ABC');
  });

  it('should handle CRUD annotation with no required attributes', async () => {
    const annotation = await annotationRepository.create({
      transcriptId,
      type: 'CRUD',
      startOffset: 10,
      endOffset: 20,
      attributes: {},
    });

    expect(annotation.type).toBe('CRUD');
    expect(annotation.attributes).toEqual({});

    // Verify round-trip
    const fetched = await annotationRepository.findById(annotation.id);
    expect(fetched!.type).toBe('CRUD');
    expect(fetched!.attributes).toEqual({});
  });

  it('should support multiple annotations on different spans', async () => {
    // Create multiple non-overlapping annotations
    await Promise.all([
      annotationRepository.create({
        transcriptId,
        type: 'MEDICAL_TERM',
        startOffset: 0,
        endOffset: 10,
        attributes: { category: 'anatomy' },
      }),
      annotationRepository.create({
        transcriptId,
        type: 'NUMBER',
        startOffset: 20,
        endOffset: 25,
        attributes: { rendering: 'digits', value: 5 },
      }),
      annotationRepository.create({
        transcriptId,
        type: 'FORMATTING_COMMAND',
        startOffset: 40,
        endOffset: 50,
        attributes: { command: 'newline', isLiteral: true },
      }),
    ]);

    // Verify all persisted
    const fetched = await annotationRepository.findByTranscriptId(
      transcriptId
    );
    expect(fetched).toHaveLength(3);
    expect(fetched.map((a) => a.type)).toEqual([
      'MEDICAL_TERM',
      'NUMBER',
      'FORMATTING_COMMAND',
    ]);
  });
});
