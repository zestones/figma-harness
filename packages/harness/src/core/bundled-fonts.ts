/* The fonts the configured design system uses, as bundled by Fontsource.
 * The harness measures text with them and the renderer draws with them, so the
 * two agree with each other and closely with Figma. The design system lists
 * them in its design-system.json manifest. */
'use strict';

import { designSystemLayout } from './workspace.ts';

const fs = require('node:fs') as typeof import('node:fs');
const path = require('node:path') as typeof import('node:path');

export interface BundledFamily {
  /** The Fontsource package directory. */
  readonly directory: string;
  readonly packageName: string;
  /** Fontsource names its files after the package, without the scope. */
  readonly prefix: string;
  readonly weights: readonly number[];
}

interface BundledFonts {
  readonly defaultFamily: string;
  readonly families: Readonly<Record<string, BundledFamily>>;
}

let loaded: BundledFonts | null = null;

const bundledFonts = function (): BundledFonts {
  if (loaded) return loaded;
  const layout = designSystemLayout();
  const families: Record<string, BundledFamily> = {};
  for (const [family, entry] of Object.entries(layout.manifest.fonts.families)) {
    const link = path.join(layout.root, 'node_modules', entry.package);
    families[family] = Object.freeze({
      directory: fs.existsSync(link) ? fs.realpathSync(link) : link,
      packageName: entry.package,
      prefix: entry.package.split('/').pop() || entry.package,
      weights: Object.freeze([...entry.weights]),
    });
  }
  const fallback = layout.manifest.fonts.default;
  if (!families[fallback]) {
    throw new Error('the default font ' + fallback + ' is not one of the design system\'s bundled families');
  }
  loaded = Object.freeze({ defaultFamily: fallback, families: Object.freeze(families) });
  return loaded;
};

/** Every bundled family, by name. */
export function bundledFamilies(): Readonly<Record<string, BundledFamily>> {
  return bundledFonts().families;
}

/** The family unknown or unstyled text is measured and drawn with. */
export function defaultFamily(): string {
  return bundledFonts().defaultFamily;
}

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
  const bundled = bundledFamilies()[family];
  if (!bundled) throw new Error('font family is not bundled: ' + family);
  return path.join(
    bundled.directory, 'files',
    bundled.prefix + '-' + subset + '-' + weight + '-normal.' + extension,
  );
}
