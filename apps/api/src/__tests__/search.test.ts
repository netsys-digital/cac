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

    // Demo meta: scores calibrados por slug (não exige que sejam os únicos no top-3 —
    // sinônimos multilíngues podem elevar outros itens próximos).
    const bySlug = new Map(
      (res.body.results as Array<{ slug: string; score: number }>).map((r) => [r.slug, r.score]),
    );
    if (bySlug.has('recuperacao-pastagens-seca')) {
      expect(bySlug.get('recuperacao-pastagens-seca')).toBe(94);
      expect(bySlug.get('rede-pastagens-resilientes')).toBe(89);
      expect(bySlug.get('manejo-hidrico-pequenos-produtores')).toBe(83);
    }
  });

  it('returns results for English drought/pasture query against PT catalogue', async () => {
    const res = await request(app)
      .post('/api/search')
      .send({ query: 'pasture drought recovery', filters: {}, lang: 'en' });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.results)).toBe(true);
    if (res.body.results.some((r: { slug: string }) => r.slug === 'recuperacao-pastagens-seca')) {
      expect(res.body.results[0].slug).toBe('recuperacao-pastagens-seca');
      expect(res.body.results[0].score).toBeGreaterThanOrEqual(60);
    }
  });

  it('respects MATCH_MIN_SCORE threshold', async () => {
    const min = Number(process.env.MATCH_MIN_SCORE ?? 5);
    const res = await request(app).post('/api/search').send({ query: 'zzzz-not-a-real-match-xyz' });
    expect(res.status).toBe(200);
    for (const item of res.body.results) {
      expect(item.score).toBeGreaterThanOrEqual(min);
    }
  });
});
