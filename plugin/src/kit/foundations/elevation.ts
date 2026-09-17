/* Effect styles: Primer's shadows, layer for layer, named by their token path. */

import { hex } from '../../engine/figma-resources.ts';
import { PRIMER_SHADOWS } from './primer.generated.ts';

export type ShadowName = typeof PRIMER_SHADOWS[number][0];

export interface ElevationStyle {
  readonly description: string;
  readonly effects: readonly Effect[];
  readonly name: ShadowName;
}

export const ELEVATION: readonly ElevationStyle[] = Object.freeze(PRIMER_SHADOWS.map(([name, layers, description]) => Object.freeze({
  name,
  description,
  effects: Object.freeze(layers.map((layer): Effect => ({
    type: layer.inset ? 'INNER_SHADOW' : 'DROP_SHADOW',
    color: hex(layer.color) as RGBA,
    offset: { x: layer.x, y: layer.y },
    radius: layer.blur,
    spread: layer.spread,
    visible: true,
    blendMode: 'NORMAL',
  }))),
})));

