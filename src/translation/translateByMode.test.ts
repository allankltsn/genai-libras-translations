import { describe, expect, it, vi } from 'vitest';
import type { ApiResult } from './apiClient';
import { translate } from './translate';
import { translateByMode } from './translateByMode';

describe('translateByMode', () => {
  it('IA desligada: nao chama a API (nada e enviado)', async () => {
    const api = vi.fn<() => Promise<ApiResult>>();
    const r = await translateByMode('oi', { useAi: false, allowGenerated: true }, undefined, api);
    expect(api).not.toHaveBeenCalled();
    expect(r.mode).toBe('local');
    expect(r.translation.signs.map((s) => s.id)).toEqual(['OI']);
  });
  it('IA ligada e API ok: usa o resultado da API', async () => {
    const t = translate('banheiro');
    const api = vi.fn<(t: string, o: { allowGenerated: boolean }) => Promise<ApiResult>>().mockResolvedValue({ ok: true, translation: t, source: 'llm' });
    const r = await translateByMode('oi', { useAi: true, allowGenerated: false }, undefined, api);
    expect(api).toHaveBeenCalledWith('oi', { allowGenerated: false }, undefined);
    expect(r.mode).toBe('ia');
    expect(r.translation).toBe(t);
  });
  for (const reason of ['timeout', 'network', 'http', 'invalid'] as const) {
    it(`API falha (${reason}): fallback local com modo fallback`, async () => {
      const r = await translateByMode('oi', { useAi: true, allowGenerated: false }, undefined, () => Promise.resolve({ ok: false, reason }));
      expect(r.mode).toBe('fallback');
      expect(r.translation.signs.map((s) => s.id)).toEqual(['OI']);
      expect(r.translation.generatedWords).toEqual([]);
    });
  }
});
