import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';

const app = createApp();
const email = `e0-${Date.now()}@example.com`;
const password = 'password123';

describe('auth + health', () => {
  beforeAll(async () => {
    try {
      await redis.connect();
    } catch {
      // ready endpoint may still report not_ready if redis is down
    }
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
    redis.disconnect();
  });

  it('GET /health returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('register → login → me', async () => {
    const register = await request(app).post('/api/auth/register').send({
      email,
      password,
      name: 'E0 Tester',
    });
    expect(register.status).toBe(201);
    expect(register.body.accessToken).toBeTruthy();
    expect(register.body.user.email).toBe(email);

    const login = await request(app).post('/api/auth/login').send({ email, password });
    expect(login.status).toBe(200);
    expect(login.headers['set-cookie']).toBeTruthy();

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(email);
  });

  it('refresh cookie rotates access token', async () => {
    const login = await request(app).post('/api/auth/login').send({ email, password });
    const cookies = login.headers['set-cookie'];
    expect(cookies).toBeTruthy();

    const refresh = await request(app).post('/api/auth/refresh').set('Cookie', cookies);
    expect(refresh.status).toBe(200);
    expect(refresh.body.accessToken).toBeTruthy();
  });
});
