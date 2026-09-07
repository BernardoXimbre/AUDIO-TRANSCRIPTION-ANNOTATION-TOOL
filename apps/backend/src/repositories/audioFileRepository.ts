import { prisma } from '../db';
import type { Prisma } from '@prisma/client';

export const audioFileRepository = {
  async create(data: Prisma.AudioFileCreateInput) {
    return prisma.audioFile.create({ data });
  },

  async findById(id: string) {
    return prisma.audioFile.findUnique({ where: { id } });
  },

  async findByFilepath(filepath: string) {
    return prisma.audioFile.findUnique({ where: { filepath } });
  }
};
