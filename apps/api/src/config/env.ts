import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../../');
dotenv.config({ path: path.join(repoRoot, '.env') });
dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  apiPort: Number(process.env.API_PORT ?? 3003),
  databaseUrl: required('DATABASE_URL', 'postgresql://cac:cac_secret@localhost:5433/cac'),
  redisUrl: required('REDIS_URL', 'redis://localhost:6381'),
  jwtSecret: required('JWT_SECRET', 'dev-access-secret-change-me-min-32-chars'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me-min-32'),
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:5178,http://localhost:5179')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  cookieDomain: process.env.COOKIE_DOMAIN ?? 'localhost',
  brandName: process.env.APP_BRAND_NAME ?? 'Climate Action Connect',
  brandShort: process.env.APP_BRAND_SHORT ?? 'CAC',
  brandLogo: process.env.APP_BRAND_LOGO ?? '/assets/brand/logo.svg',
  matchMinScore: Number(process.env.MATCH_MIN_SCORE ?? 5),
  scoreWeights: process.env.SCORE_WEIGHTS ?? 'semantic:40,tags:25,region:15,maturity:10,need:10',
  offlineMode: (process.env.OFFLINE_MODE ?? 'false').toLowerCase() === 'true',
  embeddingProvider: process.env.EMBEDDING_PROVIDER ?? 'openai',
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  embeddingModel: process.env.EMBEDDING_MODEL ?? 'text-embedding-3-small',
  connectionExpiryDays: Number(process.env.CONNECTION_EXPIRY_DAYS ?? 15),
  smtpHost: process.env.SMTP_HOST ?? '',
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPass: process.env.SMTP_PASS ?? '',
  smtpFrom: process.env.SMTP_FROM_EMAIL ?? 'noreply@climateactionconnect.org',
};

export const REFRESH_COOKIE = 'cac_refresh';
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
