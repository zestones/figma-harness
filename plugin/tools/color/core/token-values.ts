'use strict';

import type { Color, ColorAlpha } from './color.ts';

export interface TokenVariable {
  id: string;
  name: string;
  valuesByMode: Readonly<Record<string, unknown>>;
}

export interface BoundColorPaint {
  boundVariables?: { color?: { id: string } };
  color?: Color;
  opacity?: number;
}

export type VariableLookup =
  | readonly TokenVariable[]
  | ReadonlyMap<string, TokenVariable>;

export interface PaintColorInfo {
  /** The paint's colour, with the variable's alpha times the paint opacity. */
  color: ColorAlpha;
  name: string | null;
}

function isColor(value: unknown): value is Color & { a?: number } {
  return !!value
    && typeof value === 'object'
    && typeof (value as { r?: unknown }).r === 'number'
    && typeof (value as { g?: unknown }).g === 'number'
    && typeof (value as { b?: unknown }).b === 'number';
}

export function firstModeValue(variable?: TokenVariable | null): unknown {
  if (!variable) return undefined;
  const modes = Object.keys(variable.valuesByMode);
  return modes.length ? variable.valuesByMode[modes[0]] : undefined;
}

export function variableIndex(
  variables: readonly TokenVariable[] = [],
): Map<string, TokenVariable> {
  return new Map((variables || []).map((variable) => [variable.id, variable]));
}

export function findBoundVariable(
  paint: BoundColorPaint | null | undefined,
  variables: VariableLookup,
): TokenVariable | null {
  const binding = paint?.boundVariables?.color;
  if (!binding) return null;
  if ('get' in variables) return variables.get(binding.id) || null;
  return variables.find((variable) => variable.id === binding.id) || null;
}

export function paintTokenName(
  paint: BoundColorPaint | null | undefined,
  variables: VariableLookup,
): string | null {
  const variable = findBoundVariable(paint, variables);
  return variable ? variable.name : null;
}

/** A paint's colour (channels 0–1) and its effective alpha. */
export function resolvePaintColor(
  paint: BoundColorPaint | null | undefined,
  variables: VariableLookup,
): ColorAlpha | null | undefined {
  if (!paint) return null;
  const variable = findBoundVariable(paint, variables);
  const value = variable ? firstModeValue(variable) : null;
  const color = isColor(value) ? value : paint.color;
  if (!color) return color;
  const alpha = ('a' in color && typeof color.a === 'number' ? color.a : 1) * (paint.opacity == null ? 1 : paint.opacity);
  return { r: color.r, g: color.g, b: color.b, a: alpha };
}

export function paintColorInfo(
  paint: BoundColorPaint | null | undefined,
  variables: VariableLookup,
  scale?: number,
): PaintColorInfo | null {
  if (!paint) return null;
  const variable = findBoundVariable(paint, variables);
  const value = variable ? firstModeValue(variable) : null;
  const color = isColor(value) ? value : paint.color;
  if (!color || !isColor(color)) return null;
  const factor = scale == null ? 1 : scale;
  const alpha = (typeof color.a === 'number' ? color.a : 1) * (paint.opacity == null ? 1 : paint.opacity);
  return {
    color: { r: color.r * factor, g: color.g * factor, b: color.b * factor, a: alpha },
    name: variable && isColor(value) ? variable.name : null,
  };
}

export function colorTokenMap(
  variables: readonly TokenVariable[] = [],
  scale?: number,
): Record<string, ColorAlpha> {
  const factor = scale == null ? 255 : scale;
  const colors: Record<string, ColorAlpha> = {};
  for (const variable of variables) {
    const value = firstModeValue(variable);
    if (isColor(value)) {
      colors[variable.name] = {
        r: value.r * factor,
        g: value.g * factor,
        b: value.b * factor,
        a: typeof value.a === 'number' ? value.a : 1,
      };
    }
  }
  return colors;
}
