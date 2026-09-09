import { Router, Request, Response } from 'express';
import { annotationRepository } from '../repositories/annotationRepository';
import { annotationService } from '../services/annotationService';
import { transcriptRepository } from '../repositories/transcriptRepository';

const router = Router();

/**
 * GET /api/annotations?transcriptId=...
 * List annotations for a transcript
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { transcriptId } = req.query;

    if (!transcriptId || typeof transcriptId !== 'string') {
      return res.status(400).json({ error: 'transcriptId query parameter is required' });
    }

    const annotations = await annotationRepository.findByTranscriptId(transcriptId);
    return res.json(annotations);
  } catch (error) {
    console.error('GET /api/annotations error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/annotation
 * Create a new annotation
 * Body: { transcriptId, type, startOffset, endOffset, attributes }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { transcriptId, type, startOffset, endOffset, attributes } = req.body;

    // Validate required fields
    if (!transcriptId || typeof transcriptId !== 'string') {
      return res.status(400).json({ error: 'transcriptId is required and must be a string' });
    }

    if (!type || typeof type !== 'string') {
      return res.status(400).json({ error: 'type is required and must be a string' });
    }

    if (startOffset === undefined || endOffset === undefined) {
      return res.status(400).json({ error: 'startOffset and endOffset are required' });
    }

    if (typeof startOffset !== 'number' || typeof endOffset !== 'number') {
      return res.status(400).json({ error: 'startOffset and endOffset must be numbers' });
    }

    // Validate type
    if (!annotationService.isValidType(type.toUpperCase())) {
      return res.status(400).json({ error: `Invalid annotation type: ${type}` });
    }

    // Get transcript to validate bounds and access correctedText
    const transcript = await transcriptRepository.findById(transcriptId, {
      id: true,
      correctedText: true
    });
    if (!transcript) {
      return res.status(404).json({ error: 'Transcript not found' });
    }

    // Validate offset range
    const offsetValidation = annotationService.validateOffsetRange(
      startOffset,
      endOffset,
      transcript.correctedText.length
    );
    if (!offsetValidation.valid) {
      return res.status(400).json({ error: offsetValidation.error });
    }

    // Validate attributes by type
    const attrValidation = annotationService.validateAttributes(type, attributes || {});
    if (!attrValidation.valid) {
      return res.status(400).json({ error: attrValidation.error });
    }

    // Create annotation
    const annotation = await annotationRepository.create({
      transcript: {
        connect: { id: transcriptId }
      },
      type: type.toUpperCase(),
      startOffset,
      endOffset,
      attributes: attributes || {}
    });

    return res.status(201).json(annotation);
  } catch (error) {
    console.error('POST /api/annotation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/annotation/:id
 * Delete an annotation
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if annotation exists
    const annotation = await annotationRepository.findById(id);
    if (!annotation) {
      return res.status(404).json({ error: 'Annotation not found' });
    }

    // Delete it
    await annotationRepository.delete(id);

    return res.status(204).send();
  } catch (error) {
    console.error('DELETE /api/annotation/:id error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export const annotationController = router;
