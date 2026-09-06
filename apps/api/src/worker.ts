import { processEmbeddingJob } from './lib/embeddings/indexer.js';
import { processConnectionLifecycle } from './modules/connections/connections.service.js';
import { dequeueEmail, processEmailJob } from './lib/queue/email-queue.js';
import { dequeueEmbedding } from './lib/queue/embedding-queue.js';
import { redis } from './lib/redis.js';

async function embeddingLoop() {
  for (;;) {
    try {
      const job = await dequeueEmbedding(2);
      if (!job) continue;
      await processEmbeddingJob(job);
      console.log(`[worker] indexed ${job.entityType}:${job.entityId}`);
    } catch (error) {
      console.warn('[worker] embedding job failed', error);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

async function emailLoop() {
  for (;;) {
    try {
      const job = await dequeueEmail(2);
      if (!job) continue;
      await processEmailJob(job);
      console.log('[worker] email sent');
    } catch (error) {
      console.warn('[worker] email job failed', error);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

async function main() {
  try {
    await redis.connect();
  } catch (error) {
    console.warn('[worker] redis connect deferred:', error);
  }

  console.log('[worker] queues: embedding:index + email:send + connection lifecycle');
  void embeddingLoop();
  void emailLoop();

  setInterval(() => {
    void processConnectionLifecycle()
      .then((r) => {
        if (r.expired || r.reminded) {
          console.log(`[worker] lifecycle expired=${r.expired} reminded=${r.reminded}`);
        }
      })
      .catch((error) => console.warn('[worker] lifecycle failed', error));
  }, 60_000);

  setInterval(async () => {
    try {
      if (redis.status !== 'ready') await redis.connect();
      await redis.ping();
    } catch (error) {
      console.warn('[worker] redis ping failed', error);
    }
  }, 30_000);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
