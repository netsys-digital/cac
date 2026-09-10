import { RepresentationStatus, UserRole, type OrgPublishKind } from '@cac/shared';
import { prisma } from './prisma.js';

/** Membro ou representação aprovada — sem bypass de staff. */
export async function canActForOrganizationAsAffiliate(userId: string, organizationId: string) {
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

export async function canActForOrganization(userId: string, organizationId: string, userRole: string) {
  if (userRole === UserRole.ADMIN || userRole === UserRole.CURADOR) {
    return true;
  }
  return canActForOrganizationAsAffiliate(userId, organizationId);
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

/** Aceitar/recusar conexão: só afiliado real da org destino (staff não age como terceiro). */
export async function assertCanActForOrganizationAsAffiliate(userId: string, organizationId: string) {
  const ok = await canActForOrganizationAsAffiliate(userId, organizationId);
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
  return organizationIdsAsAffiliate(userId);
}

/** Só afiliação real (membro ou representação aprovada), sem bypass de staff. */
export async function organizationIdsAsAffiliate(userId: string): Promise<string[]> {
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
