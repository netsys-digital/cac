import { ContentStatus } from '@cac/shared';
import { getEmbeddingProvider, hashEmbedText } from '../embeddings/provider.js';
import { prisma } from '../prisma.js';
import type { EmbeddingJob } from '../queue/embedding-queue.js';

export async function processEmbeddingJob(job: EmbeddingJob): Promise<void> {
  const provider = getEmbeddingProvider();

  if (job.entityType === 'technology') {
    const tech = await prisma.technology.findUnique({
      where: { id: job.entityId },
      include: { tags: true },
    });
    if (!tech || tech.status !== ContentStatus.PUBLISHED) return;
    const text = `${tech.title}\n${tech.summary}\n${tech.problemStatement}\n${tech.howItWorks}\n${tech.tags.map((t) => t.tag).join(' ')}`;
    const vector = await provider.embed(text);
    const hash = hashEmbedText(text);
    await prisma.technologyEmbedding.upsert({
      where: { technologyId: tech.id },
      create: { technologyId: tech.id, model: provider.name, vector, textHash: hash },
      update: { model: provider.name, vector, textHash: hash },
    });
    return;
  }

  if (job.entityType === 'challenge') {
    const challenge = await prisma.challenge.findUnique({
      where: { id: job.entityId },
      include: { tags: true },
    });
    if (!challenge || challenge.status !== ContentStatus.PUBLISHED) return;
    const text = `${challenge.title}\n${challenge.summary}\n${challenge.context ?? ''}\n${challenge.tags.map((t) => t.tag).join(' ')}`;
    const vector = await provider.embed(text);
    const hash = hashEmbedText(text);
    await prisma.challengeEmbedding.upsert({
      where: { challengeId: challenge.id },
      create: { challengeId: challenge.id, model: provider.name, vector, textHash: hash },
      update: { model: provider.name, vector, textHash: hash },
    });
    return;
  }

  if (job.entityType === 'project') {
    const project = await prisma.project.findUnique({ where: { id: job.entityId } });
    if (!project || project.status !== ContentStatus.PUBLISHED) return;
    const text = `${project.title}\n${project.summary}\n${project.type}`;
    const vector = await provider.embed(text);
    const hash = hashEmbedText(text);
    await prisma.projectEmbedding.upsert({
      where: { projectId: project.id },
      create: { projectId: project.id, model: provider.name, vector, textHash: hash },
      update: { model: provider.name, vector, textHash: hash },
    });
  }
}

/** Index all published catalogue items (seed / offline bootstrap). */
export async function reindexAllPublished(): Promise<number> {
  const [techs, challenges, projects] = await Promise.all([
    prisma.technology.findMany({ where: { status: ContentStatus.PUBLISHED }, select: { id: true } }),
    prisma.challenge.findMany({ where: { status: ContentStatus.PUBLISHED }, select: { id: true } }),
    prisma.project.findMany({ where: { status: ContentStatus.PUBLISHED }, select: { id: true } }),
  ]);
  let n = 0;
  for (const t of techs) {
    await processEmbeddingJob({ entityType: 'technology', entityId: t.id });
    n += 1;
  }
  for (const c of challenges) {
    await processEmbeddingJob({ entityType: 'challenge', entityId: c.id });
    n += 1;
  }
  for (const p of projects) {
    await processEmbeddingJob({ entityType: 'project', entityId: p.id });
    n += 1;
  }
  return n;
}
