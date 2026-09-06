import { Router } from 'express';
import { param } from '../../lib/params.js';
import { runMatchForChallenge } from '../search/search.service.js';

export const matchRouter = Router();

matchRouter.post('/challenge/:id', async (req, res, next) => {
  try {
    const result = await runMatchForChallenge(param(req.params.id));
    res.json(result);
  } catch (error) {
    next(error);
  }
});
