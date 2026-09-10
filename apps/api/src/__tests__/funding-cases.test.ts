import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';

const app = createApp();
const suffix = Date.now();
const password = 'password123';

describe('E5 funding + cases', () => {
  let token = '';
  let adminToken = '';
  let orgId = '';

  beforeAll(async () => {
    try {
      await redis.connect();
    } catch {
      // ignore
    }
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email: `e5-${suffix}@example.com`, password, name: 'E5 User' });
    expect(reg.status).toBe(201);
    token = reg.body.accessToken;

    const admin = await request(app).post('/api/auth/login').send({
      email: process.env.SEED_ADMIN_EMAIL ?? 'admin@cac.local',
      password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!',
    });
    adminToken = admin.body.accessToken;

    const logo = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
    const org = await request(app)
      .post('/api/organizations')
      .set('Authorization', `Bearer ${token}`)
      .field('name', `E5 Org ${suffix}`)
      .field('summary', 'Resumo institucional com tamanho suficiente para o schema.')
      .field('country', 'MZ')
      .field('region', 'africa')
      .attach('logo', logo, { filename: 'logo.png', contentType: 'image/png' });
    orgId = org.body.organization.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: `e5-${suffix}@example.com` } });
    await prisma.$disconnect();
    redis.disconnect();
  });

  it('creates funding offer and success case workflow', async () => {
    const offer = await request(app)
      .post('/api/funding-offers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Offer E5 ${suffix}`,
        summary: 'Active funding offer for climate adaptation projects.',
        whatFunds: 'Water harvesting',
        organizationId: orgId,
        country: 'MZ',
        deadline: new Date(Date.now() + 86400000 * 60).toISOString(),
      });
    expect(offer.status).toBe(201);
    const offerId = offer.body.offer.id;
    await request(app)
      .post(`/api/funding-offers/${offerId}/submit`)
      .set('Authorization', `Bearer ${token}`);
    const pubOffer = await request(app)
      .post(`/api/funding-offers/${offerId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(pubOffer.status).toBe(200);

    const successCase = await request(app)
      .post('/api/success-cases')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Case E5 ${suffix}`,
        summary: 'Rainwater harvesting horticulture case with evidence notes.',
        country: 'MZ',
        organizationId: orgId,
        needs: [{ needType: 'FUNDING', detail: 'Scale cisterns' }],
        evidenceNotes: ['Baseline survey', 'Yield increase report'],
      });
    expect(successCase.status).toBe(201);
    const caseId = successCase.body.successCase.id;
    await request(app)
      .post(`/api/success-cases/${caseId}/submit`)
      .set('Authorization', `Bearer ${token}`);
    const pubCase = await request(app)
      .post(`/api/success-cases/${caseId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(pubCase.status).toBe(200);
  });

  it('lists active offers and published cases; whoCanFund excludes directory', async () => {
    const offers = await request(app).get('/api/funding-offers?active=true');
    expect(offers.status).toBe(200);
    expect(offers.body.items.length).toBeGreaterThan(0);

    const cases = await request(app).get('/api/success-cases');
    expect(cases.status).toBe(200);

    const search = await request(app)
      .post('/api/search')
      .send({ query: 'pastagens seca financiamento', lang: 'pt' });
    expect(search.status).toBe(200);
    for (const item of search.body.paths.whoCanFund) {
      expect(item.kind).toBe('ACTIVE_OFFER');
    }
  });
});
