/* The fonts a design system uses, as bundled by Fontsource. The harness
 * measures text with them and the renderer draws with them, so the two agree
 * with each other and closely with Figma. Each design system lists them in its
 * design-system.json manifest; a harness selects the design system it builds. */
'use strict';

import { activeComposition, designSystemLayoutOf, workspacePackages } from './workspace.ts';

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

const loaded = new Map<string, BundledFonts>();
let selected: string | null = null;

const fontsOf = function (designSystemDirectory: string): BundledFonts {
  const cached = loaded.get(designSystemDirectory);
  if (cached) return cached;
  const entry = workspacePackages().find((candidate) => candidate.dir === designSystemDirectory);
  if (!entry || entry.role !== 'design-system') {
    throw new Error(designSystemDirectory + ' is not a design-system package');
  }
  const layout = designSystemLayoutOf(entry);
  const families: Record<string, BundledFamily> = {};
  for (const [family, font] of Object.entries(layout.manifest.fonts.families)) {
    const link = path.join(layout.root, 'node_modules', font.package);
    families[family] = Object.freeze({
      directory: fs.existsSync(link) ? fs.realpathSync(link) : link,
      packageName: font.package,
      prefix: font.package.split('/').pop() || font.package,
      weights: Object.freeze([...font.weights]),
    });
  }
  const fallback = layout.manifest.fonts.default;
  if (!families[fallback]) {
    throw new Error('the default font ' + fallback + ' is not one of ' + entry.name + '\'s bundled families');
  }
  const fonts = Object.freeze({ defaultFamily: fallback, families: Object.freeze(families) });
  loaded.set(designSystemDirectory, fonts);
  return fonts;
};

/** Measure and draw with this design system's fonts from now on. */
export function useDesignSystemFonts(designSystemDirectory: string): void {
  selected = designSystemDirectory;
}

const current = function (): BundledFonts {
  return fontsOf(selected || activeComposition().designSystem.dir);
};

/** Every bundled family of the selected design system, by name. */
export function bundledFamilies(): Readonly<Record<string, BundledFamily>> {
  return current().families;
}

/** The family unknown or unstyled text is measured and drawn with. */
export function defaultFamily(): string {
  return current().defaultFamily;
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
