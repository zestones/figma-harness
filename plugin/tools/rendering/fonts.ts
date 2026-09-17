'use strict';

import { BUNDLED_FAMILIES, bundledFontFile } from '../core/bundled-fonts.ts';

const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const FONT_FILES: readonly string[] = Object.entries(BUNDLED_FAMILIES).flatMap(([family, bundled]) =>
  bundled.weights.map((weight) => bundledFontFile(family, weight, 'latin', 'woff2')));

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

  for (const source of FONT_FILES) {
    const filename = path.basename(source);
    if (!fs.existsSync(source)) {
      fs.rmSync(temporaryRoot, { recursive: true, force: true });
      throw new Error('bundled font is missing: ' + source + '; run npm ci');
    }
    fs.copyFileSync(source, path.join(fontDirectory, filename));
  }

  const configFile = path.join(temporaryRoot, 'fonts.conf');
  fs.writeFileSync(configFile, [
    '<?xml version="1.0"?>',
    '<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">',
    '<fontconfig>',
    '  <include ignore_missing="yes">/etc/fonts/fonts.conf</include>',
    '  <dir>' + xml(fontDirectory) + '</dir>',
    '  <cachedir>' + xml(cacheDirectory) + '</cachedir>',
    '</fontconfig>',
    '',
  ].join('\n'));

  const previousFile = process.env['FONTCONFIG_FILE'];
  process.env['FONTCONFIG_FILE'] = configFile;
  let cleaned = false;
  return {
    cleanup() {
      if (cleaned) return;
      cleaned = true;
      if (previousFile == null) delete process.env['FONTCONFIG_FILE'];
      else process.env['FONTCONFIG_FILE'] = previousFile;
      fs.rmSync(temporaryRoot, { recursive: true, force: true });
    },
  };
}
