// Aviso pos-build (sem dependencias): dist/ contem o modelo .vrm copiado de public/.
// Publicar dist/ e REDISTRIBUIR o Seed-san (VRM Public License 1.0: permitido com credito,
// mas o usuario ainda nao decidiu publicar). Nao falha o build; so avisa.
import { existsSync, readdirSync } from 'node:fs';

const dir = new URL('../dist/models/', import.meta.url);
const vrms = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.vrm')) : [];
if (vrms.length > 0) {
  process.stdout.write(
    `\n[AVISO] dist/models/ contem ${vrms.join(', ')}. Publicar dist/ e REDISTRIBUIR o modelo (Seed-san, VRM Public License 1.0: ` +
      'permitido com credito, mas a publicacao ainda nao foi decidida). Veja README.md e docs/licencas.md.\n\n',
  );
}
