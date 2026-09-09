import { Request, Response } from 'express';
import { exportService } from '../services/exportService';

export const exportController = {
  async exportDataset(req: Request, res: Response): Promise<void> {
    try {
      const results = await exportService.generateJSONLByAudio();

      if (results.length === 0) {
        res.status(400).json({
          error: 'No transcripts to export'
        });
        return;
      }

      // Single consolidated file
      const { filename, content } = results[0];
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(content);
    } catch (error) {
      console.error('Error exporting dataset:', error);
      res.status(500).json({
        error: 'Failed to export dataset',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};
