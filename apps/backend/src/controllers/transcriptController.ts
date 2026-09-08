import { Router, Request, Response } from 'express';
import { transcriptRepository } from '../repositories/transcriptRepository';

const router = Router();

/**
 * GET /api/transcript/:id
 * Get a transcript by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const transcript = await transcriptRepository.findById(id, {
      id: true,
      audioFileId: true,
      originalText: true,
      correctedText: true,
      status: true
    });

    if (!transcript) {
      return res.status(404).json({ error: 'Transcript not found' });
    }

    return res.json(transcript);
  } catch (error) {
    console.error('GET /api/transcript/:id error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/transcript/:id
 * Update a transcript's correctedText
 * Body: { correctedText }
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { correctedText } = req.body;

    // Validate required field
    if (correctedText === undefined) {
      return res.status(400).json({ error: 'correctedText is required' });
    }

    if (typeof correctedText !== 'string') {
      return res.status(400).json({ error: 'correctedText must be a string' });
    }

    // Check if transcript exists
    const transcript = await transcriptRepository.findById(id);
    if (!transcript) {
      return res.status(404).json({ error: 'Transcript not found' });
    }

    // Update the corrected text
    const updated = await transcriptRepository.update(id, {
      correctedText
    });

    return res.json(updated);
  } catch (error) {
    console.error('PATCH /api/transcript/:id error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export const transcriptController = router;
