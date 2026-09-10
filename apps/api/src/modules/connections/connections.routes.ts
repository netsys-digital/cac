import { Router } from 'express';
import { createConnectionBodySchema, declineConnectionBodySchema } from '@cac/shared';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { param } from '../../lib/params.js';
import {
  acceptConnection,
  closeConnection,
  createConnection,
  declineConnection,
  listConnectionsForUser,
} from './connections.service.js';

export const connectionsRouter = Router();

connectionsRouter.use(requireAuth);

connectionsRouter.get('/', async (req, res, next) => {
  try {
    const items = await listConnectionsForUser(req.auth!.sub, req.auth!.role);
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

connectionsRouter.post('/', validateBody(createConnectionBodySchema), async (req, res, next) => {
  try {
    const connection = await createConnection(req.auth!.sub, req.auth!.role, req.body);
    res.status(201).json({ connection });
  } catch (error) {
    next(error);
  }
});

connectionsRouter.patch('/:id/accept', async (req, res, next) => {
  try {
    const connection = await acceptConnection(param(req.params.id), req.auth!.sub, req.auth!.role);
    res.json({ connection });
  } catch (error) {
    next(error);
  }
});

connectionsRouter.patch(
  '/:id/decline',
  validateBody(declineConnectionBodySchema),
  async (req, res, next) => {
    try {
      const connection = await declineConnection(
        param(req.params.id),
        req.auth!.sub,
        req.auth!.role,
        req.body,
      );
      res.json({ connection });
    } catch (error) {
      next(error);
    }
  },
);

connectionsRouter.patch('/:id/close', async (req, res, next) => {
  try {
    const connection = await closeConnection(param(req.params.id), req.auth!.sub, req.auth!.role);
    res.json({ connection });
  } catch (error) {
    next(error);
  }
});
