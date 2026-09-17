import { focusExtent, focusGeometryIssues, type FocusGeometryNode } from '../../focus-geometry.ts';
import { flatten, ratio, simulate, type Color, type ColorAlpha } from '../../../color/core/color.ts';
import { paintColorInfo, paintTokenName, variableIndex, type TokenVariable } from '../../../color/core/token-values.ts';
import { FIGMA_CANVAS_RGB } from '../../../core/figma-canvas.ts';
import { ensureBuilt } from './ensure-built.ts';
import type { AddFinding, ContractTreeHarness, TreeNode, TreePaint } from './types.ts';

interface FocusNode extends TreeNode {
  children: FocusNode[];
  clipsContent?: boolean;
  getPluginData?(key: string): string;
  height: number;
  name: string;
  opacity?: number;
  visible?: boolean;
  width: number;
  x: number;
  y: number;
}
interface Clip { node: FocusNode; x: number; y: number; }

const VISIONS = ['protanopia', 'deuteranopia', 'tritanopia'] as const;

/* The pixels an outline replaces, by how far it extends past its control:
   inset rings cover the control's edge and fill, a ring across the border
   covers the ground and the edge, and anything further out covers ground. */
const coveredSurfaces = function (extent: number, outside: Color, inside: Color, edge: Color | null, band: Color | null): Color[] {
  if (band) return [band];
  if (extent <= 0) return edge ? [inside, edge] : [inside];
  if (extent === 1) return edge ? [outside, edge] : [outside, inside];
  return [outside];
};

/** Primer's outlines must exist in the rendered tree where each component
 * places them, reach 3:1 against every pixel they replace in all four vision
 * conditions, and survive every clipping ancestor. */
export async function controlFocus(harness: ContractTreeHarness, add: AddFinding): Promise<void> {
  await ensureBuilt(harness);
  const FOCUS = harness.runtime.CONTRACT.designSystem.focus;
  const exemptions = harness.runtime.CONTRACT.document.focusStrokeExemptions;
  const geometry = harness as ContractTreeHarness & {
    layout?(node: FocusNode): void;
    solveLayout?(node: FocusNode): void;
  };
  const variables = variableIndex(harness.vars as TokenVariable[]);
  let checked = 0;
  let failed = 0;
  const placements = new Map<number, number>();
  const fail = (subject: string, detail: string): void => {
    failed++;
    add('FAIL', '2.4.13', subject, detail);
  };
  const solid = (paints: readonly TreePaint[] | undefined): { info: ColorAlpha; name: string | null; paint: TreePaint } | null => {
    const paint = paints?.find((candidate) => candidate.type === 'SOLID' && candidate.visible !== false);
    const info = paint && paintColorInfo(paint, variables, 255);
    return paint && info ? { info: info.color, name: info.name, paint } : null;
  };
  const walk = (node: FocusNode, ground: Color, x: number, y: number, clips: Clip[], opacity: number): void => {
    if (node.visible === false) return;
    geometry.solveLayout?.(node);
    x += node.x || 0;
    y += node.y || 0;
    opacity *= node.opacity ?? 1;
    const fill = solid(node.fills);
    const inside = fill ? flatten({ ...fill.info, a: fill.info.a * opacity }, ground) : ground;
    const focused = node.getPluginData?.(FOCUS.specimenKey) === FOCUS.specimenValue;
    if (focused) {
      checked++;
      const rings = node.children.filter((child) => child.name === FOCUS.ringName);
      const bands = node.children.filter((child) => child.name === FOCUS.bandName);
      const extent = focusExtent(node as FocusGeometryNode, FOCUS);
      if (rings.length !== 1) fail(node.name, 'A focused control must have exactly one focus ring.');
      if (bands.length > 1) fail(node.name, 'A focused control has at most one focus band.');
      if (extent == null) fail(node.name, 'The focused control declares no known focus placement.');
      else placements.set(extent, (placements.get(extent) || 0) + 1);
      let bandColor: Color | null = null;
      for (const band of bands) {
        const issues = focusGeometryIssues(band as FocusGeometryNode, node as FocusGeometryNode, FOCUS);
        if (issues.length) fail(node.name, 'band: ' + issues.join('; '));
        const stroke = solid(band.strokes);
        if (!stroke || stroke.name !== FOCUS.band.token) fail(node.name, 'The focus band must bind ' + FOCUS.band.token + '.');
        else bandColor = flatten(stroke.info, inside);
      }
      // A control whose edge changes on focus declares its resting edge.
      const restEdge = node.getPluginData?.(FOCUS.restEdgeKey) || '';
      const restVariable = restEdge ? (harness.vars as TokenVariable[]).find((variable) => variable.name === restEdge) : null;
      const edgePaint = restVariable
        ? solid([{ type: 'SOLID', boundVariables: { color: { id: restVariable.id } } } as TreePaint])
        : solid(node.strokes);
      if (restEdge && !restVariable) fail(node.name, 'The resting edge ' + restEdge + ' is not a declared token.');
      const edge = edgePaint ? flatten(edgePaint.info, inside) : null;
      for (const ring of rings) {
        const issues = focusGeometryIssues(ring as FocusGeometryNode, node as FocusGeometryNode, FOCUS);
        if (issues.length) fail(node.name, issues.join('; '));
        const stroke = solid(ring.strokes);
        if (!stroke || stroke.name !== FOCUS.token) {
          fail(node.name, 'The outline must bind ' + FOCUS.token + '.');
          continue;
        }
        const alpha = opacity * (ring.opacity ?? 1) * stroke.info.a;
        for (const surface of coveredSurfaces(extent ?? 0, ground, inside, edge, bandColor)) {
          const outline = flatten({ ...stroke.info, a: alpha }, surface);
          const measured = [ratio(outline, surface),
            ...VISIONS.map((vision) => ratio(simulate(outline, vision), simulate(surface, vision)))];
          if (Math.min(...measured) < 3) {
            fail(node.name, 'Outline contrast falls to ' + Math.min(...measured).toFixed(2) + ':1 against a pixel it replaces.');
            break;
          }
        }
        if ((extent ?? 0) <= 0) continue;
        for (const clip of clips) {
          if (x + ring.x < clip.x - 0.01 || y + ring.y < clip.y - 0.01
            || x + ring.x + ring.width > clip.x + clip.node.width + 0.01
            || y + ring.y + ring.height > clip.y + clip.node.height + 0.01) {
            fail(node.name, 'The outline is clipped by ' + clip.node.name + '.');
            break;
          }
        }
      }
    }
    for (const stroke of node.strokes || []) {
      if (paintTokenName(stroke, variables) !== FOCUS.token) continue;
      const exempt = exemptions.some((matches) => matches(node as unknown as Parameters<typeof matches>[0]));
      if (node.name !== FOCUS.ringName && !exempt) {
        fail(node.name, 'A direct focus stroke touches the control; use the separate outline.');
      }
    }
    const nextClips = node.clipsContent ? clips.concat({ node, x, y }) : clips;
    for (const child of node.children || []) walk(child, inside, x, y, nextClips, opacity);
  };
  for (const page of harness.pages) {
    for (const child of page.children || []) {
      geometry.layout?.(child as FocusNode);
      walk(child as FocusNode, FIGMA_CANVAS_RGB, 0, 0, [], 1);
    }
  }
  if (!checked) fail('control focus', 'No rendered focus control was inspected.');
  if (!failed) {
    const kinds = [...placements].sort((a, b) => a[0] - b[0])
      .map(([extent, count]) => count + ' at ' + (extent - FOCUS.width) + ' px offset').join(', ');
    add('note', '2.4.13', 'control focus follows Primer',
      `${checked} controls (${kinds}): each outline is where its placement puts it, unclipped, and at least 3:1 against every pixel it replaces in all four vision conditions.`);
  }
}
