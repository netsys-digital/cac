import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { param } from '../../lib/params.js';

export const domainsRouter = Router();

domainsRouter.get('/:grouping', async (req, res, next) => {
  try {
    const items = await prisma.domain.findMany({
      where: { grouping: param(req.params.grouping) },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        grouping: true,
        key: true,
        labelPt: true,
        labelEn: true,
        sortOrder: true,
      },
    });
    res.json({ items });
  } catch (error) {
    next(error);
  }
});
