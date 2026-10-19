import { describe, expect, it } from 'vitest';
import { preserveSourceUrls, shieldUrls, unshieldUrls } from './preserve-urls.js';

const SOURCE = `**Android:**
[https://play.google.com/store/apps/details?id=embrapa.br.zonamento&hl=pt_BR](https://play.google.com/store/apps/details?id=embrapa.br.zonamento&hl=pt_BR)

**Apple:**
[https://apps.apple.com/br/app/plantio-certo/id1518252333](https://apps.apple.com/br/app/plantio-certo/id1518252333)

Página da solução: [Embrapa](https://www.embrapa.br/solucoes/aplicativo-zarc---plantio-certo)`;

const BROKEN = `**Android:**
[https://play.google.com/store/apps/details?
id=embrapa.br.zoning&hl=en BR](https://play.google.com/store/apps/details?
id=embrapa.br.zoning&hl=en BR)

**Apple:**
https://apps.apple.com/br/app/plantio-
right/id1518252333

Solution page: [Embrapa](https://www.embrapa.br/solucos-technological
search/aplicativo-zarc---plantio-right)`;

describe('preserve urls across translation', () => {
  it('hides urls from the translator and puts them back', () => {
    const shielded = shieldUrls(SOURCE);
    expect(shielded.text).not.toContain('play.google.com');
    expect(shielded.text).toContain('[Embrapa]({{ph2}})');
    const restored = unshieldUrls(shielded.text.replace('Página da solução', 'Solution page'), shielded.slots);
    expect(restored).toContain('https://play.google.com/store/apps/details?id=embrapa.br.zonamento&hl=pt_BR');
    expect(restored).toContain('plantio-certo/id1518252333');
    expect(restored).toContain('Solution page');
  });

  it('repairs links already stored with a translated url', () => {
    const fixed = preserveSourceUrls(SOURCE, BROKEN);
    expect(fixed).toContain('id=embrapa.br.zonamento&hl=pt_BR');
    expect(fixed).toContain('plantio-certo/id1518252333');
    expect(fixed).toContain('https://www.embrapa.br/solucoes/aplicativo-zarc---plantio-certo');
    expect(fixed).not.toContain('plantio-right');
    expect(fixed).not.toContain('zoning');
    expect(fixed).toContain('Solution page');
  });
});
