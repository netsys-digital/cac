import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';

const app = createApp();
const suffix = Date.now();
const userEmail = `e1-user-${suffix}@example.com`;
const outsiderEmail = `e1-out-${suffix}@example.com`;
const password = 'password123';

async function register(email: string, name: string) {
  const res = await request(app).post('/api/auth/register').send({ email, password, name });
  expect(res.status).toBe(201);
  return res.body as { accessToken: string; user: { id: string } };
}

describe('E1 catalog + representation', () => {
  let userToken = '';
  let outsiderToken = '';
  let adminToken = '';
  let orgId = '';
  let techId = '';

  beforeAll(async () => {
    try {
      await redis.connect();
    } catch {
      // ignore
    }

    const user = await register(userEmail, 'E1 User');
    userToken = user.accessToken;

    const outsider = await register(outsiderEmail, 'E1 Outsider');
    outsiderToken = outsider.accessToken;

    const adminLogin = await request(app).post('/api/auth/login').send({
      email: process.env.SEED_ADMIN_EMAIL ?? 'admin@cac.local',
      password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!',
    });
    expect(adminLogin.status).toBe(200);
    adminToken = adminLogin.body.accessToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [userEmail, outsiderEmail] } } });
    await prisma.$disconnect();
    redis.disconnect();
  });

  it('creates organization', async () => {
    const logo = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
    const res = await request(app)
      .post('/api/organizations')
      .set('Authorization', `Bearer ${userToken}`)
      .field('name', `Org E1 ${suffix}`)
      .field('summary', 'Resumo institucional com tamanho suficiente para o schema.')
      .field('country', 'BR')
      .field('region', 'south_america')
      .attach('logo', logo, { filename: 'logo.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    expect(res.body.organization.logoUrl).toMatch(/^\/uploads\//);
    orgId = res.body.organization.id;
  });

  it('blocks outsider technology without representation', async () => {
    const res = await request(app)
      .post('/api/technologies')
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({
        title: 'Blocked tech',
        summary: 'Should not be allowed to create for foreign org',
        problemStatement: 'Problem text for validation length ok',
        howItWorks: 'How it works text for validation length ok',
        organizationId: orgId,
        country: 'BR',
      });
    expect(res.status).toBe(403);
  });

  it('representation request → approve → membership', async () => {
    const reqRes = await request(app)
      .post(`/api/organizations/${orgId}/representation-requests`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .field('unit', 'Unidade Experimental')
      .field('linkRole', 'Pesquisador')
      .field('interest', 'Quero representar a organização no catálogo AgriZONE Connect.')
      .attach('proofDocument1', Buffer.from('%PDF-1.4 proof'), {
        filename: 'proof.pdf',
        contentType: 'application/pdf',
      });
    expect(reqRes.status).toBe(201);
    expect(reqRes.body.request.proofDocument1Url).toMatch(/^\/uploads\//);
    const requestId = reqRes.body.request.id;

    const approve = await request(app)
      .post(`/api/admin/representation-requests/${requestId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(approve.status).toBe(200);
    expect(approve.body.request.status).toBe('APPROVED');

    const member = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: approve.body.request.userId,
          organizationId: orgId,
        },
      },
    });
    expect(member).toBeTruthy();
  });

  it('technology DRAFT → submit → publish', async () => {
    const create = await request(app)
      .post('/api/technologies')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: `Pasture recovery ${suffix}`,
        summary: 'Solution summary for dry pasture recovery demo',
        problemStatement: 'Degraded pastures under drought need recovery practices',
        howItWorks: 'Integrated soil cover and rotational grazing practices',
        organizationId: orgId,
        country: 'BR',
        region: 'latam',
        tags: ['pasture', 'drought'],
      });
    expect(create.status).toBe(201);
    expect(create.body.technology.status).toBe('DRAFT');
    techId = create.body.technology.id;

    const submit = await request(app)
      .post(`/api/technologies/${techId}/submit`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(submit.status).toBe(200);
    expect(submit.body.technology.status).toBe('IN_REVIEW');

    const publish = await request(app)
      .post(`/api/technologies/${techId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(publish.status).toBe(200);
    expect(publish.body.technology.status).toBe('PUBLISHED');
  });

  it('creates challenge with needType and project with type', async () => {
    const challenge = await request(app)
      .post('/api/challenges')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: `Drought challenge ${suffix}`,
        summary: 'Need solutions for pasture recovery in dry regions',
        needType: 'TECHNOLOGY',
        organizationId: orgId,
        country: 'BR',
      });
    expect(challenge.status).toBe(201);
    expect(challenge.body.challenge.needType).toBe('TECHNOLOGY');

    const project = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: `Policy programme ${suffix}`,
        type: 'POLICY',
        summary: 'National policy supporting climate-smart agriculture practices',
        organizationId: orgId,
        country: 'BR',
      });
    expect(project.status).toBe(201);
    expect(project.body.project.type).toBe('POLICY');
  });

  it('rejects invalid upload mime', async () => {
    const res = await request(app)
      .post(`/api/technologies/${techId}/media`)
      .set('Authorization', `Bearer ${userToken}`)
      .attach('file', Buffer.from('not-an-image'), {
        filename: 'evil.exe',
        contentType: 'application/x-msdownload',
      });
    expect(res.status).toBe(400);
  });

  it('verifies organization', async () => {
    const res = await request(app)
      .post(`/api/admin/organizations/${orgId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.organization.verificationStatus).toBe('VERIFIED');
  });

  it('country seed is complete', async () => {
    const count = await prisma.domain.count({ where: { grouping: 'country' } });
    expect(count).toBeGreaterThanOrEqual(240);
  });
});
