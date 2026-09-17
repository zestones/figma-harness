/* Figma property descriptors: enum checks, layout invariants, and text reflow. */

import type { MockNode } from './types.ts';
import { bubble } from '../layout.ts';

const ENUMS = {
  blendMode: ['NORMAL', 'PASS_THROUGH', 'MULTIPLY', 'SCREEN', 'OVERLAY'],
  counterAxisAlignItems: ['MIN', 'MAX', 'CENTER', 'BASELINE'],
  counterAxisSizingMode: ['FIXED', 'AUTO'],
  layoutMode: ['NONE', 'HORIZONTAL', 'VERTICAL'],
  layoutPositioning: ['AUTO', 'ABSOLUTE'],
  layoutSizingHorizontal: ['FIXED', 'HUG', 'FILL'],
  layoutSizingVertical: ['FIXED', 'HUG', 'FILL'],
  layoutWrap: ['NO_WRAP', 'WRAP'],
  overflowDirection: ['NONE', 'HORIZONTAL', 'VERTICAL', 'BOTH'],
  primaryAxisAlignItems: ['MIN', 'MAX', 'CENTER', 'SPACE_BETWEEN'],
  primaryAxisSizingMode: ['FIXED', 'AUTO'],
  strokeAlign: ['INSIDE', 'OUTSIDE', 'CENTER'],
  strokeCap: [
    'NONE', 'ROUND', 'SQUARE', 'ARROW_LINES', 'ARROW_EQUILATERAL',
    'DIAMOND_FILLED', 'TRIANGLE_FILLED', 'CIRCLE_FILLED',
  ],
  strokeJoin: ['MITER', 'BEVEL', 'ROUND'],
  textAlignHorizontal: ['LEFT', 'CENTER', 'RIGHT', 'JUSTIFIED'],
  textAlignVertical: ['TOP', 'CENTER', 'BOTTOM'],
  textAutoResize: ['NONE', 'WIDTH_AND_HEIGHT', 'HEIGHT', 'TRUNCATE'],
  textCase: ['ORIGINAL', 'UPPER', 'LOWER', 'TITLE', 'SMALL_CAPS', 'SMALL_CAPS_FORCED'],
  textDecoration: ['NONE', 'UNDERLINE', 'STRIKETHROUGH'],
  textTruncation: ['DISABLED', 'ENDING'],
} as const;

type EnumProperty = keyof typeof ENUMS;
const values = new WeakMap<MockNode, Record<string, unknown>>();
const DEFAULTS = {
  counterAxisAlignItems: 'MIN', counterAxisSizingMode: 'AUTO', layoutMode: 'NONE',
  primaryAxisAlignItems: 'MIN', primaryAxisSizingMode: 'AUTO', textAutoResize: 'WIDTH_AND_HEIGHT',
};

type Validation = (node: MockNode, value: unknown) => void;
function descriptor(property: string, validate?: Validation, after?: (node: MockNode) => void): PropertyDescriptor {
  return {
    configurable: true,
    get(this: MockNode): unknown { return values.get(this)![property]; },
    set(this: MockNode, next: unknown): void {
      validate?.(this, next);
      values.get(this)![property] = next;
      after?.(this);
    },
  };
}

function checkSizing(node: MockNode, axis: string, value: unknown): void {
  if (value === 'FILL') {
    if (!node.parent || node.parent.layoutMode === 'NONE') {
      throw new Error('layoutSizing' + axis + '=FILL on "' + node.name + '" (' + node.type
        + '): parent is not auto-layout');
    }
    if (node.layoutPositioning === 'ABSOLUTE') {
      throw new Error('layoutSizing' + axis + '=FILL on absolute child "' + node.name + '"');
    }
  }
  if (value === 'HUG') {
    const selfAutoLayout = node.layoutMode && node.layoutMode !== 'NONE';
    const textChild = node.type === 'TEXT' && node.parent && node.parent.layoutMode !== 'NONE';
    if (!selfAutoLayout && !textChild) {
      throw new Error('layoutSizing' + axis + '=HUG on "' + node.name + '" (' + node.type + ')');
    }
  }
  if (value === 'AUTO') throw new Error('layoutSizing' + axis + '=AUTO is invalid (use HUG)');
}

// Accessor functions are shared across nodes. Only their small backing values
// are per-node; weak keys do not keep removed nodes alive.
const COMMON: PropertyDescriptorMap = {};
function enumValidation(property: EnumProperty): Validation {
  return (node, next) => {
    const allowed: readonly unknown[] = ENUMS[property];
    if (next != null && !allowed.includes(next)) {
      throw new Error('in set_' + property + ': Property "' + property + '" failed validation: '
        + "Invalid enum value. Expected '" + ENUMS[property].join("' | '")
        + "', received '" + String(next) + "'  [node \"" + node.name + '"]');
    }
  };
}
for (const property of Object.keys(ENUMS) as EnumProperty[]) {
  COMMON[property] = descriptor(property, enumValidation(property));
}
// Figma's legacy TRUNCATE sizing mode and textTruncation share one state:
// choosing any other sizing mode switches the ellipsis off, so a truncated text
// must receive its fixed box before truncation is enabled.
COMMON['textAutoResize'] = descriptor('textAutoResize', enumValidation('textAutoResize'), (node) => {
  values.get(node)!['textTruncation'] = node.textAutoResize === 'TRUNCATE' ? 'ENDING' : 'DISABLED';
  if (node.type === 'TEXT') node._remeasure();
});
COMMON['layoutPositioning'] = descriptor('layoutPositioning', (node, value) => {
  if (value === 'ABSOLUTE' && (!node.parent || node.parent.layoutMode === 'NONE')) {
    throw new Error('layoutPositioning=ABSOLUTE on "' + node.name + '": parent is not auto-layout');
  }
}, node => bubble(node.parent));
for (const axis of ['Horizontal', 'Vertical']) {
  COMMON['layoutSizing' + axis] = descriptor('layoutSizing' + axis, (node, value) => checkSizing(node, axis, value));
}
COMMON['layoutWrap'] = descriptor('layoutWrap', (node, value) => {
  if (value === 'WRAP' && node.layoutMode !== 'HORIZONTAL') {
    throw new Error('layoutWrap=WRAP needs layoutMode=HORIZONTAL on "' + node.name + '"');
  }
});
COMMON['counterAxisSizingMode'] = descriptor('counterAxisSizingMode', (_node, value) => {
  if (value !== 'FIXED' && value !== 'AUTO') {
    throw new Error('counterAxisSizingMode expects FIXED|AUTO, got ' + value);
  }
});

const TEXT: PropertyDescriptorMap = {
  characters: {
    configurable: true,
    get(this: MockNode): string { return values.get(this)!['characters'] as string; },
    set(this: MockNode, value: unknown): void {
      values.get(this)!['characters'] = String(value);
      this._remeasure();
    },
  },
};
for (const property of ['fontSize', 'fontName', 'lineHeight', 'letterSpacing', 'textCase']) {
  TEXT[property] = descriptor(property, undefined, node => node._remeasure());
}

// Keep the existing enumerable value surface used by the signature. Moving
// behavior to prototypes must not change which design properties are recorded.
const OWN = Object.fromEntries(Object.keys(DEFAULTS).map(property => [
  property, { ...COMMON[property], enumerable: true },
]));
const CHARACTERS = { ...TEXT['characters'], enumerable: true };

export function installMockPropertyPrototypes(base: object): object {
  Object.defineProperties(base, COMMON);
  return Object.create(base, TEXT) as object;
}

export function initializeMockProperties(node: MockNode): void {
  values.set(node, { ...DEFAULTS, ...(node.type === 'TEXT' ? { characters: '' } : {}) });
  Object.defineProperties(node, OWN);
  if (node.type === 'TEXT') Object.defineProperty(node, 'characters', CHARACTERS);
}
