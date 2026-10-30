import { describe, expect, it } from 'vitest';
import { DraftKeeper } from './draft';

describe('DraftKeeper (PRIV-010)', () => {
  it('guarda o rascunho sobrescrito e permite desfazer uma vez', () => {
    const d = new DraftKeeper();
    expect(d.replace('meu rascunho', 'texto falado')).toBe('texto falado');
    expect(d.canUndo).toBe(true);
    expect(d.undo()).toBe('meu rascunho');
    expect(d.canUndo).toBe(false);
    expect(d.undo()).toBeNull();
  });
  it('campo vazio ou igual nao gera desfazer', () => {
    const d = new DraftKeeper();
    d.replace('   ', 'falado');
    expect(d.canUndo).toBe(false);
    d.replace('igual', 'igual');
    expect(d.canUndo).toBe(false);
  });
  it('edicao ou envio descarta o desfazer', () => {
    const d = new DraftKeeper();
    d.replace('a', 'b');
    d.discard();
    expect(d.canUndo).toBe(false);
  });
  it('falas encadeadas nao substituem o rascunho digitado (REV-011)', () => {
    const d = new DraftKeeper();
    let field = 'meu rascunho';
    field = d.replace(field, 'fala 1');
    field = d.replace(field, 'fala 2');
    field = d.replace(field, 'fala 3');
    expect(field).toBe('fala 3');
    expect(d.undo()).toBe('meu rascunho');
  });
  it('fala igual ao campo atual nao perde o desfazer encadeado', () => {
    const d = new DraftKeeper();
    let field = d.replace('digitado', 'fala');
    field = d.replace(field, 'fala');
    expect(field).toBe('fala');
    expect(d.undo()).toBe('digitado');
  });
  it('depois de editar ou desfazer, o novo texto digitado volta a ser preservado', () => {
    const d = new DraftKeeper();
    d.replace('um', 'fala');
    d.discard(); // usuario editou o campo
    d.replace('dois digitado', 'outra fala');
    expect(d.undo()).toBe('dois digitado');
    d.replace('tres', 'x');
    d.undo();
    d.replace('quatro', 'y');
    expect(d.undo()).toBe('quatro');
  });
  it('campo vazio + falas encadeadas: nada a restaurar', () => {
    const d = new DraftKeeper();
    d.replace('', 'f1');
    d.replace('f1', 'f2');
    expect(d.canUndo).toBe(false);
  });
});
