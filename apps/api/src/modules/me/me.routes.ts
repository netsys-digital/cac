import { Router } from 'express';
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
