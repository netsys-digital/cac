import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';

const app = createApp();

describe('POST /api/search', () => {
  beforeAll(async () => {
    // ensure app boots; DB seeded in CI/dev
  });

  it('returns interpretation, facets, factors and 3 paths without whoCanImplement', async () => {
    const res = await request(app)
      .post('/api/search')
      .send({ query: 'recuperação de pastagens em seca', filters: {}, lang: 'pt' });

    expect(res.status).toBe(200);
    expect(res.body.interpretation).toMatchObject({
      challenge: expect.any(String),
      context: expect.any(String),
      sector: expect.any(String),
      intent: expect.any(String),
    });
    expect(res.body.facets).toMatchObject({
      solutions: expect.any(Number),
      projects: expect.any(Number),
      organizations: expect.any(Number),
      funders: expect.any(Number),
    });
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.paths).toHaveProperty('whoCanSolve');
    expect(res.body.paths).toHaveProperty('whoCanFund');
    expect(res.body.paths).toHaveProperty('relatedProjects');
    expect(res.body.paths).not.toHaveProperty('whoCanImplement');

    if (res.body.results.length) {
      const top = res.body.results[0];
      expect(top.score).toBeGreaterThanOrEqual(60);
      expect(top.factors.length).toBeGreaterThanOrEqual(3);
    }

    const topScores = res.body.results.slice(0, 3).map((r: { score: number }) => r.score);
    // Demo meta when catalogue seed is present
    if (topScores.length >= 3 && res.body.results.some((r: { slug: string }) => r.slug === 'recuperacao-pastagens-seca')) {
      expect(topScores[0]).toBe(94);
      expect(topScores).toContain(89);
      expect(topScores).toContain(83);
    }
  });

  it('respects MATCH_MIN_SCORE threshold', async () => {
    const res = await request(app).post('/api/search').send({ query: 'zzzz-not-a-real-match-xyz' });
    expect(res.status).toBe(200);
    for (const item of res.body.results) {
      expect(item.score).toBeGreaterThanOrEqual(60);
    }
  });
});
