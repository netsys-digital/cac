import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { hashPassword } from '../modules/auth/auth.service.js';

const app = createApp();
const suffix = Date.now();
const memberEmail = `admin-users-${suffix}@example.com`;
const curatorEmail = `admin-users-cur-${suffix}@example.com`;
const password = 'password123';

describe('admin users', () => {
  let adminToken = '';
  let adminId = '';
  let memberToken = '';
  let memberId = '';
  let curatorToken = '';

  beforeAll(async () => {
    try {
      await redis.connect();
    } catch {
      // ignore
    }

    const member = await request(app).post('/api/auth/register').send({
      email: memberEmail,
      password,
      name: 'Managed User',
    });
    expect(member.status).toBe(201);
    memberToken = member.body.accessToken;
    memberId = member.body.user.id;

    await prisma.user.create({
      data: {
        email: curatorEmail,
        passwordHash: await hashPassword(password),
        name: 'Temp Curator',
        role: 'CURADOR',
      },
    });
    const curatorLogin = await request(app).post('/api/auth/login').send({
      email: curatorEmail,
      password,
    });
    expect(curatorLogin.status).toBe(200);
    curatorToken = curatorLogin.body.accessToken;

    const adminLogin = await request(app).post('/api/auth/login').send({
      email: process.env.SEED_ADMIN_EMAIL ?? 'admin@cac.local',
      password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!',
    });
    expect(adminLogin.status).toBe(200);
    adminToken = adminLogin.body.accessToken;
    adminId = adminLogin.body.user.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [memberEmail, curatorEmail] } } });
    await prisma.$disconnect();
    redis.disconnect();
  });

  it('lists users for admin', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.some((u: { id: string }) => u.id === memberId)).toBe(true);
  });

  it('forbids curator from managing users', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${curatorToken}`);
    expect(res.status).toBe(403);
  });

  it('forbids org member from listing users', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(403);
  });

  it('updates role and name', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${memberId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Managed User Edited', role: 'CURADOR' });
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Managed User Edited');
    expect(res.body.user.role).toBe('CURADOR');
  });

  it('blocks admin from changing own role', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${adminId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'ORG_MEMBER' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('cannot_self_role');
  });

  it('disables a user and blocks login', async () => {
    const disable = await request(app)
      .post(`/api/admin/users/${memberId}/disable`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(disable.status).toBe(200);
    expect(disable.body.user.status).toBe('DISABLED');

    const login = await request(app).post('/api/auth/login').send({
      email: memberEmail,
      password,
    });
    expect(login.status).toBe(403);
    expect(login.body.error).toBe('account_disabled');
  });

  it('enables, resets password and allows login with the temporary one', async () => {
    const enable = await request(app)
      .post(`/api/admin/users/${memberId}/enable`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(enable.status).toBe(200);
    expect(enable.body.user.status).toBe('ACTIVE');

    const reset = await request(app)
      .post(`/api/admin/users/${memberId}/reset-password`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(reset.status).toBe(200);
    expect(reset.body.temporaryPassword).toMatch(/^Azc-/);

    const login = await request(app).post('/api/auth/login').send({
      email: memberEmail,
      password: reset.body.temporaryPassword,
    });
    expect(login.status).toBe(200);
  });

  it('blocks admin from deleting own account', async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${adminId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('cannot_self_delete');
  });

  it('deletes a user', async () => {
    const del = await request(app)
      .delete(`/api/admin/users/${memberId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(204);

    const gone = await prisma.user.findUnique({ where: { id: memberId } });
    expect(gone).toBeNull();
  });
});
