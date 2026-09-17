/* Runtime: generated-tree layout validation. */

interface LintNode {
  characters?: unknown;
  children?: readonly LintNode[];
  clipsContent?: boolean;
  counterAxisSizingMode?: string;
  height: number;
  itemSpacing?: number;
  layoutMode?: string;
  layoutPositioning?: string;
  layoutWrap?: string;
  name: string;
  overflowDirection?: string;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  parent?: LintNode | null;
  primaryAxisSizingMode?: string;
  textAutoResize?: string;
  textTruncation?: string;
  type: string;
  width: number;
  x: number;
  y: number;
}

export interface LayoutLintIssue {
  detail: string;
  kind: string;
  node: string;
}

export interface LayoutLintOptions {
  tolerance?: number;
}

export interface LayoutLintReport {
  issues: LayoutLintIssue[];
  nodes: number;
}
/* --- the layout linter ---------------------------------------------------- *
 * Walks a finished tree and reports every place the geometry does not add up.
 * This is what replaces "look at it and hope".
 * ------------------------------------------------------------------------- */

export const lint = function (
  root: SceneNode,
  opts: LayoutLintOptions = {},
): LayoutLintReport {
  var rootNode = root as unknown as LintNode;
  var tol = (opts && opts.tolerance) || 0.75;
  var issues: LayoutLintIssue[] = [];
  var seen = 0;

  var pathOf = function (n: LintNode): string {
    var parts: string[] = [];
    var cur: LintNode | null | undefined = n;
    var guard = 0;
    while (cur && guard++ < 24) {
      parts.unshift(cur.name);
      if (cur === rootNode) break;
      cur = cur.parent;
    }
    return parts.join(' / ');
  };

  // Text nodes have no children in Figma, so they are checked from their parent.
  var checkText = function (k: LintNode): void {
    if (k.width < 1) {
      issues.push({ kind: 'zero-width-text', node: pathOf(k), detail: 'characters: ' + String(k.characters).slice(0, 40) });
    }
    if (k.textAutoResize === 'NONE' && k.textTruncation !== 'ENDING') {
      issues.push({
        kind: 'untruncated-fixed-text', node: pathOf(k),
        detail: 'a fixed text box without truncation draws extra lines outside itself: '
          + String(k.characters).slice(0, 40),
      });
    }
  };

  var walk = function (n: LintNode): void {
    seen++;
    var kids = n.children || [];
    var flowKids: LintNode[] = [];
    for (var i = 0; i < kids.length; i++) {
      var k = kids[i];
      if (k.type === 'TEXT') checkText(k);
      if (k.layoutPositioning === 'ABSOLUTE') {
        // Absolute children must stay inside a clipping parent.
        if (n.clipsContent) {
          if (k.x < -tol || k.y < -tol ||
              k.x + k.width > n.width + tol || k.y + k.height > n.height + tol) {
            issues.push({
              kind: 'absolute-outside-clip', node: pathOf(k),
              detail: 'x=' + k.x.toFixed(1) + ' y=' + k.y.toFixed(1) +
                ' size=' + k.width.toFixed(1) + 'x' + k.height.toFixed(1) +
                ' parent=' + n.width.toFixed(1) + 'x' + n.height.toFixed(1),
            });
          }
        }
      } else {
        flowKids.push(k);
      }
    }

    if (n.layoutMode === 'HORIZONTAL' || n.layoutMode === 'VERTICAL') {
      var horiz = n.layoutMode === 'HORIZONTAL';
      var padA = horiz ? (n.paddingLeft || 0) : (n.paddingTop || 0);
      var padB = horiz ? (n.paddingRight || 0) : (n.paddingBottom || 0);
      var gaps = Math.max(0, flowKids.length - 1) * (n.itemSpacing || 0);
      var sum = 0;
      var crossMax = 0;
      for (var j = 0; j < flowKids.length; j++) {
        sum += horiz ? flowKids[j].width : flowKids[j].height;
        crossMax = Math.max(crossMax, horiz ? flowKids[j].height : flowKids[j].width);
      }
      var needed = padA + padB + gaps + sum;
      var have = horiz ? n.width : n.height;
      var fixedMain = horiz
        ? (n.primaryAxisSizingMode === 'FIXED')
        : (n.primaryAxisSizingMode === 'FIXED');
      var od = n.overflowDirection || 'NONE';
      var scrolls = horiz
        ? (od === 'HORIZONTAL' || od === 'BOTH')
        : (od === 'VERTICAL' || od === 'BOTH');
      if (fixedMain && !n.layoutWrap && !scrolls && needed > have + tol) {
        issues.push({
          kind: 'main-axis-overflow', node: pathOf(n),
          detail: (horiz ? 'width' : 'height') + ' needs ' + needed.toFixed(1) +
            ' but has ' + have.toFixed(1) + ' (' + flowKids.length + ' children, gap ' +
            (n.itemSpacing || 0) + ', pad ' + padA + '/' + padB + ')',
        });
      }
      var crossPadA = horiz ? (n.paddingTop || 0) : (n.paddingLeft || 0);
      var crossPadB = horiz ? (n.paddingBottom || 0) : (n.paddingRight || 0);
      var crossHave = horiz ? n.height : n.width;
      var crossFixed = n.counterAxisSizingMode === 'FIXED';
      if (crossFixed && crossMax + crossPadA + crossPadB > crossHave + tol) {
        issues.push({
          kind: 'cross-axis-overflow', node: pathOf(n),
          detail: (horiz ? 'height' : 'width') + ' needs ' +
            (crossMax + crossPadA + crossPadB).toFixed(1) + ' but has ' + crossHave.toFixed(1),
        });
      }
    }

    for (var m = 0; m < kids.length; m++) if (kids[m].children) walk(kids[m]);
  };

  walk(rootNode);
  return { nodes: seen, issues: issues };
};
