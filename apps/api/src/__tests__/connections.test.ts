import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';

const app = createApp();
const suffix = Date.now();
const password = 'password123';

async function register(email: string, name: string) {
  const res = await request(app).post('/api/auth/register').send({ email, password, name });
  expect(res.status).toBe(201);
  return res.body as { accessToken: string; user: { id: string } };
}

describe('E4 connections + governance', () => {
  let requesterToken = '';
  let targetToken = '';
  let adminToken = '';
  let requesterOrgId = '';
  let targetOrgId = '';
  let techId = '';
  let connectionId = '';

  beforeAll(async () => {
    try {
      await redis.connect();
    } catch {
      // ignore
    }
    const requester = await register(`e4-req-${suffix}@example.com`, 'E4 Requester');
    requesterToken = requester.accessToken;
    const target = await register(`e4-tgt-${suffix}@example.com`, 'E4 Target');
    targetToken = target.accessToken;

    const adminLogin = await request(app).post('/api/auth/login').send({
      email: process.env.SEED_ADMIN_EMAIL ?? 'admin@cac.local',
      password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!',
    });
    expect(adminLogin.status).toBe(200);
    adminToken = adminLogin.body.accessToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: [`e4-req-${suffix}@example.com`, `e4-tgt-${suffix}@example.com`] } },
    });
    await prisma.$disconnect();
    redis.disconnect();
  });

  it('rejects connection without required fields', async () => {
    const res = await request(app)
      .post('/api/connections')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({ message: 'hi' });
    expect(res.status).toBe(400);
  });

  it('creates two orgs + published tech on target org', async () => {
    const logo = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
    const reqOrg = await request(app)
      .post('/api/organizations')
      .set('Authorization', `Bearer ${requesterToken}`)
      .field('name', `Req Org ${suffix}`)
      .field('summary', 'Resumo institucional com tamanho suficiente para o schema.')
      .field('country', 'BR')
      .field('region', 'south_america')
      .attach('logo', logo, { filename: 'logo.png', contentType: 'image/png' });
    expect(reqOrg.status).toBe(201);
    requesterOrgId = reqOrg.body.organization.id;

    const tgtOrg = await request(app)
      .post('/api/organizations')
      .set('Authorization', `Bearer ${targetToken}`)
      .field('name', `Tgt Org ${suffix}`)
      .field('summary', 'Resumo institucional com tamanho suficiente para o schema.')
      .field('country', 'BR')
      .field('region', 'south_america')
      .attach('logo', logo, { filename: 'logo.png', contentType: 'image/png' });
    expect(tgtOrg.status).toBe(201);
    targetOrgId = tgtOrg.body.organization.id;

    const tech = await request(app)
      .post('/api/technologies')
      .set('Authorization', `Bearer ${targetToken}`)
      .send({
        title: `Tech E4 ${suffix}`,
        summary: 'Summary long enough for schema',
        problemStatement: 'Problem statement long enough for schema validation',
        howItWorks: 'How it works long enough for schema validation',
        organizationId: targetOrgId,
        country: 'BR',
      });
    expect(tech.status).toBe(201);
    techId = tech.body.technology.id;

    await request(app)
      .post(`/api/technologies/${techId}/submit`)
      .set('Authorization', `Bearer ${targetToken}`);
    const pub = await request(app)
      .post(`/api/technologies/${techId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(pub.status).toBe(200);
  });

  it('creates PENDING connection and accepts it', async () => {
    const create = await request(app)
      .post('/api/connections')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        requesterOrgId,
        targetType: 'TECHNOLOGY',
        targetId: techId,
        objective: 'KNOW_MORE',
        message: 'Gostaria de conhecer a solução.',
      });
    expect(create.status).toBe(201);
    expect(create.body.connection.status).toBe('PENDING');
    expect(create.body.connection.targetOrgId).toBe(targetOrgId);
    connectionId = create.body.connection.id;

    const accept = await request(app)
      .patch(`/api/connections/${connectionId}/accept`)
      .set('Authorization', `Bearer ${targetToken}`);
    expect(accept.status).toBe(200);
    expect(accept.body.connection.status).toBe('ACCEPTED');
  });

  it('staff cannot accept connection as third party', async () => {
    const create = await request(app)
      .post('/api/connections')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        requesterOrgId,
        targetType: 'TECHNOLOGY',
        targetId: techId,
        objective: 'KNOW_MORE',
        message: 'Pedido para testar bloqueio de staff.',
      });
    expect(create.status).toBe(201);
    const pendingId = create.body.connection.id as string;

    const adminAccept = await request(app)
      .patch(`/api/connections/${pendingId}/accept`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminAccept.status).toBe(403);

    const decline = await request(app)
      .patch(`/api/connections/${pendingId}/decline`)
      .set('Authorization', `Bearer ${targetToken}`)
      .send({ reason: 'Fora do escopo das prioridades atuais da organização.' });
    expect(decline.status).toBe(200);
    expect(decline.body.connection.status).toBe('DECLINED');
    expect(decline.body.connection.declineReason).toContain('Fora do escopo');
  });

  it('decline without reason is rejected', async () => {
    const create = await request(app)
      .post('/api/connections')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        requesterOrgId,
        targetType: 'TECHNOLOGY',
        targetId: techId,
        objective: 'KNOW_MORE',
        message: 'Pedido sem justificativa no decline.',
      });
    expect(create.status).toBe(201);
    const pendingId = create.body.connection.id as string;

    const bad = await request(app)
      .patch(`/api/connections/${pendingId}/decline`)
      .set('Authorization', `Bearer ${targetToken}`)
      .send({});
    expect(bad.status).toBe(400);

    const stillPending = await request(app)
      .patch(`/api/connections/${pendingId}/decline`)
      .set('Authorization', `Bearer ${targetToken}`)
      .send({ reason: 'Informações insuficientes para avaliar a solicitação neste momento.' });
    expect(stillPending.status).toBe(200);
  });

  it('saves item and follows organization', async () => {
    const saved = await request(app)
      .post('/api/saved-items')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({ targetType: 'TECHNOLOGY', targetId: techId });
    expect(saved.status).toBe(201);

    const follow = await request(app)
      .post('/api/follows')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({ organizationId: targetOrgId });
    expect(follow.status).toBe(201);

    const listSaved = await request(app)
      .get('/api/saved-items')
      .set('Authorization', `Bearer ${requesterToken}`);
    expect(listSaved.body.items.length).toBeGreaterThanOrEqual(1);

    const listFollow = await request(app)
      .get('/api/follows')
      .set('Authorization', `Bearer ${requesterToken}`);
    expect(listFollow.body.items.length).toBeGreaterThanOrEqual(1);
  });

  it('admin pending + kpis', async () => {
    const pending = await request(app)
      .get('/api/admin/pending')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(pending.status).toBe(200);
    expect(Array.isArray(pending.body.items)).toBe(true);

    const kpis = await request(app)
      .get('/api/admin/kpis')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(kpis.status).toBe(200);
    expect(kpis.body.kpis.organizations).toBeGreaterThan(0);
  });
});
