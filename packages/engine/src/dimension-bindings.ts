/* Explicit numeric-variable references; token vocabulary belongs to foundations. */
import { V } from './figma-resources.ts';

export type DimensionField = 'width' | 'height' | 'itemSpacing' | 'counterAxisSpacing'
  | 'paddingTop' | 'paddingRight' | 'paddingBottom' | 'paddingLeft' | 'cornerRadius';

export interface DimensionReference {
  readonly variable: string;
  readonly value: number;
  readonly fields: readonly DimensionField[];
}

export type DimensionValue = number | DimensionReference;

export function dimensionValue(value: DimensionValue): number {
  return typeof value === 'number' ? value : value.value;
}

export function bindDimension(node: SceneNode, field: DimensionField, reference: DimensionValue | undefined): void {
  if (reference == null || typeof reference === 'number') return;
  if (!reference.fields.includes(field)) {
    throw new Error(reference.variable + ' cannot own ' + field + ' on "' + node.name + '"');
  }
  const variable = V[reference.variable];
  if (!variable || variable.resolvedType !== 'FLOAT') {
    throw new Error('missing numeric variable ' + reference.variable);
  }
  node.setBoundVariable(field, variable);
}

/** Bind a component whose internal arithmetic already resolved its dimensions. */
export function bindDimensions<T extends SceneNode>(node: T, fields: Partial<Record<DimensionField, DimensionReference>>): T {
  for (const field of Object.keys(fields) as DimensionField[]) bindDimension(node, field, fields[field]);
  return node;
}

/** A later variant must replace the old binding as well as the numeric value. */
export function setDimension(node: FrameNode, field: DimensionField, value: DimensionValue): void {
  if (typeof value !== 'number') { bindDimension(node, field, value); return; }
  if (!Number.isFinite(value) || value < 0) throw new Error('invalid ' + field + ' on "' + node.name + '"');
  node.setBoundVariable(field, null);
  if (field === 'width') node.resize(value, node.height);
  else if (field === 'height') node.resize(node.width, value);
  else node[field] = value;
}
