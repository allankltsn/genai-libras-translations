import { describe, expect, it } from 'vitest';
import { BLOCKED_URL, filterUrl } from './urlPolicy';

const base = 'http://localhost:5173/';
const origin = 'http://localhost:5173';

describe('filterUrl', () => {
  it('permite mesma origem, relativas, data: e blob:', () => {
    expect(filterUrl('/models/a.fbx', base, origin)).toBe('/models/a.fbx');
    expect(filterUrl('tex.png', base, origin)).toBe('tex.png');
    expect(filterUrl('data:image/png;base64,AA', base, origin)).toContain('data:');
    expect(filterUrl('blob:http://localhost:5173/x', base, origin)).toContain('blob:');
  });
  it('bloqueia origem externa e esquemas estranhos', () => {
    expect(filterUrl('https://cdn.example.com/a.png', base, origin)).toBe(BLOCKED_URL);
    expect(filterUrl('//evil.example/a.png', base, origin)).toBe(BLOCKED_URL);
    expect(filterUrl('file:///C:/a.png', base, origin)).toBe(BLOCKED_URL);
  });
});

import { createVrmLoader } from './loadAvatar';

describe('loader do VRM (condicao 3)', () => {
  it('o GLTFLoader usa o LoadingManager com a urlPolicy: URI externa vira BLOCKED_URL', () => {
    const loader = createVrmLoader('http://localhost:5173/', 'http://localhost:5173');
    const m = loader.manager;
    expect(m.resolveURL('https://cdn.example.com/tex.png')).toBe(BLOCKED_URL);
    expect(m.resolveURL('http://evil.example/buf.bin')).toBe(BLOCKED_URL);
    expect(m.resolveURL('/models/Seed-san.vrm')).toBe('/models/Seed-san.vrm');
    expect(m.resolveURL('blob:http://localhost:5173/abc')).toContain('blob:');
  });
});
