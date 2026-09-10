import { RepresentationStatus, UserRole, type OrgPublishKind } from '@cac/shared';
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

export async function assertCanPublishKind(
  userId: string,
  organizationId: string,
  userRole: string,
  kind: OrgPublishKind,
) {
  await assertCanActForOrganization(userId, organizationId, userRole);
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { publishKinds: true },
  });
  if (!org || !org.publishKinds.includes(kind)) {
    const error = new Error('forbidden_org_publish_kind');
    (error as Error & { status: number }).status = 403;
    throw error;
  }
}

/** Org IDs the user may manage (membership, approved representation, or all if staff). */
export async function organizationIdsForUser(userId: string, userRole: string): Promise<string[] | 'all'> {
  if (userRole === UserRole.ADMIN || userRole === UserRole.CURADOR) {
    return 'all';
  }

  const [memberships, approved] = await Promise.all([
    prisma.organizationMember.findMany({
      where: { userId },
      select: { organizationId: true },
    }),
    prisma.orgRepresentationRequest.findMany({
      where: { userId, status: RepresentationStatus.APPROVED },
      select: { organizationId: true },
    }),
  ]);

  return [...new Set([...memberships, ...approved].map((r) => r.organizationId))];
}
