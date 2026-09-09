#!/usr/bin/env node
/**
 * Substitui tamanhos de fonte ad-hoc por text-grande|media|pequena|mini
 * em apps/www, apps/web e packages/ui.
 *
 * Mapeamento (alinhado ao protótipo):
 *   mini    ← 10px / 0.6–0.65rem          (labels, badges, meta)
 *   pequena ← 11–12px / 0.7–0.85rem       (corpo, botões, suporte)
 *   media   ← 13–16px / 0.9–1.05rem       (títulos de card/seção, nav)
 *   grande  ← ≥18px / ≥1.25rem            (títulos de página / hero)
 */
import fs from 'node:fs';
import path from 'node:path';

const roots = ['apps/www/src', 'apps/web/src', 'packages/ui/src'];

const rules = [
  // rem display / titles
  { re: /(\b(?:sm|md|lg|xl|2xl):)?text-\[(?:2\.25|2\.15|2|1\.85|1\.75|1\.5|1\.35)rem\]/g, token: 'text-grande' },
  { re: /(\b(?:sm|md|lg|xl|2xl):)?text-\[(?:1\.05|1|0\.95|0\.9)rem\]/g, token: 'text-media' },
  { re: /(\b(?:sm|md|lg|xl|2xl):)?text-\[(?:0\.85|0\.8|0\.75|0\.7)rem\]/g, token: 'text-pequena' },
  { re: /(\b(?:sm|md|lg|xl|2xl):)?text-\[(?:0\.65|0\.6)rem\]/g, token: 'text-mini' },

  // px
  { re: /(\b(?:sm|md|lg|xl|2xl):)?text-\[(?:55|38|34|32|30|28|24|22|18)px\]/g, token: 'text-grande' },
  { re: /(\b(?:sm|md|lg|xl|2xl):)?text-\[(?:16|15|14|13)px\]/g, token: 'text-media' },
  { re: /(\b(?:sm|md|lg|xl|2xl):)?text-\[(?:12|11)px\]/g, token: 'text-pequena' },
  { re: /(\b(?:sm|md|lg|xl|2xl):)?text-\[10px\]/g, token: 'text-mini' },

  // Tailwind scale (somente tokens de tamanho)
  { re: /(\b(?:sm|md|lg|xl|2xl):)?text-(?:4xl|3xl|2xl|xl|lg)\b/g, token: 'text-grande' },
  { re: /(\b(?:sm|md|lg|xl|2xl):)?text-base\b/g, token: 'text-media' },
  { re: /(\b(?:sm|md|lg|xl|2xl):)?text-sm\b/g, token: 'text-media' },
  { re: /(\b(?:sm|md|lg|xl|2xl):)?text-xs\b/g, token: 'text-pequena' },
];

const cleanups = [
  /\btext-grande\s+((?:sm|md|lg|xl|2xl):text-grande\s*)+/g,
  /\btext-media\s+((?:sm|md|lg|xl|2xl):text-media\s*)+/g,
  /\btext-pequena\s+((?:sm|md|lg|xl|2xl):text-pequena\s*)+/g,
  /\btext-mini\s+((?:sm|md|lg|xl|2xl):text-mini\s*)+/g,
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(tsx|ts|jsx|js)$/.test(name)) out.push(full);
  }
  return out;
}

let changedFiles = 0;
let totalHits = 0;

for (const root of roots) {
  for (const file of walk(root)) {
    if (file.endsWith(`${path.sep}typography.ts`)) continue;

    let src = fs.readFileSync(file, 'utf8');
    const before = src;
    let hits = 0;

    for (const { re, token } of rules) {
      src = src.replace(re, (_match, prefix = '') => {
        hits += 1;
        return `${prefix}${token}`;
      });
    }

    for (const re of cleanups) {
      src = src.replace(re, (match) => {
        if (match.includes('grande')) return 'text-grande ';
        if (match.includes('media')) return 'text-media ';
        if (match.includes('pequena')) return 'text-pequena ';
        return 'text-mini ';
      });
    }

    if (src !== before) {
      fs.writeFileSync(file, src);
      changedFiles += 1;
      totalHits += hits;
      console.log(`updated ${file} (${hits})`);
    }
  }
}

console.log(`\nDone: ${changedFiles} files, ~${totalHits} replacements`);
