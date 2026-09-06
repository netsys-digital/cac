import { Router } from 'express';
import { searchBodySchema } from '@cac/shared';
import { validateBody } from '../../middleware/validate.js';
import { runSearch } from './search.service.js';

export const searchRouter = Router();

searchRouter.post('/', validateBody(searchBodySchema), async (req, res, next) => {
  try {
    const result = await runSearch(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});
