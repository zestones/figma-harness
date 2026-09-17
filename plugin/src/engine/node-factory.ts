/* Runtime: frame creation and composition. */

import {
  ES as effectStylesByName,
  P as tokenPaint,
} from "./figma-resources.ts";
import { bindDimension, dimensionValue, type DimensionValue } from './dimension-bindings.ts';

/* --- the frame factory ---------------------------------------------------- *
 * o = {
 *   name, dir: 'H'|'V'|null, w, h,          // null w/h = hug that axis
 *   gap, rowGap, wrap,
 *   pad: n | [t,r,b,l],
 *   fill: token | tokens[] | false,
 *   radius, stroke, strokeW, strokeSide: 'Top'|'Right'|'Bottom'|'Left',
 *   dash, align: 'MIN'|'CENTER'|'MAX'|'BASELINE', justify: 'MIN'|'CENTER'|'MAX'|'SPACE_BETWEEN',
 *   clip, opacity, elevation
 * }
 * ------------------------------------------------------------------------- */
export interface FrameOptions {
  align?: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';
  clip?: boolean;
  dash?: readonly number[] | null;
  dir?: 'H' | 'V';
  elevation?: string | null;
  fill?: string | readonly Paint[] | false | null;
  gap?: DimensionValue;
  h?: DimensionValue;
  justify?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  name?: string;
  opacity?: number;
  pad?: DimensionValue | readonly [DimensionValue, DimensionValue, DimensionValue, DimensionValue];
  radius?: DimensionValue;
  rowGap?: DimensionValue;
  scroll?: 'H' | 'V' | 'B';
  stroke?: string | null;
  strokeOutside?: boolean;
  strokeSide?: 'Top' | 'Right' | 'Bottom' | 'Left';
  strokeW?: number;
  w?: DimensionValue;
  wrap?: boolean;
}

const STROKE_SIDE_WEIGHT = {
  Top: 'strokeTopWeight',
  Right: 'strokeRightWeight',
  Bottom: 'strokeBottomWeight',
  Left: 'strokeLeftWeight',
} as const;

/* A non-finite size is the one error that reaches Figma as a hard throw
   ("Expected number, received nan") and kills the whole build mid-page. It is
   always an arithmetic result — a width divided by an empty array, a height read
   off a style key that does not exist — so it is caught at the door, where the
   frame still has a name to report. */
const applySize = function (v: number, what: string, name: string): number {
  if (Number.isFinite(v) && v >= 0) return v;
  throw new Error(what + ' is ' + (Number.isNaN(v) ? 'NaN' : String(v)) +
    ' on "' + name + '". A size must be a finite number >= 0.');
};
export { applySize as size };

const createFrame = async function (o: FrameOptions): Promise<FrameNode> {
  var n = figma.createFrame();
  n.name = o.name || 'box';
  if (o.w != null) applySize(dimensionValue(o.w), 'width', n.name);
  if (o.h != null) applySize(dimensionValue(o.h), 'height', n.name);
  if (o.gap != null) applySize(dimensionValue(o.gap), 'gap', n.name);
  n.clipsContent = o.clip == null ? false : !!o.clip;

  if (o.dir) {
    n.layoutMode = o.dir === 'V' ? 'VERTICAL' : 'HORIZONTAL';
    n.itemSpacing = o.gap == null ? 0 : dimensionValue(o.gap);
    n.primaryAxisSizingMode = 'AUTO';
    n.counterAxisSizingMode = 'AUTO';
    n.counterAxisAlignItems = o.align || (o.dir === 'H' ? 'CENTER' : 'MIN');
    if (o.justify) n.primaryAxisAlignItems = o.justify;
    if (o.wrap) { n.layoutWrap = 'WRAP'; if (o.rowGap != null) n.counterAxisSpacing = dimensionValue(o.rowGap); }
  }

  var p = o.pad;
  if (p != null) {
    if (typeof p === 'number' || 'variable' in p) {
      n.paddingTop = n.paddingRight = n.paddingBottom = n.paddingLeft = dimensionValue(p);
    } else {
      n.paddingTop = dimensionValue(p[0]); n.paddingRight = dimensionValue(p[1]);
      n.paddingBottom = dimensionValue(p[2]); n.paddingLeft = dimensionValue(p[3]);
    }
  }

  // Size BEFORE flipping sizing modes: resize() forces FIXED on both axes.
  if (o.w != null || o.h != null) {
    n.resize(o.w == null ? n.width : dimensionValue(o.w), o.h == null ? n.height : dimensionValue(o.h));
  }
  if (o.dir) {
    var primaryAuto = o.dir === 'V' ? (o.h == null) : (o.w == null);
    var counterAuto = o.dir === 'V' ? (o.w == null) : (o.h == null);
    n.primaryAxisSizingMode = primaryAuto ? 'AUTO' : 'FIXED';
    n.counterAxisSizingMode = counterAuto ? 'AUTO' : 'FIXED';
  }

  n.fills = o.fill === false || o.fill == null ? []
    : (typeof o.fill === 'string' ? [tokenPaint(o.fill)] : o.fill);

  if (o.radius != null) n.cornerRadius = dimensionValue(o.radius);

  if (o.stroke) {
    n.strokes = [tokenPaint(o.stroke)];
      // Borders sit inside the box, as CSS draws them with border-box sizing.
    n.strokeAlign = o.strokeOutside ? 'OUTSIDE' : 'INSIDE';
    if (o.strokeSide) {
      n.strokeTopWeight = 0; n.strokeRightWeight = 0; n.strokeBottomWeight = 0; n.strokeLeftWeight = 0;
      n[STROKE_SIDE_WEIGHT[o.strokeSide]] = o.strokeW || 1;
    } else {
      n.strokeWeight = o.strokeW || 1;
    }
    if (o.dash) { try { n.dashPattern = o.dash; } catch (e) { /* ignore */ } }
  }

  // A scroll region is allowed to overflow on its scroll axis — and this also
  // makes the Figma prototype actually scroll there.
  if (o.scroll) {
    // overflowDirection is the prototype-scroll property. Guarded because a
    // single unexpected rejection must not take down a whole page build.
    try {
      n.overflowDirection = o.scroll === 'H' ? 'HORIZONTAL' : (o.scroll === 'B' ? 'BOTH' : 'VERTICAL');
    } catch (e) { /* older editor: the frame simply clips */ }
    n.clipsContent = true;
  }
  if (o.opacity != null) n.opacity = o.opacity;
  if (o.elevation) {
    const style = effectStylesByName[o.elevation];
    if (!style) throw new Error('Unknown shadow: ' + o.elevation + ' on "' + n.name + '"');
    await n.setEffectStyleIdAsync(style.id);
  }

  // Bind after resize/sizing modes and literal assignments. Numeric calculations
  // remain numeric; a matching value alone never chooses a semantic token.
  bindDimension(n, 'width', o.w);
  bindDimension(n, 'height', o.h);
  bindDimension(n, 'cornerRadius', o.radius);
  if (o.dir) {
    bindDimension(n, 'itemSpacing', o.gap);
    if (o.wrap) bindDimension(n, 'counterAxisSpacing', o.rowGap);
  }
  if (p != null) {
    const pads = typeof p === 'number' || 'variable' in p ? [p, p, p, p] : p;
    bindDimension(n, 'paddingTop', pads[0]); bindDimension(n, 'paddingRight', pads[1]);
    bindDimension(n, 'paddingBottom', pads[2]); bindDimension(n, 'paddingLeft', pads[3]);
  }

  return n;
};
export { createFrame as f };

/** Append children in order. Returns the parent.
 * @param {ChildrenMixin} parent
 * @param {...SceneNode} children
 */
const appendChildren = function <T extends ChildrenMixin>(
  parent: T,
  ...children: readonly (SceneNode | null | undefined | false)[]
): T {
  for (var i = 0; i < children.length; i++) {
    var c = children[i];
    if (c) parent.appendChild(c);
  }
  return parent;
};
export { appendChildren as add };

/** Position an overlay inside either an auto-layout or a regular parent.
 *
 * Figma only accepts `layoutPositioning = ABSOLUTE` when the parent actually
 * uses auto-layout. In a regular frame every child is already freely
 * positioned, so assigning x/y is both sufficient and the only valid API.
 */
const placeAbsolute = function <T extends SceneNode & LayoutMixin>(
  parent: ChildrenMixin,
  child: T,
  x: number,
  y: number,
): T {
  parent.appendChild(child);
  if ('layoutMode' in parent && parent.layoutMode !== 'NONE') {
    child.layoutPositioning = 'ABSOLUTE';
  }
  child.x = x; child.y = y;
  return child;
};
export { placeAbsolute as abs };

/** A rigid spacer of a known size — preferred over flexible auto-layout spacing
 *  wherever geometry matters, because the parent cannot stretch it. */
const createStrut = async function (w: number, h: number): Promise<FrameNode> {
  // A strut is the most common NaN carrier: its width is always a subtraction,
  // and a single unmeasured sibling turns the whole row into NaN.
  return createFrame({ name: 'strut', w: applySize(w, 'strut width', 'strut'), h: h });
};
export { createStrut as strut };
