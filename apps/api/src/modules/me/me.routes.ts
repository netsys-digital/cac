import { Router } from 'express';
import { ContentStatus } from '@cac/shared';
import { assertCanActForOrganization, organizationIdsForUser } from '../../lib/org-access.js';
import { param } from '../../lib/params.js';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../middleware/auth.js';

export const meRouter = Router();

meRouter.get('/representation-requests', requireAuth, async (req, res, next) => {
  try {
    const items = await prisma.orgRepresentationRequest.findMany({
      where: { userId: req.auth!.sub },
      include: { organization: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

meRouter.get('/dashboard', requireAuth, async (req, res, next) => {
  try {
    const userId = req.auth!.sub;
    const where = await orgFilter(userId, req.auth!.role);
    const orgIds = await organizationIdsForUser(userId, req.auth!.role);
    const emptyOrgs = orgIds !== 'all' && orgIds.length === 0;

    const connectionWhere =
      orgIds === 'all'
        ? {}
        : emptyOrgs
          ? { id: { in: [] as string[] } }
          : {
              OR: [{ requesterOrgId: { in: orgIds } }, { targetOrgId: { in: orgIds } }],
            };

    const [
      publishedTech,
      publishedChallenge,
      publishedOffer,
      publishedCase,
      drafts,
      inReview,
      connectionsTotal,
      connectionsPending,
      contacts,
      favorites,
      techIds,
      challengeIds,
      offerIds,
      caseIds,
      follows,
    ] = await Promise.all([
      emptyOrgs ? 0 : prisma.technology.count({ where: { ...where, status: ContentStatus.PUBLISHED } }),
      emptyOrgs ? 0 : prisma.challenge.count({ where: { ...where, status: ContentStatus.PUBLISHED } }),
      emptyOrgs ? 0 : prisma.fundingOffer.count({ where: { ...where, status: ContentStatus.PUBLISHED } }),
      emptyOrgs ? 0 : prisma.successCase.count({ where: { ...where, status: ContentStatus.PUBLISHED } }),
      emptyOrgs
        ? 0
        : Promise.all([
            prisma.technology.count({ where: { ...where, status: ContentStatus.DRAFT } }),
            prisma.challenge.count({ where: { ...where, status: ContentStatus.DRAFT } }),
            prisma.fundingOffer.count({ where: { ...where, status: ContentStatus.DRAFT } }),
            prisma.successCase.count({ where: { ...where, status: ContentStatus.DRAFT } }),
          ]).then((n) => n.reduce((a, b) => a + b, 0)),
      emptyOrgs
        ? 0
        : Promise.all([
            prisma.technology.count({ where: { ...where, status: ContentStatus.IN_REVIEW } }),
            prisma.challenge.count({ where: { ...where, status: ContentStatus.IN_REVIEW } }),
            prisma.fundingOffer.count({ where: { ...where, status: ContentStatus.IN_REVIEW } }),
            prisma.successCase.count({ where: { ...where, status: ContentStatus.IN_REVIEW } }),
          ]).then((n) => n.reduce((a, b) => a + b, 0)),
      prisma.connection.count({ where: connectionWhere }),
      prisma.connection.count({ where: { ...connectionWhere, status: 'PENDING' } }),
      prisma.connection.count({
        where: {
          ...connectionWhere,
          status: { in: ['ACCEPTED', 'CONTACT_SHARED'] },
        },
      }),
      prisma.savedItem.count({ where: { userId } }),
      emptyOrgs
        ? Promise.resolve([] as Array<{ id: string }>)
        : prisma.technology.findMany({ where, select: { id: true } }),
      emptyOrgs
        ? Promise.resolve([] as Array<{ id: string }>)
        : prisma.challenge.findMany({ where, select: { id: true } }),
      emptyOrgs
        ? Promise.resolve([] as Array<{ id: string }>)
        : prisma.fundingOffer.findMany({ where, select: { id: true } }),
      emptyOrgs
        ? Promise.resolve([] as Array<{ id: string }>)
        : prisma.successCase.findMany({ where, select: { id: true } }),
      prisma.follow.count({ where: { userId } }),
    ]);

    const ownIds = [
      ...techIds.map((r) => r.id),
      ...challengeIds.map((r) => r.id),
      ...offerIds.map((r) => r.id),
      ...caseIds.map((r) => r.id),
    ];
    const likesReceived =
      ownIds.length === 0
        ? 0
        : await prisma.savedItem.count({ where: { targetId: { in: ownIds } } });

    const published = publishedTech + publishedChallenge + publishedOffer + publishedCase;

    res.json({
      stats: {
        published,
        drafts,
        inReview,
        connections: connectionsTotal,
        connectionsPending,
        contacts,
        favorites,
        follows,
        interactions: connectionsTotal,
        views: 0,
        viewsTracked: false,
        likesReceived,
      },
      breakdown: {
        technologies: publishedTech,
        challenges: publishedChallenge,
        offers: publishedOffer,
        cases: publishedCase,
      },
    });
  } catch (error) {
    next(error);
  }
});

const CONTENT_KINDS = ['TECHNOLOGY', 'CHALLENGE', 'FUNDING_OFFER', 'SUCCESS_CASE'] as const;
type ContentKind = (typeof CONTENT_KINDS)[number];

function isKind(value: string): value is ContentKind {
  return (CONTENT_KINDS as readonly string[]).includes(value);
}

async function orgFilter(userId: string, role: string) {
  const ids = await organizationIdsForUser(userId, role);
  if (ids === 'all') return {};
  if (ids.length === 0) return { organizationId: { in: [] as string[] } };
  return { organizationId: { in: ids } };
}

meRouter.get('/contents', requireAuth, async (req, res, next) => {
  try {
    const where = await orgFilter(req.auth!.sub, req.auth!.role);
    const kind = typeof req.query.kind === 'string' ? req.query.kind : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    const organizationId =
      typeof req.query.organizationId === 'string' ? req.query.organizationId : undefined;
    const country = typeof req.query.country === 'string' ? req.query.country : undefined;

    const includeOrg = { organization: { select: { id: true, name: true, slug: true } } } as const;
    const statusFilter = status ? { status: status as ContentStatus } : {};
    const orgIdFilter = organizationId ? { organizationId } : {};
    const countryFilter = country ? { country } : {};

    const [techs, challenges, offers, cases, countRows] = await Promise.all([
      !kind || kind === 'TECHNOLOGY'
        ? prisma.technology.findMany({
            where: { ...where, ...statusFilter, ...orgIdFilter, ...countryFilter },
            include: includeOrg,
            orderBy: { updatedAt: 'desc' },
            take: 200,
          })
        : Promise.resolve([]),
      !kind || kind === 'CHALLENGE'
        ? prisma.challenge.findMany({
            where: { ...where, ...statusFilter, ...orgIdFilter, ...countryFilter },
            include: includeOrg,
            orderBy: { updatedAt: 'desc' },
            take: 200,
          })
        : Promise.resolve([]),
      !kind || kind === 'FUNDING_OFFER'
        ? prisma.fundingOffer.findMany({
            where: { ...where, ...statusFilter, ...orgIdFilter, ...countryFilter },
            include: includeOrg,
            orderBy: { updatedAt: 'desc' },
            take: 200,
          })
        : Promise.resolve([]),
      !kind || kind === 'SUCCESS_CASE'
        ? prisma.successCase.findMany({
            where: { ...where, ...statusFilter, ...orgIdFilter, ...countryFilter },
            include: includeOrg,
            orderBy: { updatedAt: 'desc' },
            take: 200,
          })
        : Promise.resolve([]),
      // Counts / facets ignore status filter so chips always show pipeline totals.
      Promise.all([
        prisma.technology.findMany({
          where: { ...where, ...(kind && kind !== 'TECHNOLOGY' ? { id: { in: [] } } : {}) },
          select: { id: true, status: true, country: true, organizationId: true, organization: { select: { name: true } } },
          take: 500,
        }),
        prisma.challenge.findMany({
          where: { ...where, ...(kind && kind !== 'CHALLENGE' ? { id: { in: [] } } : {}) },
          select: { id: true, status: true, country: true, organizationId: true, organization: { select: { name: true } } },
          take: 500,
        }),
        prisma.fundingOffer.findMany({
          where: { ...where, ...(kind && kind !== 'FUNDING_OFFER' ? { id: { in: [] } } : {}) },
          select: { id: true, status: true, country: true, organizationId: true, organization: { select: { name: true } } },
          take: 500,
        }),
        prisma.successCase.findMany({
          where: { ...where, ...(kind && kind !== 'SUCCESS_CASE' ? { id: { in: [] } } : {}) },
          select: { id: true, status: true, country: true, organizationId: true, organization: { select: { name: true } } },
          take: 500,
        }),
      ]),
    ]);

    const [allTechs, allChallenges, allOffers, allCases] = countRows;
    const allForFacets = [...allTechs, ...allChallenges, ...allOffers, ...allCases];
    const counts = { DRAFT: 0, IN_REVIEW: 0, PUBLISHED: 0, ARCHIVED: 0 };
    for (const row of allForFacets) {
      if (row.status in counts) counts[row.status as keyof typeof counts] += 1;
    }
    const orgMap = new Map<string, string>();
    const countrySet = new Set<string>();
    for (const row of allForFacets) {
      orgMap.set(row.organizationId, row.organization.name);
      if (row.country) countrySet.add(row.country);
    }

    let items = [
      ...techs.map((t) => ({
        kind: 'TECHNOLOGY' as const,
        id: t.id,
        title: t.title,
        slug: t.slug,
        status: t.status,
        curationNote: t.curationNote,
        reviewedAt: t.reviewedAt,
        country: t.country ?? '',
        organizationId: t.organizationId,
        organizationName: t.organization.name,
        updatedAt: t.updatedAt,
        editPath: `/catalog/technologies/${t.id}/edit`,
        metrics: { likes: 0, connections: 0, connectionsPending: 0, contacts: 0, views: 0, viewsTracked: false },
      })),
      ...challenges.map((c) => ({
        kind: 'CHALLENGE' as const,
        id: c.id,
        title: c.title,
        slug: c.slug,
        status: c.status,
        curationNote: c.curationNote,
        reviewedAt: c.reviewedAt,
        country: c.country ?? '',
        organizationId: c.organizationId,
        organizationName: c.organization.name,
        updatedAt: c.updatedAt,
        editPath: `/catalog/challenges/${c.id}/edit`,
        metrics: { likes: 0, connections: 0, connectionsPending: 0, contacts: 0, views: 0, viewsTracked: false },
      })),
      ...offers.map((o) => ({
        kind: 'FUNDING_OFFER' as const,
        id: o.id,
        title: o.title,
        slug: o.slug,
        status: o.status,
        curationNote: o.curationNote,
        reviewedAt: o.reviewedAt,
        country: o.country ?? '',
        organizationId: o.organizationId,
        organizationName: o.organization.name,
        updatedAt: o.updatedAt,
        editPath: `/funding-offers/${o.id}/edit`,
        metrics: { likes: 0, connections: 0, connectionsPending: 0, contacts: 0, views: 0, viewsTracked: false },
      })),
      ...cases.map((s) => ({
        kind: 'SUCCESS_CASE' as const,
        id: s.id,
        title: s.title,
        slug: s.slug,
        status: s.status,
        curationNote: s.curationNote,
        reviewedAt: s.reviewedAt,
        country: s.country ?? '',
        organizationId: s.organizationId,
        organizationName: s.organization.name,
        updatedAt: s.updatedAt,
        editPath: `/cases/${s.id}/edit`,
        metrics: { likes: 0, connections: 0, connectionsPending: 0, contacts: 0, views: 0, viewsTracked: false },
      })),
    ];

    if (q) {
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.organizationName.toLowerCase().includes(q) ||
          (item.country ?? '').toLowerCase().includes(q) ||
          item.slug.toLowerCase().includes(q),
      );
    }

    items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    const ids = items.map((item) => item.id);
    if (ids.length > 0) {
      const [likesGrouped, connections] = await Promise.all([
        prisma.savedItem.groupBy({
          by: ['targetId'],
          where: { targetId: { in: ids } },
          _count: { _all: true },
        }),
        prisma.connection.findMany({
          where: { targetId: { in: ids } },
          select: { targetId: true, status: true },
        }),
      ]);

      const likesMap = new Map(likesGrouped.map((row) => [row.targetId, row._count._all]));
      const connMap = new Map<string, { total: number; pending: number; contacts: number }>();
      for (const conn of connections) {
        const cur = connMap.get(conn.targetId) ?? { total: 0, pending: 0, contacts: 0 };
        cur.total += 1;
        if (conn.status === 'PENDING') cur.pending += 1;
        if (conn.status === 'ACCEPTED' || conn.status === 'CONTACT_SHARED') cur.contacts += 1;
        connMap.set(conn.targetId, cur);
      }

      for (const item of items) {
        const conn = connMap.get(item.id);
        item.metrics = {
          likes: likesMap.get(item.id) ?? 0,
          connections: conn?.total ?? 0,
          connectionsPending: conn?.pending ?? 0,
          contacts: conn?.contacts ?? 0,
          views: 0,
          viewsTracked: false,
        };
      }
    }

    res.json({
      items,
      counts,
      facets: {
        organizations: [...orgMap.entries()]
          .map(([id, name]) => ({ id, name }))
          .sort((a, b) => a.name.localeCompare(b.name)),
        countries: [...countrySet].sort((a, b) => a.localeCompare(b)),
      },
    });
  } catch (error) {
    next(error);
  }
});

meRouter.get('/contents/:kind/:id', requireAuth, async (req, res, next) => {
  try {
    const kind = param(req.params.kind).toUpperCase();
    const id = param(req.params.id);
    if (!isKind(kind)) {
      res.status(400).json({ error: 'invalid_kind' });
      return;
    }

    let item: Record<string, unknown> | null = null;
    let organizationId = '';

    if (kind === 'TECHNOLOGY') {
      const row = await prisma.technology.findUnique({
        where: { id },
        include: { tags: true, organization: true },
      });
      if (row) {
        organizationId = row.organizationId;
        item = { ...row, tags: row.tags.map((t) => t.tag), kind };
      }
    } else if (kind === 'CHALLENGE') {
      const row = await prisma.challenge.findUnique({ where: { id }, include: { organization: true } });
      if (row) {
        organizationId = row.organizationId;
        item = { ...row, kind };
      }
    } else if (kind === 'FUNDING_OFFER') {
      const row = await prisma.fundingOffer.findUnique({ where: { id }, include: { organization: true } });
      if (row) {
        organizationId = row.organizationId;
        item = { ...row, kind };
      }
    } else {
      const row = await prisma.successCase.findUnique({
        where: { id },
        include: { organization: true, needs: true, media: true },
      });
      if (row) {
        organizationId = row.organizationId;
        item = {
          ...row,
          kind,
          needs: row.needs.map((n) => n.needType).join(','),
          evidence: row.media.map((m) => m.caption || m.url).filter(Boolean).join(' | '),
        };
      }
    }

    if (!item) {
      res.status(404).json({ error: 'not_found' });
      return;
    }

    await assertCanActForOrganization(req.auth!.sub, organizationId, req.auth!.role);
    res.json({ item });
  } catch (error) {
    next(error);
  }
});

meRouter.post('/contents/:kind/:id/withdraw', requireAuth, async (req, res, next) => {
  try {
    const kind = param(req.params.kind).toUpperCase();
    const id = param(req.params.id);
    if (!isKind(kind)) {
      res.status(400).json({ error: 'invalid_kind' });
      return;
    }

    const data = { status: ContentStatus.DRAFT };

    if (kind === 'TECHNOLOGY') {
      const current = await prisma.technology.findUnique({ where: { id } });
      if (!current) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      await assertCanActForOrganization(req.auth!.sub, current.organizationId, req.auth!.role);
      if (current.status === ContentStatus.DRAFT) {
        res.status(400).json({ error: 'already_draft' });
        return;
      }
      const item = await prisma.technology.update({ where: { id }, data });
      res.json({ item: { ...item, kind } });
      return;
    }
    if (kind === 'CHALLENGE') {
      const current = await prisma.challenge.findUnique({ where: { id } });
      if (!current) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      await assertCanActForOrganization(req.auth!.sub, current.organizationId, req.auth!.role);
      if (current.status === ContentStatus.DRAFT) {
        res.status(400).json({ error: 'already_draft' });
        return;
      }
      const item = await prisma.challenge.update({ where: { id }, data });
      res.json({ item: { ...item, kind } });
      return;
    }
    if (kind === 'FUNDING_OFFER') {
      const current = await prisma.fundingOffer.findUnique({ where: { id } });
      if (!current) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      await assertCanActForOrganization(req.auth!.sub, current.organizationId, req.auth!.role);
      if (current.status === ContentStatus.DRAFT) {
        res.status(400).json({ error: 'already_draft' });
        return;
      }
      const item = await prisma.fundingOffer.update({ where: { id }, data });
      res.json({ item: { ...item, kind } });
      return;
    }

    const current = await prisma.successCase.findUnique({ where: { id } });
    if (!current) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    await assertCanActForOrganization(req.auth!.sub, current.organizationId, req.auth!.role);
    if (current.status === ContentStatus.DRAFT) {
      res.status(400).json({ error: 'already_draft' });
      return;
    }
    const item = await prisma.successCase.update({ where: { id }, data });
    res.json({ item: { ...item, kind } });
  } catch (error) {
    next(error);
  }
});

meRouter.delete('/contents/:kind/:id', requireAuth, async (req, res, next) => {
  try {
    const kind = param(req.params.kind).toUpperCase();
    const id = param(req.params.id);
    if (!isKind(kind)) {
      res.status(400).json({ error: 'invalid_kind' });
      return;
    }

    const load =
      kind === 'TECHNOLOGY'
        ? await prisma.technology.findUnique({ where: { id } })
        : kind === 'CHALLENGE'
          ? await prisma.challenge.findUnique({ where: { id } })
          : kind === 'FUNDING_OFFER'
            ? await prisma.fundingOffer.findUnique({ where: { id } })
            : await prisma.successCase.findUnique({ where: { id } });

    if (!load) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    await assertCanActForOrganization(req.auth!.sub, load.organizationId, req.auth!.role);
    if (load.status !== ContentStatus.DRAFT) {
      res.status(400).json({ error: 'only_draft_deletable' });
      return;
    }

    if (kind === 'TECHNOLOGY') await prisma.technology.delete({ where: { id } });
    else if (kind === 'CHALLENGE') await prisma.challenge.delete({ where: { id } });
    else if (kind === 'FUNDING_OFFER') await prisma.fundingOffer.delete({ where: { id } });
    else await prisma.successCase.delete({ where: { id } });

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
