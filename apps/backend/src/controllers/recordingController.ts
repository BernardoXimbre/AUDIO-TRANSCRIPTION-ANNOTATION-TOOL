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
      audioFileId: recording.audioFileId,
      speechRate: recording.speechRate,
      distanceEstimate: recording.distanceEstimate,
      duration: recording.audioFile.duration,
      sampleRate: recording.audioFile.sampleRate,
      channels: recording.audioFile.channels,
      bitDepth: recording.audioFile.bitDepth
    });
  } catch (error) {
    console.error('Error fetching recording:', error);
    res.status(500).json({ error: 'Internal server error', status: 500 });
  }
}

export async function updateRecording(req: Request, res: Response): Promise<void> {
  try {
    const { audioFileId } = req.params;
    const { speechRate, distanceEstimate } = req.body;

    // Validate input
    if (speechRate !== undefined && typeof speechRate !== 'number') {
      res.status(400).json({ error: 'speechRate must be a number', status: 400 });
      return;
    }

    if (distanceEstimate !== undefined && !['close', 'medium', 'far'].includes(distanceEstimate)) {
      res.status(400).json({ error: 'distanceEstimate must be close, medium, or far', status: 400 });
      return;
    }

    // Check recording exists
    const existing = await recordingRepository.findByAudioFileId(audioFileId);
    if (!existing) {
      res.status(404).json({ error: 'Recording not found', status: 404 });
      return;
    }

    const updated = await recordingRepository.update(audioFileId, {
      speechRate: speechRate !== undefined ? speechRate : undefined,
      distanceEstimate: distanceEstimate !== undefined ? distanceEstimate : undefined
    });

    res.status(200).json({
      success: true,
      data: {
        audioFileId: updated.audioFileId,
        speechRate: updated.speechRate,
        distanceEstimate: updated.distanceEstimate
      }
    });
  } catch (error) {
    console.error('Error updating recording:', error);
    res.status(500).json({ error: 'Internal server error', status: 500 });
  }
}
