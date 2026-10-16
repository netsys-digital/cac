import { Router } from 'express';
import { buildMapSnapshot } from './map.service.js';

export const mapRouter = Router();

mapRouter.get('/', async (_req, res, next) => {
  try {
    res.json(await buildMapSnapshot());
  } catch (error) {
    next(error);
  }
});
