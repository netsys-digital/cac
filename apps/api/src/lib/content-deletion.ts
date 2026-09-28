import type { ConnectionTargetType, Prisma } from '@prisma/client';
import { prisma } from './prisma.js';

export const DELETABLE_KINDS = ['TECHNOLOGY', 'CHALLENGE', 'PROJECT', 'FUNDING_OFFER', 'SUCCESS_CASE'] as const;
export type DeletableKind = (typeof DELETABLE_KINDS)[number];

export function isDeletableKind(value: string): value is DeletableKind {
  return (DELETABLE_KINDS as readonly string[]).includes(value);
}

export type DeletableContent = {
  id: string;
  title: string;
  status: string;
  organizationId: string;
};

const select = { id: true, title: true, status: true, organizationId: true } as const;

export async function findDeletableContent(kind: DeletableKind, id: string): Promise<DeletableContent | null> {
  switch (kind) {
    case 'TECHNOLOGY':
      return prisma.technology.findUnique({ where: { id }, select });
    case 'CHALLENGE':
      return prisma.challenge.findUnique({ where: { id }, select });
    case 'PROJECT':
      return prisma.project.findUnique({ where: { id }, select });
    case 'FUNDING_OFFER':
      return prisma.fundingOffer.findUnique({ where: { id }, select });
    case 'SUCCESS_CASE':
      return prisma.successCase.findUnique({ where: { id }, select });
  }
}

/**
 * Hard-delete a publication and its dangling references (favorites, open deletion requests).
 * Open deletion requests are closed as APPROVED by `reviewerUserId` so the requester keeps an audit trail.
 */
export async function deleteContentTx(
  tx: Prisma.TransactionClient,
  kind: DeletableKind,
  id: string,
  reviewerUserId: string | null,
  reviewNote: string | null = null,
) {
  const targetType = kind as ConnectionTargetType;
  await tx.savedItem.deleteMany({ where: { targetType, targetId: id } });
  await tx.contentDeletionRequest.updateMany({
    where: { targetType, targetId: id, status: 'REQUESTED' },
    data: { status: 'APPROVED', reviewerUserId, reviewNote, reviewedAt: new Date() },
  });
  if (kind === 'TECHNOLOGY') await tx.technology.delete({ where: { id } });
  else if (kind === 'CHALLENGE') await tx.challenge.delete({ where: { id } });
  else if (kind === 'PROJECT') await tx.project.delete({ where: { id } });
  else if (kind === 'FUNDING_OFFER') await tx.fundingOffer.delete({ where: { id } });
  else await tx.successCase.delete({ where: { id } });
}
