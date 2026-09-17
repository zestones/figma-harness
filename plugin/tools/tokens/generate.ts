/* Read the pinned Primer Primitives package and project the tokens the design
 * system installs. Pure data in, pure data out; tokens.ts writes the module. */
'use strict';

import {
  COLOR_TOKENS,
  DESCRIPTION_WORDS,
  MOTION_DURATIONS,
  MOTION_EASINGS,
  MOTION_TRANSITIONS,
  SHADOW_TOKENS,
  SIZE_TOKENS,
  TEXT_ROLES,
} from './catalog.ts';

const fs = require('node:fs') as typeof import('node:fs');
const path = require('node:path') as typeof import('node:path');

export const PRIMER_ROOT = path.resolve(__dirname, '..', '..', 'node_modules', '@primer', 'primitives');

interface FigmaColor { a?: number; b: number; g: number; r: number }

interface FigmaEntry {
  description?: string;
  name: string;
  reference?: string;
  scopes?: string[];
  type: string;
  value: FigmaColor | number | string;
}

interface DocsEntry {
  description?: string;
  original?: { $value?: unknown };
  value: unknown;
}

export interface GeneratedColor {
  readonly description: string;
  readonly hex: string;
  readonly name: string;
  readonly scopes: readonly string[];
  readonly source: string;
}

export interface GeneratedSharing {
  readonly policy: 'independent-semantics' | 'linked-aliases';
  readonly rationale: string;
  readonly source: string;
}

export interface GeneratedShadowLayer {
  readonly blur: number;
  readonly color: string;
  readonly inset: boolean;
  readonly spread: number;
  readonly x: number;
  readonly y: number;
}

export interface GeneratedTokens {
  readonly colors: readonly GeneratedColor[];
  readonly motion: {
    readonly durations: ReadonlyArray<readonly [name: string, milliseconds: number, description: string]>;
    readonly easings: ReadonlyArray<readonly [name: string, bezier: readonly number[], description: string]>;
    readonly transitions: ReadonlyArray<readonly [name: string, duration: string, easing: string, description: string]>;
  };
  readonly shadows: ReadonlyArray<readonly [name: string, layers: readonly GeneratedShadowLayer[], description: string]>;
  readonly sharing: readonly GeneratedSharing[];
  readonly sizes: ReadonlyArray<readonly [name: string, value: number, scopes: readonly string[]]>;
  readonly text: ReadonlyArray<readonly [
    role: string, family: 'sans' | 'mono', size: number, lineHeight: number, weight: number, description: string,
  ]>;
  readonly version: string;
}

function readJson<T>(relative: string): T {
  return JSON.parse(fs.readFileSync(path.join(PRIMER_ROOT, relative), 'utf8')) as T;
}

function channel(value: number): string {
  return Math.round(Math.max(0, Math.min(1, value)) * 255).toString(16).padStart(2, '0').toUpperCase();
}

/** #RRGGBB for an opaque colour, #RRGGBBAA otherwise — the notation Primer's CSS ships. */
export function colorHex(color: FigmaColor): string {
  const alpha = color.a == null ? 1 : color.a;
  return '#' + channel(color.r) + channel(color.g) + channel(color.b) + (alpha < 1 ? channel(alpha) : '');
}

function isColor(value: unknown): value is FigmaColor {
  return !!value && typeof value === 'object' && typeof (value as FigmaColor).r === 'number';
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function spaced(value: string): string {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
}

const PROPERTIES = new Set(['bgColor', 'borderColor', 'fgColor', 'iconColor', 'color']);

/** Primer leaves component tokens undescribed; name the role they play. */
export function describeComponentToken(name: string): string {
  const parts = name.split('/');
  const property = parts.findIndex((part) => PROPERTIES.has(part));
  if (property < 1) throw new Error('cannot describe ' + name);
  const subject = parts.slice(0, property);
  const qualifiers = parts.slice(property + 1).map((part) => DESCRIPTION_WORDS[part] || spaced(part));
  let noun: string;
  if (subject[0] === 'data') noun = subject[1] + ' data series';
  else if (subject.length > 1 && !['track', 'backdrop', 'header'].includes(subject[1])) {
    noun = spaced(subject[1]) + ' ' + spaced(subject[0]);
  } else noun = subject.map(spaced).join(' ');
  const words = [noun, DESCRIPTION_WORDS[parts[property]]].concat(qualifiers);
  return capitalize(words.join(' ').replace(/ (emphasis|muted)$/, ', $1'));
}

const BASE_PREFIX = 'base/color/light/base/';

function colorSources(entries: ReadonlyMap<string, FigmaEntry>) {
  const rootOf = function (name: string, trail: string[] = []): string {
    if (trail.includes(name)) throw new Error('reference cycle: ' + trail.concat(name).join(' -> '));
    const entry = entries.get(name);
    if (!entry) throw new Error('Primer does not publish ' + name);
    const reference = entry.reference || '';
    if (!reference) return name;
    if (reference.startsWith('mode/')) return rootOf(reference.slice('mode/'.length), trail.concat(name));
    if (reference.startsWith(BASE_PREFIX)) {
      return 'base/' + reference.slice(BASE_PREFIX.length).replace(/^color\//, '').replace('/color/', '/');
    }
    throw new Error('unsupported reference on ' + name + ': ' + reference);
  };
  return rootOf;
}

export function generateTokens(): GeneratedTokens {
  const version = readJson<{ version: string }>('package.json').version;
  const theme = readJson<FigmaEntry[]>('dist/figma/themes/light.json');
  const byName = new Map(theme.map((entry) => [entry.name, entry]));
  const rootOf = colorSources(byName);

  const colors: GeneratedColor[] = COLOR_TOKENS.map((name) => {
    const entry = byName.get(name);
    if (!entry || entry.type !== 'COLOR' || !isColor(entry.value)) {
      throw new Error('Primer does not publish the colour ' + name);
    }
    const alpha = entry.value.a == null ? 1 : entry.value.a;
    const root = rootOf(name);
    return {
      name,
      hex: colorHex(entry.value),
      description: (entry.description || '').trim() || describeComponentToken(name),
      source: root + (alpha < 1 ? ' at ' + Math.round(alpha * 100) + '%' : ''),
      scopes: Object.freeze([...(entry.scopes || [])].sort()),
    };
  });
  if (new Set(COLOR_TOKENS).size !== COLOR_TOKENS.length) throw new Error('a colour is listed twice');

  const consumers = new Map<string, GeneratedColor[]>();
  for (const color of colors) consumers.set(color.source, (consumers.get(color.source) || []).concat(color));
  const sharing: GeneratedSharing[] = [];
  for (const [source, group] of consumers) {
    if (group.length < 2) continue;
    const root = source.replace(/ at \d+%$/, '');
    const semantic = !root.startsWith('base/');
    sharing.push({
      source,
      policy: semantic ? 'linked-aliases' : 'independent-semantics',
      rationale: semantic
        ? 'Primer aliases ' + group.filter((color) => color.name !== root).map((color) => color.name).join(', ') + ' to ' + root + '.'
        : 'Primer resolves ' + group.map((color) => color.name).join(', ') + ' to ' + source + '.',
    });
  }

  const dimensions = new Map(readJson<FigmaEntry[]>('dist/figma/dimension/dimension.json')
    .map((entry) => [entry.name, entry]));
  const sizes = SIZE_TOKENS.map((name) => {
    const entry = dimensions.get(name);
    if (!entry || typeof entry.value !== 'number') throw new Error('Primer does not publish the size ' + name);
    return [name, entry.value, Object.freeze([...(entry.scopes || [])])] as const;
  });

  const typography = readJson<Record<string, DocsEntry>>('dist/docs/functional/typography/typography.json');
  const docValue = function (key: string): unknown {
    const entry = typography[key];
    if (!entry) throw new Error('Primer typography has no ' + key);
    return entry.value;
  };
  const text = TEXT_ROLES.map(([role, stem, family]) => {
    const key = (part: string) => stem.includes('{}') ? stem.replace('{}', part) : stem + '-' + part;
    // Body roles share one weight: text-body-weight rather than text-body-weight-medium.
    const weightKey = typography[key('weight')] ? key('weight') : stem.slice(0, stem.indexOf('-{}')) + '-weight';
    const size = parseFloat(String(docValue(key('size')))) * 16;
    const lineHeight = Number(docValue(key('lineHeight')));
    const weight = Number(docValue(weightKey));
    const shorthand = typography[key('shorthand')];
    if (!Number.isFinite(size) || !Number.isFinite(lineHeight) || !Number.isFinite(weight)) {
      throw new Error('incomplete Primer typography for ' + role);
    }
    return [role, family, size, Math.round(size * lineHeight * 100) / 100, weight,
      (shorthand?.description || '').trim()] as const;
  });

  const shadowDocs = readJson<Record<string, DocsEntry>>('dist/docs/functional/themes/light.json');
  const shadows = SHADOW_TOKENS.map((name) => {
    const prefix = name + '/';
    const layers = new Map<string, Partial<Record<string, FigmaEntry['value']>>>();
    for (const entry of theme) {
      if (!entry.name.startsWith(prefix)) continue;
      const rest = entry.name.slice(prefix.length).split('/');
      const layer = rest.length > 1 ? rest[0] : '1';
      layers.set(layer, { ...(layers.get(layer) || {}), [rest[rest.length - 1]]: entry.value });
    }
    const doc = shadowDocs[name.replace(/\//g, '-')];
    if (!layers.size || !doc) throw new Error('Primer does not publish the shadow ' + name);
    const original = doc.original?.$value;
    const insetFlags = (Array.isArray(original) ? original : [original])
      .map((layer) => !!(layer as { inset?: boolean } | undefined)?.inset);
    const values = [...layers.keys()].sort().map((layer, index): GeneratedShadowLayer => {
      const fields = layers.get(layer)!;
      if (!isColor(fields['color'])) throw new Error('shadow ' + name + ' has no colour');
      return {
        x: Number(fields['offsetX']), y: Number(fields['offsetY']),
        blur: Number(fields['blur']), spread: Number(fields['spread']),
        color: colorHex(fields['color']),
        inset: insetFlags[index] === true,
      };
    });
    const described = (doc.description || '').trim()
      || capitalize(name.replace('/shadow/', ' ').replace(/\//g, ' ')) + ' shadow';
    return [name, values, described] as const;
  });

  const motionDocs = readJson<Record<string, DocsEntry>>('dist/docs/functional/motion/motion.json');
  const motion = function (key: string): DocsEntry {
    const entry = motionDocs[key];
    if (!entry) throw new Error('Primer motion has no ' + key);
    return entry;
  };
  const milliseconds = function (value: unknown): number {
    const duration = value as { unit?: string; value?: number };
    if (duration?.unit !== 'ms' || typeof duration.value !== 'number') throw new Error('unexpected duration');
    return duration.value;
  };
  const durations = MOTION_DURATIONS.map((name) => {
    const entry = motion('motion-duration-' + name);
    return [name, milliseconds(entry.value), (entry.description || '').trim()] as const;
  });
  const easings = MOTION_EASINGS.map((name) => {
    const entry = motion('motion-easing-' + name);
    const bezier = entry.value as number[];
    if (!Array.isArray(bezier) || bezier.length !== 4) throw new Error('unexpected easing ' + name);
    return [name, Object.freeze([...bezier]), (entry.description || '').trim()] as const;
  });
  const transitions = MOTION_TRANSITIONS.map((name) => {
    const entry = motion('motion-transition-' + name);
    const original = entry.original?.$value as { duration?: string; timingFunction?: string } | undefined;
    const reference = (value: string | undefined, group: string): string => {
      const match = /^\{motion\.(duration|easing)\.([A-Za-z]+)\}$/.exec(value || '');
      if (!match || match[1] !== group) throw new Error('transition ' + name + ' does not reference a ' + group);
      return match[2];
    };
    return [name, reference(original?.duration, 'duration'), reference(original?.timingFunction, 'easing'),
      (entry.description || '').trim()] as const;
  });
  for (const [name, duration, easing] of transitions) {
    if (!MOTION_DURATIONS.includes(duration) || !MOTION_EASINGS.includes(easing)) {
      throw new Error('transition ' + name + ' uses an uninstalled duration or easing');
    }
  }

  return { version, colors, sharing, sizes, text, shadows, motion: { durations, easings, transitions } };
}
