import { createApp } from './app.js';
import { env } from './config/env.js';
import { redis } from './lib/redis.js';

async function main() {
  try {
    await redis.connect();
  } catch (error) {
    console.warn('[api] redis connect deferred:', error);
  }

  const app = createApp();
  app.listen(env.apiPort, () => {
    console.log(`[api] listening on :${env.apiPort}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
