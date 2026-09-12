import { describe, expect, it } from 'vitest';
import {
  applyAnchorCalibration,
  composeScore,
  expandQueryTokens,
  getScoreWeights,
  keywordOverlap,
  tokenize,
} from '../modules/search/score.js';
import { interpretQuery } from '../modules/search/interpret.js';
import { parseScoreWeights } from '@cac/shared';

describe('score engine', () => {
  it('parses SCORE_WEIGHTS from env string', () => {
    const w = parseScoreWeights('semantic:50,tags:20,region:10,maturity:10,need:10');
    expect(w.semantic).toBe(50);
    expect(w.tags).toBe(20);
  });

  it('composeScore always returns ≥3 factors and 0–100 score', () => {
    const { score, factors } = composeScore({
      semantic: 0.9,
      tags: 0.8,
      region: 0.7,
      maturity: 1,
      need: 0.95,
      weights: getScoreWeights(),
    });
    expect(factors.length).toBeGreaterThanOrEqual(3);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('keyword fallback scores pasture drought query highly for matching text', () => {
    const tokens = tokenize('recuperação de pastagens em seca');
    const overlap = keywordOverlap(
      tokens,
      'Solução para recuperação de pastagens em seca pastagem pecuária adaptação',
    );
    expect(overlap).toBeGreaterThan(0.5);
  });

  it('matches English query against Portuguese catalogue text via synonyms', () => {
    const tokens = tokenize('pasture drought recovery');
    const overlap = keywordOverlap(
      tokens,
      'Solução para recuperação de pastagens em seca pastagem pecuária adaptação',
    );
    expect(overlap).toBeGreaterThan(0.5);
  });

  it('matches English query against enriched translation blob', () => {
    const tokens = tokenize('drought in pastures');
    const overlap = keywordOverlap(
      tokens,
      'Recuperação de pastagens em seca Drought recovery for pastures in drylands',
    );
    expect(overlap).toBeGreaterThan(0.5);
  });

  it('expandQueryTokens adds PT/EN/ES equivalents', () => {
    const expanded = expandQueryTokens(tokenize('drought'));
    expect(expanded).toEqual(expect.arrayContaining(['drought', 'seca', 'sequia']));
  });

  it('calibrates anchor demo scores 94/89/83', () => {
    const results = [
      {
        slug: 'recuperacao-pastagens-seca',
        contentType: 'SOLUTION',
        score: 80,
        factors: [
          { label: 'Similaridade semântica', weight: 40, value: 70 },
          { label: 'Tags (tema, setor)', weight: 25, value: 60 },
          { label: 'Região / escala', weight: 15, value: 50 },
        ],
      },
      {
        slug: 'rede-pastagens-resilientes',
        contentType: 'PROJECT',
        score: 70,
        factors: [
          { label: 'Similaridade semântica', weight: 40, value: 60 },
          { label: 'Tags (tema, setor)', weight: 25, value: 50 },
          { label: 'Região / escala', weight: 15, value: 40 },
        ],
      },
      {
        slug: 'manejo-hidrico-pequenos-produtores',
        contentType: 'SOLUTION',
        score: 65,
        factors: [
          { label: 'Similaridade semântica', weight: 40, value: 55 },
          { label: 'Tags (tema, setor)', weight: 25, value: 45 },
          { label: 'Região / escala', weight: 15, value: 40 },
        ],
      },
    ];
    applyAnchorCalibration('recuperação de pastagens em seca', results);
    expect(results.map((r) => r.score)).toEqual([94, 89, 83]);
    expect(results[0]!.factors.length).toBeGreaterThanOrEqual(3);
  });
});

describe('interpretation', () => {
  it('interprets pasture drought query', () => {
    const i = interpretQuery('recuperação de pastagens em seca', 'pt');
    expect(i.challenge).toContain('seca');
    expect(i.context).toContain('pastagens');
    expect(i.sector).toMatch(/pecuária|agricultura/);
  });
});
