import { RepresentationStatus, UserRole } from '@cac/shared';
import { prisma } from './prisma.js';

export async function canActForOrganization(userId: string, organizationId: string, userRole: string) {
  if (userRole === UserRole.ADMIN || userRole === UserRole.CURADOR) {
    return true;
  }

  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
  if (membership) return true;

  const approved = await prisma.orgRepresentationRequest.findFirst({
    where: {
      userId,
      organizationId,
      status: RepresentationStatus.APPROVED,
    },
  });
  return Boolean(approved);
}

export async function assertCanActForOrganization(
  userId: string,
  organizationId: string,
  userRole: string,
) {
  const ok = await canActForOrganization(userId, organizationId, userRole);
  if (!ok) {
    const error = new Error('forbidden_org');
    (error as Error & { status: number }).status = 403;
    throw error;
  }
}
