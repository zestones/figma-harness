/* Rasterise the rendered SVGs so a design can be LOOKED AT, not just measured. */
'use strict';
const fs = require('node:fs') as typeof import('node:fs');
const path = require('node:path') as typeof import('node:path');
const {
  assertFontFamilies,
  useBundledFonts,
} = require('./fonts.ts') as typeof import('./fonts.ts');
const dir = process.argv[2] || path.join(__dirname, '..', '..', 'renders');
const scale = Number(process.argv[3] || 0.62);

const fontEnvironment = useBundledFonts();
const sharp = require('sharp') as typeof import('sharp').default;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function rasterize(): Promise<void> {
  const files = fs.readdirSync(dir).filter((filename: string) => filename.endsWith('.svg'));
  const families = new Set<string>();
  for (const f of files) {
    const m = String(fs.readFileSync(path.join(dir, f))).match(/font-family="([^",]+)/g) || [];
    for (const x of m) families.add(x.replace('font-family="', ''));
  }
  assertFontFamilies(families);
  console.log('  fonts  ' + [...families].join(', ') + ' (bundled, exact)');
  for (const f of files) {
    const svg = fs.readFileSync(path.join(dir, f));
    const out = path.join(dir, f.replace(/\.svg$/, '.png'));
    // The source width comes from the SVG, not from a hardcoded frame size:
    // resizing a 1280 sheet as if it were 1600 crops its right edge, which
    // looks exactly like a layout bug that does not exist.
    const srcW = Number((String(svg).match(/width="(\d+)"/) || [0, 1600])[1]);
    await sharp(Buffer.from(svg), { density: Math.round(72 * scale * 2) })
      .resize(Math.round(srcW * scale))
      .png({ compressionLevel: 9 })
      .toFile(out);
    console.log('  ' + path.basename(out));
  }
}

rasterize().finally(() => {
  fontEnvironment.cleanup();
}).catch((error: unknown) => {
  console.error(errorMessage(error));
  process.exit(1);
});
