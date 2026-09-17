/* Text measurement and line breaking for the mock Figma API and the renderer. */
'use strict';

import { DEFAULT_FAMILY } from '../../core/bundled-fonts.ts';
import { advanceEm, advanceTable } from './font-metrics.ts';

export interface TextMeasurementStyle {
  fontName?: { family: string; style?: string };
  fontSize: number;
  letterSpacing?: { value: number };
  lineHeight?: { value: number };
  textCase?: string;
}

export interface TextLayout {
  /** Height of one line. */
  lineHeight: number;
  /** Rendered lines, counting a word wider than the box once per line it spans. */
  lines: number;
  /** Width of the widest line, or of the box when one is given. */
  w: number;
}

/** Width of one unbroken line of text, in pixels. */
export function measure(
  text: unknown,
  size: number,
  family: string,
  trackingPixels = 0,
  upper = false,
  style = 'Regular',
): number {
  const source = upper ? String(text).toUpperCase() : String(text);
  const table = advanceTable(family || DEFAULT_FAMILY, style);
  let width = 0;
  for (const character of source) width += advanceEm(table, character) * size + trackingPixels;
  return Math.max(0, width);
}

/** Greedy word wrap, the way a fixed-width text box breaks its lines. */
export function wrapLines(
  text: string,
  width: number,
  lineWidth: (line: string) => number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let current = '';
    for (const word of paragraph.split(' ')) {
      const trial = current ? current + ' ' + word : word;
      if (current && lineWidth(trial) > width + 0.01) {
        lines.push(current);
        current = word;
      } else {
        current = trial;
      }
    }
    lines.push(current);
  }
  return lines;
}

function styleWidth(style: TextMeasurementStyle): (line: string) => number {
  const size = style.fontSize;
  const tracking = (style.letterSpacing?.value || 0) / 100 * size;
  const family = style.fontName?.family || DEFAULT_FAMILY;
  const fontStyle = style.fontName?.style || 'Regular';
  const upper = style.textCase === 'UPPER';
  return (line) => measure(line, size, family, tracking, upper, fontStyle);
}

/** Lay text out in an auto-width box (`boxWidth` null) or a fixed-width one. */
export function layoutText(
  characters: unknown,
  style: TextMeasurementStyle | null | undefined,
  boxWidth: number | null,
): TextLayout {
  if (!style) return { w: 10, lines: 1, lineHeight: 12 };
  const lineHeight = style.lineHeight?.value || style.fontSize * 1.4;
  const lineWidth = styleWidth(style);
  const text = String(characters);
  if (boxWidth == null || boxWidth <= 0) {
    const paragraphs = text.split('\n');
    return {
      w: Math.max(0, ...paragraphs.map(lineWidth)),
      lines: paragraphs.length,
      lineHeight,
    };
  }
  let lines = 0;
  for (const line of wrapLines(text, boxWidth, lineWidth)) {
    lines += Math.max(1, Math.ceil(lineWidth(line) / boxWidth - 0.001));
  }
  return { w: boxWidth, lines, lineHeight };
}
