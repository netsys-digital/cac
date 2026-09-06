import { env } from '../../config/env.js';
import { textHash } from '../../modules/search/score.js';

export type EmbeddingProvider = {
  readonly name: string;
  embed(text: string): Promise<number[]>;
};

/** Deterministic pseudo-embedding for offline / keyword fallback. */
export class KeywordFallbackProvider implements EmbeddingProvider {
  readonly name = 'keyword-fallback-v1';

  async embed(text: string): Promise<number[]> {
    const tokens = text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean);
    const dim = 64;
    const vec = new Array<number>(dim).fill(0);
    for (const token of tokens) {
      let h = 0;
      for (let i = 0; i < token.length; i += 1) h = (h * 31 + token.charCodeAt(i)) >>> 0;
      vec[h % dim] += 1;
      vec[(h >>> 8) % dim] += 0.5;
    }
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  }
}

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly name: string;
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {
    this.name = model;
  }

  async embed(text: string): Promise<number[]> {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: this.model, input: text }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`openai_embed_failed:${res.status}:${body.slice(0, 200)}`);
    }
    const data = (await res.json()) as { data: Array<{ embedding: number[] }> };
    return data.data[0]?.embedding ?? [];
  }
}

let cached: EmbeddingProvider | null = null;

export function getEmbeddingProvider(): EmbeddingProvider {
  if (cached) return cached;
  if (!env.offlineMode && env.embeddingProvider === 'openai' && env.openaiApiKey) {
    cached = new OpenAIEmbeddingProvider(env.openaiApiKey, env.embeddingModel);
  } else {
    cached = new KeywordFallbackProvider();
  }
  return cached;
}

export function hashEmbedText(text: string): string {
  return textHash(text);
}
