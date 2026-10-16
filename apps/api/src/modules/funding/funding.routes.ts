import { Router } from 'express';
import {
  ContentStatus,
  createFundingOfferBodySchema,
  createFunderProfileBodySchema,
  updateFundingOfferBodySchema,
  UserRole,
} from '@cac/shared';
import { assertCanActForOrganization, assertCanPublishKind } from '../../lib/org-access.js';
import { prisma } from '../../lib/prisma.js';
import { slugify } from '../../lib/slug.js';
import { callCardData } from '../../lib/call-card.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { isUuid, param } from '../../lib/params.js';
import { enqueueTranslation, enqueueTranslationIfPublished, localizeEntities, localizeOne, requestLang } from '../../lib/translation/index.js';
import { applicationPlacesFor, syncContentPlaces } from '../../lib/content-places.js';

export const fundingOffersRouter = Router();
export const fundersRouter = Router();

fundingOffersRouter.get('/', async (req, res, next) => {
  try {
    const activeOnly = req.query.active === 'true';
    const now = new Date();
    const items = await prisma.fundingOffer.findMany({
      where: {
        status: ContentStatus.PUBLISHED,
        ...(activeOnly
          ? { OR: [{ deadline: null }, { deadline: { gte: now } }] }
          : {}),
      },
      include: { organization: true },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
    res.json({
      items: await localizeEntities('funding_offer', items, requestLang(req.query), {
        nestedOrganization: true,
      }),
    });
  } catch (error) {
    next(error);
  }
});

fundingOffersRouter.get('/:slugOrId', async (req, res, next) => {
  try {
    const key = param(req.params.slugOrId);
    const item = await prisma.fundingOffer.findFirst({
      where: {
        ...(isUuid(key) ? { OR: [{ slug: key }, { id: key }] } : { slug: key }),
        status: ContentStatus.PUBLISHED,
      },
      include: { organization: true },
    });
    if (!item) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    const offer = await localizeOne('funding_offer', item, requestLang(req.query), { nestedOrganization: true });
    res.json({
      offer: {
        ...offer,
        applicationPlaces: await applicationPlacesFor('FUNDING_OFFER', item.id),
      },
    });
  } catch (error) {
    next(error);
  }
});

fundingOffersRouter.post('/', requireAuth, validateBody(createFundingOfferBodySchema), async (req, res, next) => {
  try {
    await assertCanPublishKind(req.auth!.sub, req.body.organizationId, req.auth!.role, 'FUNDING_OFFER');
    const slug = req.body.slug || slugify(req.body.title);
    const deadline = req.body.deadline ? new Date(req.body.deadline) : null;
    const offer = await prisma.fundingOffer.create({
      data: {
        title: req.body.title,
        slug,
        summary: req.body.summary,
        whatFunds: req.body.whatFunds,
        criteria: req.body.criteria,
        amountRange: req.body.amountRange,
        officialUrl: req.body.officialUrl || null,
        deadline,
        country: req.body.country,
        region: req.body.region,
        organizationId: req.body.organizationId,
        bannerLinkUrl: req.body.bannerLinkUrl ? String(req.body.bannerLinkUrl).trim() || null : null,
        bannerPosition: req.body.bannerPosition,
        ...callCardData(req.body),
        status: ContentStatus.DRAFT,
      },
    });
    await syncContentPlaces('FUNDING_OFFER', offer.id, {
      country: offer.country,
      region: offer.region,
      applicationPlaces: req.body.applicationPlaces,
    });
    res.status(201).json({ offer });
  } catch (error) {
    next(error);
  }
});

fundingOffersRouter.patch(
  '/:id',
  requireAuth,
  validateBody(updateFundingOfferBodySchema),
  async (req, res, next) => {
    try {
      const current = await prisma.fundingOffer.findUnique({ where: { id: param(req.params.id) } });
      if (!current) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      await assertCanActForOrganization(req.auth!.sub, current.organizationId, req.auth!.role);
      const { applicationPlaces, ...body } = req.body;
      const offer = await prisma.fundingOffer.update({
        where: { id: current.id },
        data: {
          ...body,
          deadline: body.deadline === undefined ? undefined : body.deadline ? new Date(body.deadline) : null,
          officialUrl: body.officialUrl === '' ? null : body.officialUrl,
          bannerLinkUrl:
            body.bannerLinkUrl === undefined
              ? undefined
              : body.bannerLinkUrl === '' || body.bannerLinkUrl === null
                ? null
                : body.bannerLinkUrl,
          bannerPosition: body.bannerPosition,
          ...callCardData(body),
        },
      });
      await syncContentPlaces('FUNDING_OFFER', offer.id, {
        country: body.country ?? offer.country,
        region: body.region ?? offer.region,
        applicationPlaces,
      });
      void enqueueTranslationIfPublished(offer.status, { entityType: 'funding_offer', entityId: offer.id });
      res.json({ offer });
    } catch (error) {
      next(error);
    }
  },
);

fundingOffersRouter.post('/:id/submit', requireAuth, async (req, res, next) => {
  try {
    const current = await prisma.fundingOffer.findUnique({ where: { id: param(req.params.id) } });
    if (!current) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    await assertCanActForOrganization(req.auth!.sub, current.organizationId, req.auth!.role);
    if (current.status !== ContentStatus.DRAFT) {
      res.status(400).json({ error: 'invalid_status' });
      return;
    }
    const offer = await prisma.fundingOffer.update({
      where: { id: current.id },
      data: { status: ContentStatus.IN_REVIEW },
    });
    res.json({ offer });
  } catch (error) {
    next(error);
  }
});

fundingOffersRouter.post(
  '/:id/publish',
  requireAuth,
  requireRole(UserRole.ADMIN, UserRole.CURADOR),
  async (req, res, next) => {
    try {
      const current = await prisma.fundingOffer.findUnique({ where: { id: param(req.params.id) } });
      if (!current || current.status !== ContentStatus.IN_REVIEW) {
        res.status(400).json({ error: 'invalid_status' });
        return;
      }
      const offer = await prisma.fundingOffer.update({
        where: { id: current.id },
        data: { status: ContentStatus.PUBLISHED },
      });
      void enqueueTranslation({ entityType: 'funding_offer', entityId: offer.id });
      res.json({ offer });
    } catch (error) {
      next(error);
    }
  },
);

fundersRouter.get('/', async (req, res, next) => {
  try {
    const items = await prisma.funderProfile.findMany({
      where: { status: ContentStatus.PUBLISHED },
      include: { organization: true },
      orderBy: { name: 'asc' },
      take: 100,
    });
    res.json({
      items: await localizeEntities('funder', items, requestLang(req.query), { nestedOrganization: true }),
    });
  } catch (error) {
    next(error);
  }
});

fundersRouter.get('/:slugOrId', async (req, res, next) => {
  try {
    const key = param(req.params.slugOrId);
    const item = await prisma.funderProfile.findFirst({
      where: {
        ...(isUuid(key) ? { OR: [{ slug: key }, { id: key }] } : { slug: key }),
        status: ContentStatus.PUBLISHED,
      },
      include: { organization: true },
    });
    if (!item) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.json({
      funder: await localizeOne('funder', item, requestLang(req.query), { nestedOrganization: true }),
    });
  } catch (error) {
    next(error);
  }
});

fundersRouter.post('/', requireAuth, validateBody(createFunderProfileBodySchema), async (req, res, next) => {
  try {
    if (req.body.organizationId) {
      await assertCanActForOrganization(req.auth!.sub, req.body.organizationId, req.auth!.role);
    }
    const slug = req.body.slug || slugify(req.body.name);
    const funder = await prisma.funderProfile.create({
      data: {
        name: req.body.name,
        slug,
        summary: req.body.summary,
        country: req.body.country,
        region: req.body.region,
        organizationId: req.body.organizationId,
        status: ContentStatus.PUBLISHED,
      },
    });
    void enqueueTranslation({ entityType: 'funder', entityId: funder.id });
    res.status(201).json({ funder });
  } catch (error) {
    next(error);
  }
});
