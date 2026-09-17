/* Sizes, installed as Figma variables and bound by the layers that use them.
 * Gaps and paddings stay on the spacing scale; the audits reject any other value. */

import { dimensionReference, type DimensionReference } from '@figma-harness/engine';

type VariableScope = 'CORNER_RADIUS' | 'GAP' | 'WIDTH_HEIGHT';

const size = function (name: string, value: number, scopes: readonly VariableScope[], description: string) {
  return Object.freeze({ name, value, scopes: Object.freeze([...scopes]), description });
};

export const DIMS = Object.freeze([
  size('space/2', 2, ['GAP'], 'Between a label and its caption.'),
  size('space/4', 4, ['GAP'], 'Inside badges and chips.'),
  size('space/6', 6, ['GAP'], 'Between an icon and its label.'),
  size('space/8', 8, ['GAP'], 'Between related controls.'),
  size('space/12', 12, ['GAP'], 'Inside compact groups and table cells.'),
  size('space/16', 16, ['GAP'], 'Between cards and inside rows.'),
  size('space/20', 20, ['GAP'], 'Inside cards.'),
  size('space/24', 24, ['GAP'], 'Between blocks of a page.'),
  size('space/32', 32, ['GAP'], 'Page padding.'),
  size('space/40', 40, ['GAP'], 'Around dialogs and empty states.'),
  size('space/48', 48, ['GAP'], 'Between sections of a sheet.'),
  size('space/64', 64, ['GAP'], 'Around sheets.'),
  size('radius/xs', 4, ['CORNER_RADIUS'], 'Checkboxes and keyboard keys.'),
  size('radius/sm', 6, ['CORNER_RADIUS'], 'Buttons, fields and menu items.'),
  size('radius/md', 8, ['CORNER_RADIUS'], 'Segments, tooltips and small panels.'),
  size('radius/lg', 12, ['CORNER_RADIUS'], 'Cards, tables and dialogs.'),
  size('radius/full', 9999, ['CORNER_RADIUS'], 'Avatars, pills and switches.'),
  size('control/sm', 32, ['WIDTH_HEIGHT'], 'Compact buttons and fields.'),
  size('control/md', 36, ['WIDTH_HEIGHT'], 'Buttons, fields and navigation items.'),
  size('sidebar/width', 248, ['WIDTH_HEIGHT'], 'The sidebar.'),
  size('topbar/height', 64, ['WIDTH_HEIGHT'], 'The bar above every page.'),
  size('dialog/width', 480, ['WIDTH_HEIGHT'], 'A dialog.'),
] as const);

export type DimensionName = typeof DIMS[number]['name'];

/** The spacing scale, zero included. */
export const SPACING: readonly number[] = Object.freeze([0, ...DIMS.filter((token) => token.name.startsWith('space/')).map((token) => token.value)]);

export const RADII = Object.freeze({ xs: 4, sm: 6, md: 8, lg: 12, full: 9999 });

const references = new Map<string, DimensionReference>();

/** A bound size: f({ pad: dim('space/16') }). Arithmetic uses .value. */
export function dim(name: DimensionName): DimensionReference {
  let reference = references.get(name);
  if (!reference) {
    const token = DIMS.find((entry) => entry.name === name);
    if (!token) throw new Error('unknown size ' + name);
    reference = dimensionReference(token.name, token.value, token.scopes);
    references.set(name, reference);
  }
  return reference;
}
