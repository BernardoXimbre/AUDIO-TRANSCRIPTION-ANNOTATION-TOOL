import { prisma } from '../db';
import type { Prisma } from '@prisma/client';

export const transcriptRepository = {
  async findMany(
    where?: Prisma.TranscriptWhereInput,
    select?: Prisma.TranscriptSelect,
    orderBy?: Prisma.TranscriptOrderByWithRelationInput
  ) {
    return prisma.transcript.findMany({ where, select, orderBy });
  },

  async count(where?: Prisma.TranscriptWhereInput) {
    return prisma.transcript.count({ where });
  },

  async findById(id: string, select?: Prisma.TranscriptSelect) {
    return prisma.transcript.findUnique({ where: { id }, select });
  },

  async create(data: Prisma.TranscriptCreateInput) {
    return prisma.transcript.create({ data });
  },

  async update(id: string, data: Prisma.TranscriptUpdateInput) {
    return prisma.transcript.update({ where: { id }, data });
  }
};
