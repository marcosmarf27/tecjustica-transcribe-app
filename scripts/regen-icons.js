#!/usr/bin/env node
/**
 * Regenera ícones do app a partir de assets/tecjustica-icon-1024.png.
 * Usa sharp para converter e fazer resize em múltiplas resoluções.
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'assets', 'tecjustica-icon-1024.png');
const ASSETS = path.join(ROOT, 'assets');
const DOCS_ASSETS = path.join(ROOT, 'docs', 'assets');

const SIZES = [16, 32, 48, 64, 128, 256, 512, 1024];

(async () => {
  if (!fs.existsSync(SOURCE)) {
    console.error(`Source não encontrada: ${SOURCE}`);
    process.exit(1);
  }

  const meta = await sharp(SOURCE).metadata();
  console.log(`Source: ${meta.width}x${meta.height} (${meta.format})`);

  // PNG principal 1024 (substitui o antigo da Projurista)
  await sharp(SOURCE).png().toFile(path.join(ASSETS, 'icon-1024.png'));
  console.log(`  -> assets/icon-1024.png`);

  // Resoluções menores
  for (const size of SIZES) {
    if (size === 1024) continue;
    const out = path.join(ASSETS, `icon-${size}.png`);
    await sharp(SOURCE).resize(size, size, { kernel: 'lanczos3' }).png().toFile(out);
    console.log(`  -> assets/icon-${size}.png`);
  }

  // icon.png principal (electron-builder usa como fonte)
  await sharp(SOURCE).resize(512, 512, { kernel: 'lanczos3' }).png().toFile(path.join(ASSETS, 'icon.png'));
  console.log(`  -> assets/icon.png (512x512)`);

  // Cópia pro README
  await sharp(SOURCE).resize(256, 256, { kernel: 'lanczos3' }).png().toFile(path.join(DOCS_ASSETS, 'icon.png'));
  console.log(`  -> docs/assets/icon.png (256x256)`);

  console.log('Concluído.');
})().catch((e) => {
  console.error('Falha:', e.message);
  process.exit(1);
});
