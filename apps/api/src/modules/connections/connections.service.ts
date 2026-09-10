import {
  ConnectionStatus,
  ConnectionTargetType,
  type CreateConnectionBody,
} from '@cac/shared';
import { env } from '../../config/env.js';
import { assertCanActForOrganization, canActForOrganization } from '../../lib/org-access.js';
import { enqueueEmail } from '../../lib/queue/email-queue.js';
import { prisma } from '../../lib/prisma.js';

async function resolveTargetOrg(targetType: string, targetId: string): Promise<{
  targetOrgId: string;
  targetLabel: string;
  contactEmails: string[];
}> {
  switch (targetType) {
    case ConnectionTargetType.TECHNOLOGY: {
      const item = await prisma.technology.findUnique({
        where: { id: targetId },
        include: {
          organization: { include: { members: { include: { user: true }, take: 5 } } },
        },
      });
      if (!item) throw notFound();
      return {
        targetOrgId: item.organizationId,
        targetLabel: item.title,
        contactEmails: item.organization.members.map((m) => m.user.email),
      };
    }
    case ConnectionTargetType.PROJECT: {
      const item = await prisma.project.findUnique({
        where: { id: targetId },
        include: {
          organization: { include: { members: { include: { user: true }, take: 5 } } },
        },
      });
      if (!item) throw notFound();
      return {
        targetOrgId: item.organizationId,
        targetLabel: item.title,
        contactEmails: item.organization.members.map((m) => m.user.email),
      };
    }
    case ConnectionTargetType.CHALLENGE: {
      const item = await prisma.challenge.findUnique({
        where: { id: targetId },
        include: {
          organization: { include: { members: { include: { user: true }, take: 5 } } },
        },
      });
      if (!item) throw notFound();
      return {
        targetOrgId: item.organizationId,
        targetLabel: item.title,
        contactEmails: item.organization.members.map((m) => m.user.email),
      };
    }
    case ConnectionTargetType.FUNDING_OFFER: {
      const item = await prisma.fundingOffer.findUnique({
        where: { id: targetId },
        include: {
          organization: { include: { members: { include: { user: true }, take: 5 } } },
        },
      });
      if (!item) throw notFound();
      return {
        targetOrgId: item.organizationId,
        targetLabel: item.title,
        contactEmails: item.organization.members.map((m) => m.user.email),
      };
    }
    case ConnectionTargetType.ORGANIZATION: {
      const item = await prisma.organization.findUnique({
        where: { id: targetId },
        include: { members: { include: { user: true }, take: 5 } },
      });
      if (!item) throw notFound();
      return {
        targetOrgId: item.id,
        targetLabel: item.name,
        contactEmails: item.members.map((m) => m.user.email),
      };
    }
    case ConnectionTargetType.SUCCESS_CASE: {
      const item = await prisma.successCase.findUnique({
        where: { id: targetId },
        include: {
          organization: { include: { members: { include: { user: true }, take: 5 } } },
        },
      });
      if (!item) throw notFound();
      return {
        targetOrgId: item.organizationId,
        targetLabel: item.title,
        contactEmails: item.organization.members.map((m) => m.user.email),
      };
    }
    default:
      throw Object.assign(new Error('unsupported_target_type'), { status: 400 });
  }
}

function notFound() {
  return Object.assign(new Error('not_found'), { status: 404 });
}

function includeConnection() {
  return {
    requesterOrg: true,
    targetOrg: true,
    requesterUser: { select: { id: true, email: true, name: true } },
  } as const;
}

async function withRequesterRoles<T extends { requesterUserId: string; requesterOrgId: string }>(
  items: T[],
) {
  if (!items.length) return items.map((item) => ({ ...item, requesterRole: null as null }));
  const reps = await prisma.orgRepresentationRequest.findMany({
    where: {
      status: 'APPROVED',
      OR: items.map((item) => ({
        userId: item.requesterUserId,
        organizationId: item.requesterOrgId,
      })),
    },
    select: { userId: true, organizationId: true, unit: true, linkRole: true },
  });
  const key = (userId: string, orgId: string) => `${userId}:${orgId}`;
  const map = new Map(reps.map((r) => [key(r.userId, r.organizationId), r]));
  return items.map((item) => {
    const role = map.get(key(item.requesterUserId, item.requesterOrgId));
    return {
      ...item,
      requesterRole: role ? { unit: role.unit, linkRole: role.linkRole } : null,
    };
  });
}

export async function createConnection(userId: string, userRole: string, body: CreateConnectionBody) {
  await assertCanActForOrganization(userId, body.requesterOrgId, userRole);
  const resolved = await resolveTargetOrg(body.targetType, body.targetId);
  if (resolved.targetOrgId === body.requesterOrgId) {
    throw Object.assign(new Error('same_org'), { status: 400 });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.connectionExpiryDays);

  const connection = await prisma.connection.create({
    data: {
      requesterOrgId: body.requesterOrgId,
      targetOrgId: resolved.targetOrgId,
      requesterUserId: userId,
      targetType: body.targetType,
      targetId: body.targetId,
      objective: body.objective,
      message: body.message,
      status: ConnectionStatus.PENDING,
      expiresAt,
    },
    include: includeConnection(),
  });

  const requesterOrg = connection.requesterOrg.name;
  const requesterName = connection.requesterUser.name;
  for (const to of resolved.contactEmails.length ? resolved.contactEmails : []) {
    await enqueueEmail({
      kind: 'connection',
      template: 'request',
      to,
      ctx: {
        requesterName,
        requesterOrg,
        targetLabel: resolved.targetLabel,
        objective: body.objective,
        message: body.message ?? '',
      },
    });
  }
  // Fallback: notify admin seed if org has no members
  if (!resolved.contactEmails.length && env.smtpFrom) {
    await enqueueEmail({
      kind: 'connection',
      template: 'request',
      to: env.smtpFrom,
      ctx: {
        requesterName,
        requesterOrg,
        targetLabel: resolved.targetLabel,
        objective: body.objective,
        message: body.message ?? '',
      },
    });
  }

  return connection;
}

export async function listConnectionsForUser(userId: string, userRole: string) {
  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    select: { organizationId: true },
  });
  const orgIds = memberships.map((m) => m.organizationId);
  const isStaff = userRole === 'ADMIN' || userRole === 'CURADOR';

  const items = await prisma.connection.findMany({
    where: isStaff
      ? undefined
      : {
          OR: [
            { requesterUserId: userId },
            { requesterOrgId: { in: orgIds } },
            { targetOrgId: { in: orgIds } },
          ],
        },
    include: includeConnection(),
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return withRequesterRoles(items);
}

async function loadForTargetAction(id: string, userId: string, userRole: string) {
  const connection = await prisma.connection.findUnique({
    where: { id },
    include: includeConnection(),
  });
  if (!connection) throw notFound();
  await assertCanActForOrganization(userId, connection.targetOrgId, userRole);
  return connection;
}

export async function acceptConnection(id: string, userId: string, userRole: string) {
  const current = await loadForTargetAction(id, userId, userRole);
  if (current.status !== ConnectionStatus.PENDING) {
    throw Object.assign(new Error('invalid_status'), { status: 400 });
  }
  const connection = await prisma.connection.update({
    where: { id: current.id },
    data: { status: ConnectionStatus.ACCEPTED, acceptedAt: new Date() },
    include: includeConnection(),
  });
  await enqueueEmail({
    kind: 'connection',
    template: 'accepted',
    to: connection.requesterUser.email,
    ctx: {
      targetLabel: `${connection.targetType}:${connection.targetId}`,
      targetOrg: connection.targetOrg.name,
      contactEmail: connection.targetOrg.website || 'via painel CAC',
    },
  });
  return connection;
}

export async function declineConnection(id: string, userId: string, userRole: string) {
  const current = await loadForTargetAction(id, userId, userRole);
  if (current.status !== ConnectionStatus.PENDING) {
    throw Object.assign(new Error('invalid_status'), { status: 400 });
  }
  const connection = await prisma.connection.update({
    where: { id: current.id },
    data: { status: ConnectionStatus.DECLINED, declinedAt: new Date() },
    include: includeConnection(),
  });
  await enqueueEmail({
    kind: 'connection',
    template: 'declined',
    to: connection.requesterUser.email,
    ctx: {
      targetLabel: `${connection.targetType}:${connection.targetId}`,
      targetOrg: connection.targetOrg.name,
    },
  });
  return connection;
}

export async function closeConnection(id: string, userId: string, userRole: string) {
  const connection = await prisma.connection.findUnique({ where: { id } });
  if (!connection) throw notFound();
  const canRequester = await canActForOrganization(userId, connection.requesterOrgId, userRole);
  const canTarget = await canActForOrganization(userId, connection.targetOrgId, userRole);
  if (!canRequester && !canTarget) {
    throw Object.assign(new Error('forbidden_org'), { status: 403 });
  }
  if (
    connection.status !== ConnectionStatus.ACCEPTED &&
    connection.status !== ConnectionStatus.CONTACT_SHARED
  ) {
    throw Object.assign(new Error('invalid_status'), { status: 400 });
  }
  return prisma.connection.update({
    where: { id },
    data: { status: ConnectionStatus.CLOSED, closedAt: new Date() },
    include: includeConnection(),
  });
}

/** Expire PENDING past expiresAt; send reminders at ~halfway. */
export async function processConnectionLifecycle(): Promise<{ expired: number; reminded: number }> {
  const now = new Date();
  const pending = await prisma.connection.findMany({
    where: { status: ConnectionStatus.PENDING },
    include: includeConnection(),
  });
  let expired = 0;
  let reminded = 0;
  for (const item of pending) {
    if (item.expiresAt <= now) {
      await prisma.connection.update({
        where: { id: item.id },
        data: { status: ConnectionStatus.EXPIRED },
      });
      await enqueueEmail({
        kind: 'connection',
        template: 'expired',
        to: item.requesterUser.email,
        ctx: { targetLabel: `${item.targetType}:${item.targetId}` },
      });
      expired += 1;
      continue;
    }
    const half = new Date(item.createdAt.getTime() + (item.expiresAt.getTime() - item.createdAt.getTime()) / 2);
    if (!item.reminderSentAt && now >= half) {
      const targetMembers = await prisma.organizationMember.findMany({
        where: { organizationId: item.targetOrgId },
        include: { user: true },
        take: 5,
      });
      for (const m of targetMembers) {
        await enqueueEmail({
          kind: 'connection',
          template: 'reminder',
          to: m.user.email,
          ctx: {
            targetLabel: `${item.targetType}:${item.targetId}`,
            requesterOrg: item.requesterOrg.name,
            expiresAt: item.expiresAt.toISOString().slice(0, 10),
          },
        });
      }
      await prisma.connection.update({
        where: { id: item.id },
        data: { reminderSentAt: now },
      });
      reminded += 1;
    }
  }
  return { expired, reminded };
}
