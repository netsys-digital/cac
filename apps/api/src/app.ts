import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import path from 'node:path';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { redis } from './lib/redis.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { challengesRouter } from './modules/challenges/challenges.routes.js';
import { domainsRouter } from './modules/domains/domains.routes.js';
import { meRouter } from './modules/me/me.routes.js';
import { mediaRouter } from './modules/media/media.routes.js';
import { organizationsRouter } from './modules/organizations/organizations.routes.js';
import { projectsRouter } from './modules/projects/projects.routes.js';
import { searchRouter } from './modules/search/search.routes.js';
import { matchRouter } from './modules/search/match.routes.js';
import { technologiesRouter } from './modules/technologies/technologies.routes.js';
import { connectionsRouter } from './modules/connections/connections.routes.js';
import { followsRouter, savedItemsRouter } from './modules/saved/saved.routes.js';
import { fundingOffersRouter, fundersRouter } from './modules/funding/funding.routes.js';
import { successCasesRouter } from './modules/cases/cases.routes.js';

export function createApp() {
  const app = express();
  const uploadDir = path.resolve(process.env.UPLOAD_DIR || 'uploads');

  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use('/uploads', express.static(uploadDir));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', brand: env.brandShort });
  });

  app.get('/ready', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      if (redis.status !== 'ready') {
        await redis.connect();
      }
      const pong = await redis.ping();
      if (pong !== 'PONG') {
        throw new Error('redis_unavailable');
      }
      res.json({ status: 'ready' });
    } catch {
      res.status(503).json({ status: 'not_ready' });
    }
  });

  app.get('/api/brand', (_req, res) => {
    res.json({
      name: env.brandName,
      short: env.brandShort,
      logo: env.brandLogo,
    });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/domains', domainsRouter);
  app.use('/api/organizations', organizationsRouter);
  app.use('/api/me', meRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/technologies', technologiesRouter);
  app.use('/api/challenges', challengesRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/search', searchRouter);
  app.use('/api/match', matchRouter);
  app.use('/api/connections', connectionsRouter);
  app.use('/api/saved-items', savedItemsRouter);
  app.use('/api/follows', followsRouter);
  app.use('/api/funding-offers', fundingOffersRouter);
  app.use('/api/funders', fundersRouter);
  app.use('/api/success-cases', successCasesRouter);
  app.use('/api', mediaRouter);

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err && typeof err === 'object' && 'status' in err) {
      const status = Number((err as { status: number }).status) || 500;
      const message = err instanceof Error ? err.message : 'error';
      res.status(status).json({ error: message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  });

  return app;
}
