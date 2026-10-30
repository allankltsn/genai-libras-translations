import { describe, expect, it } from 'vitest';
import { fingerspell } from './fingerspell';
import { gloss } from './glosser';
import { MAX_INPUT_CHARS, normalizeText, tokenize } from './normalize';
import { MAX_SIGNS_PER_PHRASE, translate } from './translate';

describe('normalize', () => {
  it('minusculas, sem acento e sem pontuacao', () => {
    expect(normalizeText('  Olá, ÁGUA!  Você?? ')).toBe('ola agua voce');
  });
  it('cedilha e til', () => {
    expect(normalizeText('Coração não')).toBe('coracao nao');
  });
  it('vazio e so pontuacao', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize('?!...')).toEqual([]);
  });
  it('limita o tamanho da entrada', () => {
    expect(normalizeText('a'.repeat(MAX_INPUT_CHARS * 3)).length).toBe(MAX_INPUT_CHARS);
  });
});

describe('glosser', () => {
  it('remove artigos/preposicoes/verbos de ligacao', () => {
    expect(gloss(tokenize('o banheiro e a agua'))).toEqual([
      { kind: 'sign', signId: 'BANHEIRO', source: 'banheiro' },
      { kind: 'sign', signId: 'AGUA', source: 'agua' },
    ]);
  });
  it('casa frases antes de remover palavras funcionais', () => {
    const g = gloss(tokenize('Por favor, tudo bem?'));
    expect(g.map((x) => (x.kind === 'sign' ? x.signId : x.word))).toEqual(['POR_FAVOR', 'TUDO_BEM']);
  });
  it('lematiza por tabela', () => {
    const g = gloss(tokenize('obrigada, eu comi'));
    expect(g[0]).toMatchObject({ kind: 'sign', signId: 'OBRIGADO' });
    expect(g[2]).toMatchObject({ kind: 'sign', signId: 'COMER' });
  });
  it('palavra desconhecida vira datilologia', () => {
    expect(gloss(['xyz'])).toEqual([{ kind: 'fingerspell', word: 'xyz' }]);
  });
});

describe('fingerspell', () => {
  it('usa letras existentes e marca o resto como sem sinal', () => {
    const r = fingerspell('ala');
    expect(r.signs.map((s) => s.id)).toEqual(['SOLETRA_A', 'SOLETRA_L', 'SOLETRA_A']);
    expect(r.missing).toEqual([]);
    const r2 = fingerspell('bay');
    expect(r2.signs.map((s) => s.id)).toEqual(['SOLETRA_B', 'SOLETRA_A', 'SOLETRA_Y']);
    expect(r2.missing).toEqual([]);
    expect(fingerspell('a1b').missing).toEqual(['1']);
  });
});

describe('translate', () => {
  it('oi + soletracao', () => {
    const t = translate('Oi lala');
    expect(t.signs.map((s) => s.id)).toEqual(['OI', 'SOLETRA_L', 'SOLETRA_A', 'SOLETRA_L', 'SOLETRA_A']);
    expect(t.glosses).toEqual(['OI', 'soletrar: LALA']);
  });
  it('reporta letras sem sinal e limita o tamanho', () => {
    expect(translate('bola').missingLetters).toEqual([]);
    expect(translate('casa 123').missingLetters).toEqual(['1', '2', '3']);
    const t = translate(Array.from({ length: 200 }, () => 'oi').join(' '));
    expect(t.signs.length).toBe(MAX_SIGNS_PER_PHRASE);
    expect(t.truncated).toBe(true);
  });
  it('QA-004: letra sem sinal e parcial e incompleta; vocabulario puro e completo', () => {
    expect(translate('casa').incomplete).toBe(false);
    const partial = translate('a1b');
    expect(partial.glosses).toEqual(['soletrar (parcial): A1B']);
    expect(partial.incomplete).toBe(true);
    expect(translate('oi').incomplete).toBe(false);
    expect(translate('ala').incomplete).toBe(false);
  });
  it('QA-008: texto acima de 500 caracteres e sinalizado', () => {
    const t = translate(`oi ${'x'.repeat(600)}`);
    expect(t.inputTruncated).toBe(true);
    expect(t.incomplete).toBe(true);
    expect(translate('oi').inputTruncated).toBe(false);
  });
  it('QA-004: palavra soletrada longa e abreviada na glosa', () => {
    const t = translate('a'.repeat(40) + 'b');
    expect(t.glosses[0]?.length).toBeLessThan(60);
  });
  it('QA-006: comida e favor isolado nao viram sinais de outro sentido', () => {
    expect(translate('comida').signs.map((s) => s.id)).not.toContain('COMER');
    expect(translate('um favor').signs.map((s) => s.id)).not.toContain('POR_FAVOR');
    expect(translate('por favor').signs.map((s) => s.id)).toEqual(['POR_FAVOR']);
  });
  it('QA-007: letras latinas sem decomposicao nao fragmentam a palavra', () => {
    expect(normalizeText('Søren Æon straße')).toBe('soren aeon strasse');
  });
  it('120 sinais exatos nao sao truncados; 121 sao', () => {
    expect(translate(Array.from({ length: MAX_SIGNS_PER_PHRASE }, () => 'oi').join(' ')).truncated).toBe(false);
    expect(translate(Array.from({ length: MAX_SIGNS_PER_PHRASE + 1 }, () => 'oi').join(' ')).truncated).toBe(true);
  });
  it('entrada vazia', () => {
    expect(translate('').signs).toEqual([]);
  });
});

describe('glosser: palavras omitidas (PRIV-011)', () => {
  it('glossWithOmitted informa o que foi descartado', async () => {
    const { glossWithOmitted } = await import('./glosser');
    const r = glossWithOmitted(tokenize('o banheiro e a agua'));
    expect(r.omitted).toEqual(['o', 'e', 'a']);
    expect(r.items.length).toBe(2);
  });
});

import { ALL_BONES } from '../signs/poseHelpers';
import { LETTER_SIGNS, LETTER_DURATION_MS } from '../signs/letters';
import { SIGNS } from '../signs/dictionary';

describe('datilologia A-Z completa', () => {
  const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');
  it('as 26 letras tem pose, ids SOLETRA_* e nunca entram em SIGNS', () => {
    for (const ch of ALPHABET) {
      const s = LETTER_SIGNS.get(ch);
      expect(s, ch).toBeDefined();
      expect(s?.id).toBe(`SOLETRA_${ch.toUpperCase()}`);
      expect(SIGNS.has(s?.id ?? ''), ch).toBe(false);
      expect(s?.duration).toBe(LETTER_DURATION_MS);
      expect(s?.keyframes.length).toBeGreaterThan(1);
    }
    expect(LETTER_SIGNS.size).toBe(26);
  });
  it('ossos citados existem no conjunto VRM e tempos sao crescentes em [0,1]', () => {
    const known = new Set<string>(ALL_BONES);
    for (const s of LETTER_SIGNS.values()) {
      let prev = -1;
      for (const kf of s.keyframes) {
        expect(kf.time).toBeGreaterThan(prev);
        expect(kf.time).toBeLessThanOrEqual(1);
        prev = kf.time;
        for (const [bone, o] of Object.entries(kf.pose)) {
          expect(known.has(bone), `${s.id}: ${bone}`).toBe(true);
          expect([o.x, o.y, o.z].every(Number.isFinite)).toBe(true);
        }
      }
    }
  });
  it('as letras tem poses distintas entre si (exceto equivalentes documentados)', () => {
    const sig = (ch: string) => JSON.stringify(LETTER_SIGNS.get(ch)?.keyframes[0]?.pose);
    expect(sig('b')).not.toBe(sig('a'));
    expect(sig('m')).not.toBe(sig('n'));
    expect(sig('u')).not.toBe(sig('v')); // v tem abertura entre dedos
  });
  it('soletrar A-Z, com acentos e cedilha, nao gera letras sem sinal', () => {
    for (const w of ['abcdefghijklmnopqrstuvwxyz', 'Ação', 'ÇÃO', 'àéíóú', 'pão', 'você']) {
      const t = translate(w);
      expect(t.missingLetters, w).toEqual([]);
      expect(t.incomplete, w).toBe(false);
    }
    expect(translate('a b c').signs.length).toBe(2); // 'a' e artigo (omitido); b e c soletradas
  });
});
