/* Component families that must appear on a documentation sheet, recognised
 * by the layer names their builders emit. */

export const COMPONENT_INVENTORY: ReadonlyArray<readonly [family: string, nodeName: RegExp]> = Object.freeze([
  ['Button', /^button\//],
  ['Badge', /^badge\//],
  ['Card', /^card$/],
  ['ListRow', /^list-row\//],
]);
