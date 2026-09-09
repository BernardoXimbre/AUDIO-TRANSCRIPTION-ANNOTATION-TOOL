import { Request, Response } from 'express';
import { recordingRepository } from '../repositories/recordingRepository';

export async function getRecording(req: Request, res: Response): Promise<void> {
  try {
    const { audioFileId } = req.params;

    const recording = await recordingRepository.findByAudioFileId(audioFileId);

    if (!recording) {
      res.status(404).json({ error: 'Recording not found', status: 404 });
      return;
    }

    res.json({
      id: recording.id,
      audioFileId: recording.audioFileId,
      speechRate: recording.speechRate,
      distanceEstimate: recording.distanceEstimate,
      speechRateOverride: recording.speechRateOverride,
      distanceOverride: recording.distanceOverride
    });
  } catch (error) {
    console.error('Error fetching recording:', error);
    res.status(500).json({ error: 'Internal server error', status: 500 });
  }
}

export async function updateRecording(req: Request, res: Response): Promise<void> {
  try {
    const { audioFileId } = req.params;
    const { speechRateOverride, distanceOverride } = req.body;

    // Validate input
    if (speechRateOverride !== undefined && speechRateOverride !== null && typeof speechRateOverride !== 'number') {
      res.status(400).json({ error: 'speechRateOverride must be a number or null', status: 400 });
      return;
    }

    if (distanceOverride !== undefined && distanceOverride !== null && !['close', 'medium', 'far'].includes(distanceOverride)) {
      res.status(400).json({ error: 'distanceOverride must be close, medium, far, or null', status: 400 });
      return;
    }

    // Check recording exists
    const existing = await recordingRepository.findByAudioFileId(audioFileId);
    if (!existing) {
      res.status(404).json({ error: 'Recording not found', status: 404 });
      return;
    }

    // Update only provided fields
    const updateData: { speechRateOverride?: number | null; distanceOverride?: string | null } = {};
    if (speechRateOverride !== undefined) {
      updateData.speechRateOverride = speechRateOverride;
    }
    if (distanceOverride !== undefined) {
      updateData.distanceOverride = distanceOverride;
    }

    const updated = await recordingRepository.update(audioFileId, updateData);

    res.status(200).json({
      id: updated.id,
      audioFileId: updated.audioFileId,
      speechRate: updated.speechRate,
      distanceEstimate: updated.distanceEstimate,
      speechRateOverride: updated.speechRateOverride,
      distanceOverride: updated.distanceOverride
    });
  } catch (error) {
    console.error('Error updating recording:', error);
    res.status(500).json({ error: 'Internal server error', status: 500 });
  }
}
