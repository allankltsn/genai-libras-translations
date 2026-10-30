import { describe, expect, it } from 'vitest';
import { translate } from '../translation/translate';
import {
  describeTranslation,
  formatGlosses,
  LISTENING_MESSAGE,
  MAX_GLOSSES_SHOWN,
  MIC_CONSENT_TEXT,
  MIC_OFF_MESSAGE,
  statusOnListening,
} from './messages';

describe('describeTranslation', () => {
  it('completa: nivel ok e lembrete de prototipo', () => {
    const m = describeTranslation(translate('oi'));
    expect(m.level).toBe('ok');
    expect(m.message).toContain('Protótipo');
  });
  it('letra sem sinal: aviso de NAO transmitida por inteiro e lista as letras', () => {
    const m = describeTranslation(translate('casa 123'));
    expect(m.level).toBe('warn');
    expect(m.message).toContain('NÃO foi transmitida por inteiro');
    expect(m.message).toContain('1, 2, 3');
  });
  it('truncamentos', () => {
    expect(describeTranslation(translate(`oi ${'x'.repeat(600)}`)).message).toContain('500 caracteres');
    const long = describeTranslation(translate(Array.from({ length: 130 }, () => 'oi').join(' ')));
    expect(long.message).toContain('Frase muito longa');
  });
  it('nenhum sinal', () => {
    const m = describeTranslation(translate('???'));
    expect(m.level).toBe('warn');
    expect(m.message).toContain('NÃO foi transmitida');
  });
});

describe('formatGlosses', () => {
  it('vazio e limite de exibicao', () => {
    expect(formatGlosses([])).toBe('—');
    const many = Array.from({ length: MAX_GLOSSES_SHOWN + 5 }, () => 'OI');
    expect(formatGlosses(many)).toContain('(+5)');
  });
});

describe('texto de consentimento do microfone', () => {
  it('nomeia o fornecedor, nega controle, nega gravacao e diz que digitar nao envia', () => {
    expect(MIC_CONSENT_TEXT).toContain('Google');
    expect(MIC_CONSENT_TEXT).toContain('não controla');
    expect(MIC_CONSENT_TEXT).toContain('não grava');
    expect(MIC_CONSENT_TEXT).toContain('digite');
    expect(MIC_CONSENT_TEXT).toContain('não é enviado');
  });
});

describe('statusOnListening (QA-017)', () => {
  it('ouvindo define a mensagem; ao parar, troca por microfone desligado', () => {
    expect(statusOnListening('', true)).toBe(LISTENING_MESSAGE);
    expect(statusOnListening(LISTENING_MESSAGE, false)).toBe(MIC_OFF_MESSAGE);
  });
  it('ao parar, nao apaga resultado ou erro que ja substituiu a mensagem', () => {
    expect(statusOnListening('Mostrando 2 sinal(is).', false)).toBeNull();
    expect(statusOnListening('Permissão do microfone negada.', false)).toBeNull();
  });
});

describe('gravidade do aviso de omissao (QA-021 / PRIV-013)', () => {
  it('so palavras de ligacao omitidas: nivel info, sem ATENCAO, lista visivel', () => {
    const t = translate('o banheiro de agua');
    expect(t.omittedWords).toEqual(['o', 'de']);
    expect(t.incomplete).toBe(false);
    const m = describeTranslation(t);
    expect(m.level).toBe('info');
    expect(m.message).not.toContain('ATENÇÃO');
    expect(m.message).not.toContain('NÃO foi transmitida');
    expect(m.message).toContain('Palavras de ligação não mostradas');
    expect(m.message).toContain('o, de');
  });
  it('perda de conteudo (letra sem sinal): aviso forte, e a lista de omitidas continua visivel', () => {
    const m = describeTranslation(translate('o casa 123'));
    expect(m.level).toBe('warn');
    expect(m.message).toContain('ATENÇÃO: a mensagem NÃO foi transmitida por inteiro');
    expect(m.message).toContain('Palavras de ligação não mostradas');
  });
  it('truncamento: aviso forte', () => {
    expect(describeTranslation(translate(`oi ${'x'.repeat(600)}`)).message).toContain('ATENÇÃO');
  });
  it('frase de vocabulario sem omissoes: ok e sem lista', () => {
    expect(translate('banheiro agua').incomplete).toBe(false);
    expect(translate('por favor').incomplete).toBe(false);
    const m = describeTranslation(translate('banheiro agua'));
    expect(m.level).toBe('ok');
    expect(m.message).not.toContain('Palavras de ligação');
  });
});

describe('nenhum sinal x glosas de soletracao (QA-023)', () => {
  it('soletracao so com letras sem sinal nao diz "Nenhum sinal encontrado"', () => {
    const t = translate('123');
    expect(t.signs.length).toBe(0);
    expect(t.glosses.length).toBeGreaterThan(0);
    const m = describeTranslation(t);
    expect(m.level).toBe('warn');
    expect(m.message).not.toContain('Nenhum sinal encontrado');
    expect(m.message).toContain('soletradas');
    expect(m.message).toContain('NÃO foi transmitida');
  });
  it('texto sem nenhuma palavra continua dizendo que nada foi encontrado', () => {
    expect(describeTranslation(translate('???')).message).toContain('Nenhum sinal encontrado');
  });
  it('so palavras de ligacao: nada encontrado e lista visivel', () => {
    const m = describeTranslation(translate('o de'));
    expect(m.message).toContain('Nenhum sinal encontrado');
    expect(m.message).toContain('o, de');
  });
});

import { GENERATED_LABEL } from './messages';
import { parseApiResponse } from '../translation/apiClient';

describe('sinais gerados por IA (rotulo e avisos)', () => {
  const resp = {
    apiVersion: '1',
    source: 'llm',
    warnings: ['generated_not_libras', 'incomplete'],
    incomplete: true,
    items: [
      {
        kind: 'generated',
        word: 'gato',
        sign: {
          id: 'GEN_GATO',
          duration: 1200,
          keyframes: [
            { time: 0.5, pose: { head: { x: 0.1, y: 0, z: 0 } } },
            { time: 1, pose: { head: { x: 0, y: 0, z: 0 } } },
          ],
        },
      },
    ],
  };
  it('nunca chama de traducao correta: rotulo + avisos da API na regiao de status', () => {
    const t = parseApiResponse(resp, { allowGenerated: true })?.translation;
    expect(t).toBeDefined();
    if (!t) return;
    const m = describeTranslation(t);
    expect(m.level).toBe('warn');
    expect(m.message).toContain(GENERATED_LABEL);
    expect(m.message).toContain('gato');
    expect(m.message).toContain('incompleta');
    expect(t.glosses[0]).toContain('gerado por IA');
  });
  it('texto de privacidade distingue modo local e IA', () => {
    expect(MIC_CONSENT_TEXT).toContain('modo local');
    expect(MIC_CONSENT_TEXT).toContain('Usar IA');
  });
});
