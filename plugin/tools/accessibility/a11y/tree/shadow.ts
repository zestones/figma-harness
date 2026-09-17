import { ensureBuilt } from './ensure-built.ts';
import { focusGeometryIssues, type FocusGeometryNode } from '../../focus-geometry.ts';
import type {
  AddFinding,
  ContractTreeHarness,
  TreeNode,
} from './types.ts';

const { toHex } = require('../../../color/core/color.ts');
const {
  paintTokenName,
  variableIndex,
} = require('../../../color/core/token-values.ts');

interface ShadowOffender {
  fill: string;
  name: string;
  where: string;
}

/* Fail any elevated surface whose shadow is its only visible separator. */
export async function shadowOnly(
  harness: ContractTreeHarness,
  add: AddFinding,
): Promise<void> {
  await ensureBuilt(harness);
  const focus = harness.runtime.CONTRACT.designSystem.focus;
  const byId = variableIndex(harness.vars);
  const fillKey = (node: TreeNode | null | undefined): string | null => {
    const fill = (node?.fills || []).find((paint) =>
      paint.type === 'SOLID' && paint.visible !== false);
    if (!fill) return null;
    const token = paintTokenName(fill, byId);
    if (token) return token;
    if (!fill.color) return null;
    return toHex({
      r: fill.color.r * 255,
      g: fill.color.g * 255,
      b: fill.color.b * 255,
    });
  };
  const hasShadow = (node: TreeNode | null | undefined): boolean =>
    (node?.effects || []).some((effect) =>
      effect.type === 'DROP_SHADOW' && effect.visible !== false);
  const hasStroke = (node: TreeNode | null | undefined): boolean =>
    (node?.strokes || []).some((stroke) => stroke.visible !== false)
    || !!node?.children?.some(child =>
      focusGeometryIssues(child as FocusGeometryNode, node as FocusGeometryNode, focus).length === 0
      && child.strokes?.some(stroke => paintTokenName(stroke, byId) === focus.token));

  const offenders: ShadowOffender[] = [];
  let elevated = 0;
  const walk = (node: TreeNode, ground: string, where: string): void => {
    const own = fillKey(node);
    if (hasShadow(node)) {
      elevated++;
      if (!hasStroke(node) && own && ground && own === ground) {
        offenders.push({ name: node.name || node.type, fill: own, where });
      }
    }
    const next = own || ground;
    for (const child of node.children || []) walk(child, next, where);
  };
  for (const page of harness.pages) {
    for (const child of page.children || []) {
      walk(child, 'the Figma canvas', (page.name || '') + ' / ' + (child.name || ''));
    }
  }

  const unique = new Map<string, ShadowOffender>();
  for (const offender of offenders) {
    const key = offender.name + offender.fill;
    if (!unique.has(key)) unique.set(key, offender);
  }
  if (unique.size) {
    for (const offender of [...unique.values()].slice(0, 5)) {
      add(
        'FAIL',
        'elevation',
        `"${offender.name}" is separated only by its shadow`,
        `${offender.fill} on ${offender.fill}, no border — the edge measures under 1.4:1, so the surface has no boundary a reader can see. Give it a border or move it onto a different surface.`,
      );
    }
  } else {
    add(
      'note',
      'elevation',
      'no surface leans on its shadow',
      `${elevated} elevated node(s); every one of them also has a border or a different fill from what it sits on`,
    );
  }
}
