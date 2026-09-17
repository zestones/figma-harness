import { ensureBuilt } from './ensure-built.ts';
import { FIGMA_CANVAS_RGB } from '../../../core/figma-canvas.ts';
import type {
  AddFinding,
  ColorValue,
  TreeHarness,
  TreeNode,
} from './types.ts';

const { flatten, toHex, ratio } = require('../../../color/core/color.ts');
const {
  paintColorInfo,
  variableIndex,
} = require('../../../color/core/token-values.ts');

interface PaintInfo {
  c: ColorValue;
  name: string | null;
}

interface ContrastFailure {
  bg: string;
  ink: string;
  need: number;
  r: number;
  size: number;
  text: string;
  where: string;
}

/* WCAG 1.4.3 derived from rendered text and its actual opaque backdrop. */
export async function treeContrast(
  harness: TreeHarness,
  add: AddFinding,
): Promise<void> {
  await ensureBuilt(harness);
  const byId = variableIndex(harness.vars);
  /* A translucent paint is composited over what is behind it, as Figma
     paints it: the variable's alpha times the paint's opacity. */
  const paintOf = (
    node: TreeNode | null | undefined,
    which: 'fills' | 'strokes',
    behind: PaintInfo | null,
  ): PaintInfo | null => {
    const list = node?.[which] || [];
    for (const paint of list) {
      if (paint.type !== 'SOLID' || paint.visible === false) continue;
      const info = paintColorInfo(paint, byId, 255) as {
        color: ColorValue & { a: number };
        name: string | null;
      } | null;
      if (!info) return null;
      if (info.color.a >= 0.999) return { c: info.color, name: info.name };
      if (!behind) return null;
      return {
        c: flatten(info.color, behind.c),
        name: (info.name || toHex(info.color)) + ' over ' + (behind.name || toHex(behind.c)),
      };
    }
    return null;
  };

  const failures: ContrastFailure[] = [];
  let checked = 0;
  let waived = 0;
  let inactive = 0;
  const walk = (
    node: TreeNode,
    backdrop: PaintInfo | null,
    where: string,
    insideCounterExample: boolean,
    insideDisabled = false,
  ): void => {
    const counterExample = insideCounterExample
      || /counter-example/.test(String(node.name || ''));
    // WCAG 1.4.3 exempts the text of an inactive control.
    const disabled = insideDisabled || node.getPluginData?.('aria.disabled') === 'true';
    const own = node.type === 'TEXT' ? null : paintOf(node, 'fills', backdrop);
    if (node.type === 'TEXT') {
      const ink = paintOf(node, 'fills', backdrop);
      const characters = String(node.characters || '').trim();
      if (ink && backdrop && characters && counterExample) {
        waived++;
      } else if (ink && backdrop && characters && disabled) {
        inactive++;
      } else if (ink && backdrop && characters) {
        checked++;
        const size = node.fontSize || 12;
        const bold = /bold|semibold|black|heavy/i.test(String(node.fontName?.style || ''));
        const large = size >= 24 || (bold && size >= 18.66);
        const need = large ? 3 : 4.5;
        const measured = ratio(ink.c, backdrop.c);
        if (Math.round(measured * 100) / 100 < need) {
          failures.push({
            r: measured,
            need,
            size,
            ink: ink.name || toHex(ink.c),
            bg: backdrop.name || toHex(backdrop.c),
            text: characters.slice(0, 24),
            where,
          });
        }
      }
    }
    const next = own || backdrop;
    for (const child of node.children || []) walk(child, next, where, counterExample, disabled);
  };
  const pageBackdrop: PaintInfo = {
    c: FIGMA_CANVAS_RGB,
    name: 'the Figma canvas',
  };
  for (const page of harness.pages) {
    for (const child of page.children || []) {
      walk(
        child,
        pageBackdrop,
        (page.name || '') + ' / ' + (child.name || ''),
        false,
      );
    }
  }

  const distinct = new Map<string, ContrastFailure>();
  for (const failure of failures) {
    const key = failure.ink + ' on ' + failure.bg;
    const current = distinct.get(key);
    if (!current || current.r > failure.r) distinct.set(key, failure);
  }
  if (distinct.size) {
    for (const failure of [...distinct.values()].sort((left, right) => left.r - right.r)) {
      add(
        'FAIL',
        '1.4.3',
        `${failure.ink} on ${failure.bg}`,
        `${failure.r.toFixed(2)}:1, needs ${failure.need} at ${failure.size} px — e.g. "${failure.text}" in ${failure.where}`,
      );
    }
  } else {
    add(
      'note',
      '1.4.3',
      'every rendered text passes',
      `${checked} text nodes measured against the surface actually behind them`
      + (waived
        ? `, plus ${waived} inside frames named counter-example — deliberate bad specimens`
        : '')
      + (inactive ? `; ${inactive} texts of disabled controls are exempt` : ''),
    );
  }
}
