/* Runtime: basic shape primitives. */

import { P as tokenPaint } from '../../engine/figma-resources.ts';
import { size as applySize } from '../../engine/node-factory.ts';
import type { ColorToken } from '../foundations/colors.ts';

/** A filled circle, for status and legend marks. */
export const dot = function (token: ColorToken, size = 8): EllipseNode {
  const ellipse = figma.createEllipse();
  ellipse.name = 'dot';
  ellipse.resize(size, size);
  ellipse.fills = [tokenPaint(token)];
  return ellipse;
};

/** A filled rectangle. Shape fills accept Primer's foreground tokens too. */
export const rect = function (
  name: string,
  width: number,
  height: number,
  token: ColorToken | null,
  radius?: number,
): RectangleNode {
  const rectangle = figma.createRectangle();
  rectangle.name = name;
  rectangle.resize(applySize(width, 'width', name), applySize(height, 'height', name));
  rectangle.fills = token ? [tokenPaint(token)] : [];
  if (radius != null) rectangle.cornerRadius = radius;
  return rectangle;
};
