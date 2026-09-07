import { prisma } from '../db';
import type { Prisma } from '@prisma/client';

export const recordingRepository = {
  async create(data: Prisma.RecordingCreateInput) {
    return prisma.recording.create({ data });
  },

  async findByAudioFileId(audioFileId: string) {
    return prisma.recording.findUnique({ where: { audioFileId } });
  },

  async update(audioFileId: string, data: Prisma.RecordingUpdateInput) {
    return prisma.recording.update({ where: { audioFileId }, data });
  }
};
