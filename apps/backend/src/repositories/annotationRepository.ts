import { prisma } from '../db';
import type { Prisma } from '@prisma/client';

export const annotationRepository = {
  async create(data: Prisma.AnnotationCreateInput) {
    return prisma.annotation.create({ data });
  },

  async findById(id: string) {
    return prisma.annotation.findUnique({
      where: { id },
      include: {
        transcript: {
          select: {
            id: true,
            audioFileId: true,
            correctedText: true
          }
        }
      }
    });
  },

  async findByTranscriptId(transcriptId: string) {
    return prisma.annotation.findMany({
      where: { transcriptId },
      orderBy: { startOffset: 'asc' }
    });
  },

  async update(id: string, data: Prisma.AnnotationUpdateInput) {
    return prisma.annotation.update({
      where: { id },
      data
    });
  },

  async delete(id: string) {
    return prisma.annotation.delete({
      where: { id }
    });
  }
};
