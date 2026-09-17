/* Advance widths read from the bundled fonts.
 *
 * Figma lays text out with the real fonts. A per-character guess
 * underestimated almost half of the example document's strings, by up to 9 %,
 * so a label that fitted in the harness wrapped in Figma. The harness reads the
 * same WOFF files the renderer uses and sums advance widths. Kerning is
 * ignored, which errs on the wide side. */
'use strict';

import {
  FONT_SUBSETS,
  bundledFamilies,
  bundledFontFile,
  defaultFamily,
  fontWeight,
} from '../core/bundled-fonts.ts';
import { woffTables } from '../core/woff.ts';

const fs = require('node:fs') as typeof import('node:fs');

/** Advance widths in em, by code point, for one family and weight. */
export type AdvanceTable = ReadonlyMap<number, number>;

/** Width used for a character none of the bundled subsets contain. */
const FALLBACK_EM = 0.6;
const tables = new Map<string, Map<number, number>>();

function glyphsByCodePoint(cmap: Buffer): Map<number, number> {
  const glyphs = new Map<number, number>();
  const count = cmap.readUInt16BE(2);
  for (let index = 0; index < count; index++) {
    const offset = cmap.readUInt32BE(4 + index * 8 + 4);
    const format = cmap.readUInt16BE(offset);
    if (format === 4) {
      const segments = cmap.readUInt16BE(offset + 6) / 2;
      const ends = offset + 14;
      const starts = ends + segments * 2 + 2;
      const deltas = starts + segments * 2;
      const ranges = deltas + segments * 2;
      for (let segment = 0; segment < segments; segment++) {
        const end = cmap.readUInt16BE(ends + segment * 2);
        const start = cmap.readUInt16BE(starts + segment * 2);
        const delta = cmap.readInt16BE(deltas + segment * 2);
        const rangeOffset = cmap.readUInt16BE(ranges + segment * 2);
        for (let codePoint = start; codePoint <= end && codePoint !== 0xFFFF; codePoint++) {
          let glyph: number;
          if (!rangeOffset) glyph = (codePoint + delta) & 0xFFFF;
          else {
            glyph = cmap.readUInt16BE(ranges + segment * 2 + rangeOffset + (codePoint - start) * 2);
            if (glyph) glyph = (glyph + delta) & 0xFFFF;
          }
          if (!glyphs.has(codePoint)) glyphs.set(codePoint, glyph);
        }
      }
    } else if (format === 12) {
      const groups = cmap.readUInt32BE(offset + 12);
      for (let group = 0; group < groups; group++) {
        const entry = offset + 16 + group * 12;
        const start = cmap.readUInt32BE(entry);
        const end = cmap.readUInt32BE(entry + 4);
        const firstGlyph = cmap.readUInt32BE(entry + 8);
        for (let codePoint = start; codePoint <= end; codePoint++) {
          if (!glyphs.has(codePoint)) glyphs.set(codePoint, firstGlyph + codePoint - start);
        }
      }
    }
  }
  return glyphs;
}

function readAdvances(file: string, into: Map<number, number>): void {
  const font = woffTables(file);
  const head = font.get('head');
  const hhea = font.get('hhea');
  const hmtx = font.get('hmtx');
  const cmap = font.get('cmap');
  if (!head || !hhea || !hmtx || !cmap) throw new Error('incomplete font: ' + file);
  const unitsPerEm = head.readUInt16BE(18);
  const metrics = hhea.readUInt16BE(34);
  for (const [codePoint, glyph] of glyphsByCodePoint(cmap)) {
    if (into.has(codePoint)) continue;
    into.set(codePoint, hmtx.readUInt16BE(4 * Math.min(glyph, metrics - 1)) / unitsPerEm);
  }
}

/** The advance table for a family and style; unknown families measure as the default family. */
export function advanceTable(family: string, style: string): AdvanceTable {
  const families = bundledFamilies();
  const name = families[family] ? family : defaultFamily();
  const weights = families[name].weights;
  const wanted = fontWeight(style || 'Regular');
  const weight = weights.reduce((best, candidate) =>
    Math.abs(candidate - wanted) < Math.abs(best - wanted) ? candidate : best, weights[0]);
  const key = families[name].directory + ':' + weight;
  let table = tables.get(key);
  if (!table) {
    table = new Map();
    for (const subset of FONT_SUBSETS) {
      const file = bundledFontFile(name, weight, subset, 'woff');
      if (fs.existsSync(file)) readAdvances(file, table);
    }
    if (!table.size) throw new Error('bundled font metrics are missing for ' + key + '; run pnpm install');
    tables.set(key, table);
  }
  return table;
}

export function advanceEm(table: AdvanceTable, character: string): number {
  return table.get(character.codePointAt(0) ?? 0) ?? FALLBACK_EM;
}
