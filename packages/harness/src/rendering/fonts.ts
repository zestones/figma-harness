'use strict';

import { bundledFamilies, bundledFontFile } from '../core/bundled-fonts.ts';
import { woffToSfnt } from '../core/woff.ts';

const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

interface BundledFontFile {
  readonly family: string;
  readonly file: string;
  readonly weight: number;
}

const fontFiles = (): BundledFontFile[] => Object.entries(bundledFamilies()).flatMap(([family, bundled]) =>
  bundled.weights.map((weight) => ({ family, weight, file: bundledFontFile(family, weight, 'latin', 'woff') })));

/* Fontconfig's weight scale and style names, by CSS weight. */
const FONTCONFIG_WEIGHTS: Readonly<Record<number, readonly [weight: number, style: string]>> = Object.freeze({
  100: [0, 'Thin'], 200: [40, 'ExtraLight'], 300: [50, 'Light'], 400: [80, 'Regular'], 500: [100, 'Medium'],
  600: [180, 'SemiBold'], 700: [200, 'Bold'], 800: [205, 'ExtraBold'], 900: [210, 'Black'],
});

function xml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function matchedFontFamily(family: string): string {
  return childProcess.execFileSync(
    'fc-match',
    ['--format=%{family}', family],
    { encoding: 'utf8', env: process.env },
  ).trim().split(',')[0];
}

export function assertFontFamilies(families: Iterable<string>): void {
  for (const family of families) {
    const matched = matchedFontFamily(family);
    if (matched !== family) {
      throw new Error(family + ' resolved to ' + (matched || 'nothing') + '; bundled font setup failed');
    }
  }
}

export function useBundledFonts() {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'figma-harness-fontconfig-'));
  const fontDirectory = path.join(temporaryRoot, 'fonts');
  const cacheDirectory = path.join(temporaryRoot, 'cache');
  fs.mkdirSync(fontDirectory);
  fs.mkdirSync(cacheDirectory);

  const declarations: string[] = [];
  try {
    for (const font of fontFiles()) {
      if (!fs.existsSync(font.file)) throw new Error('bundled font is missing: ' + font.file + '; run pnpm install');
      // The renderer's font stack reads neither WOFF nor WOFF2, so each file is unwrapped.
      const unwrapped = woffToSfnt(font.file);
      const target = path.join(fontDirectory, path.basename(font.file, '.woff') + unwrapped.extension);
      fs.writeFileSync(target, unwrapped.data);
      // A single-weight file may call itself "<Family> SemiBold"; declare it as the family at its weight.
      const [weight, style] = FONTCONFIG_WEIGHTS[font.weight] || [80, 'Regular'];
      declarations.push(
        '  <match target="scan">',
        '    <test name="file"><string>' + xml(target) + '</string></test>',
        '    <edit name="family" mode="assign_replace"><string>' + xml(font.family) + '</string></edit>',
        '    <edit name="style" mode="assign_replace"><string>' + style + '</string></edit>',
        '    <edit name="weight" mode="assign_replace"><int>' + weight + '</int></edit>',
        '  </match>',
      );
    }
  } catch (error) {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
    throw error;
  }

  const configFile = path.join(temporaryRoot, 'fonts.conf');
  fs.writeFileSync(configFile, [
    '<?xml version="1.0"?>',
    '<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">',
    '<fontconfig>',
    // The first cache directory is the one fontconfig writes, so the scan stays in the temporary folder.
    '  <cachedir>' + xml(cacheDirectory) + '</cachedir>',
    '  <include ignore_missing="yes">/etc/fonts/fonts.conf</include>',
    '  <dir>' + xml(fontDirectory) + '</dir>',
    ...declarations,
    '</fontconfig>',
    '',
  ].join('\n'));

  const previous = { FONTCONFIG_FILE: process.env['FONTCONFIG_FILE'], FC_LANG: process.env['FC_LANG'] };
  process.env['FONTCONFIG_FILE'] = configFile;
  // The bundled files hold the Latin subset only. Under a default language they
  // do not fully cover, French for one, fontconfig would prefer an installed
  // font, even of another family.
  process.env['FC_LANG'] = 'en';
  let cleaned = false;
  return {
    cleanup() {
      if (cleaned) return;
      cleaned = true;
      for (const [name, value] of Object.entries(previous)) {
        if (value == null) delete process.env[name];
        else process.env[name] = value;
      }
      fs.rmSync(temporaryRoot, { recursive: true, force: true });
    },
  };
}
