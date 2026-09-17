/* The fonts the design system uses, as bundled by Fontsource.
 * The harness measures text with them and the renderer draws with them, so the
 * two agree with each other and closely with Figma. */
'use strict';

const path = require('node:path') as typeof import('node:path');

const PLUGIN_ROOT = path.resolve(__dirname, '..', '..');

export interface BundledFamily {
  readonly packageName: string;
  readonly prefix: string;
  readonly weights: readonly number[];
}

export const BUNDLED_FAMILIES: Readonly<Record<string, BundledFamily>> = Object.freeze({
  'Noto Sans': Object.freeze({ packageName: '@fontsource/noto-sans', prefix: 'noto-sans', weights: Object.freeze([400, 500, 600]) }),
  'Noto Sans Mono': Object.freeze({ packageName: '@fontsource/noto-sans-mono', prefix: 'noto-sans-mono', weights: Object.freeze([400, 500]) }),
});

/** The family unknown or unstyled text is measured and drawn with. */
export const DEFAULT_FAMILY = 'Noto Sans';

/** Unicode subsets searched, in order, for a character's glyph. */
export const FONT_SUBSETS: readonly string[] = Object.freeze([
  'latin', 'latin-ext', 'greek', 'greek-ext', 'cyrillic', 'cyrillic-ext', 'vietnamese',
]);

export function fontWeight(style: string): number {
  if (/black/i.test(style)) return 900;
  if (/extra[\s-]?bold/i.test(style)) return 800;
  if (/semi[\s-]?bold/i.test(style)) return 600;
  if (/bold/i.test(style)) return 700;
  if (/medium/i.test(style)) return 500;
  if (/light/i.test(style)) return 300;
  return 400;
}

export function bundledFontFile(
  family: string,
  weight: number,
  subset: string,
  extension: 'woff' | 'woff2',
): string {
  const bundled = BUNDLED_FAMILIES[family];
  if (!bundled) throw new Error('font family is not bundled: ' + family);
  return path.join(
    PLUGIN_ROOT, 'node_modules', bundled.packageName, 'files',
    bundled.prefix + '-' + subset + '-' + weight + '-normal.' + extension,
  );
}
