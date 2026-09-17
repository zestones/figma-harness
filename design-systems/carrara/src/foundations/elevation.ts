/* Shadows, installed as effect styles. A shadow only suggests height: every
 * raised surface also keeps a border (the elevation audit checks it). */

import { hex } from '@figma-harness/engine';

export interface ShadowLayer {
  readonly blur: number;
  readonly color: string;
  readonly spread: number;
  readonly x: number;
  readonly y: number;
}

const style = function (name: string, description: string, layers: readonly ShadowLayer[]) {
  return Object.freeze({
    name,
    description,
    effects: Object.freeze(layers.map((layer): Effect => ({
      type: 'DROP_SHADOW',
      color: hex(layer.color) as RGBA,
      offset: { x: layer.x, y: layer.y },
      radius: layer.blur,
      spread: layer.spread,
      visible: true,
      blendMode: 'NORMAL',
    }))),
  });
};

export const ELEVATION = Object.freeze([
  style('shadow/xs', 'Buttons and fields.', [{ x: 0, y: 1, blur: 2, spread: 0, color: '#1018280D' }]),
  style('shadow/sm', 'Cards and tables.', [
    { x: 0, y: 1, blur: 3, spread: 0, color: '#1018281A' },
    { x: 0, y: 1, blur: 2, spread: 0, color: '#1018280F' },
  ]),
  style('shadow/lg', 'Menus and popovers.', [
    { x: 0, y: 12, blur: 16, spread: -4, color: '#10182814' },
    { x: 0, y: 4, blur: 6, spread: -2, color: '#10182808' },
  ]),
  style('shadow/xl', 'Dialogs.', [
    { x: 0, y: 20, blur: 24, spread: -4, color: '#10182814' },
    { x: 0, y: 8, blur: 8, spread: -4, color: '#10182808' },
  ]),
] as const);

export type ShadowName = typeof ELEVATION[number]['name'];

/** The darkest layer of each shadow, for the elevation report. */
export const SHADOW_ALPHAS: ReadonlyArray<readonly [ShadowName, number]> = Object.freeze([
  ['shadow/xs', 0.05], ['shadow/sm', 0.1], ['shadow/lg', 0.08], ['shadow/xl', 0.08],
] as const);
