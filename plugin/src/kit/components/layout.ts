/* Components: component sizing and distribution. */



/** The strut width for a row, read from the row itself.
 *
 *  Preferred over strutForNodes: passing the gap and padding as literals means
 *  they must stay in sync with the frame's own values, and they will not. This
 *  reads width, padding and itemSpacing off the node, so the arithmetic cannot
 *  drift when a spacing token changes.
 */
export const strutForRow = function (
  row: FrameNode,
  nodes: readonly LayoutMixin[],
): number {
  // Reject the old three-argument shape loudly. Passing a gap here where the
  // node list belongs makes `nodes.length` undefined and the width NaN, and
  // Figma reports that 200 lines later as an opaque resize failure.
  if (!nodes || typeof nodes.length !== 'number' || typeof nodes === 'number') {
    throw new Error('strutForRow(row, nodes): expected an array of nodes, got ' + typeof nodes +
      ' on "' + row.name + '". The gap is read off the row.');
  }
  const gap = row.itemSpacing || 0;
  const childCount = nodes.length + 1;
  let fixedWidth = 0;
  for (const node of nodes) fixedWidth += node.width;
  return Math.max(1, row.width - (row.paddingLeft || 0) - (row.paddingRight || 0)
    - (childCount - 1) * gap - fixedWidth);
};

/** The vertical twin: how much height is left in `col` after the children it
 *  already holds, plus `reserve` for children not yet appended. Same contract
 *  as strutForRow — every number is read off the node, none is copied. */
export const strutForCol = function (
  column: FrameNode,
  upcoming: readonly LayoutMixin[] = [],
  reserve = 0,
): number {
  const gap = column.itemSpacing || 0;
  let usedHeight = 0;
  for (const child of column.children) usedHeight += child.height;
  for (const child of upcoming) usedHeight += child.height;
  const childCount = column.children.length + upcoming.length + 1;
  return column.height - (column.paddingTop || 0) - (column.paddingBottom || 0)
    - (childCount - 1) * gap - usedHeight - reserve;
};

/** Widen fixed-width children of a horizontal row until they exactly fill `w`.
 *  Used instead of FILL so the resulting widths are known and lintable. */
export const spread = function (row: FrameNode, width: number): FrameNode {
  const children = row.children.filter(function (
    child,
  ): child is SceneNode & LayoutMixin {
    return 'layoutPositioning' in child
      && 'resize' in child
      && child.layoutPositioning !== 'ABSOLUTE';
  });
  if (!children.length) return row;
  let usedWidth = (row.paddingLeft || 0) + (row.paddingRight || 0)
    + (children.length - 1) * (row.itemSpacing || 0);
  for (const child of children) usedWidth += child.width;
  const leftover = width - usedWidth;
  if (leftover <= 0) return row;
  const each = Math.floor(leftover / children.length);
  const remainder = leftover - each * children.length;
  for (let index = 0; index < children.length; index++) {
    const child = children[index];
    const extra = each + (index === children.length - 1 ? remainder : 0);
    child.resize(child.width + extra, child.height);
  }
  return row;
};
