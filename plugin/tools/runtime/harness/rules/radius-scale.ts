import { focusGeometryIssues } from '../../../accessibility/focus-geometry.ts';
import { labPageName, type HarnessContract } from '../contract.ts';
import type { MockNode } from '../figma-mock/types.ts';
import type { AuditRule } from './types.ts';

export interface RadiusAudit {
  /** Nodes accepted by each declared exception, by label. */
  exceptions: Map<string, number>;
  focusOutlines: number;
  fullyRounded: number;
  issues: Map<string, number>;
  seen: number;
}

export function inspectRadii(
  pages: readonly MockNode[],
  contract: HarnessContract,
): RadiusAudit {
  const scale = new Set<number>(contract.designSystem.radiusScale);
  const focus = contract.designSystem.focus;
  const labPage = labPageName(contract.workspace);
  const exceptions = contract.document.radiusExceptions;
  const result: RadiusAudit = {
    seen: 0,
    fullyRounded: 0,
    exceptions: new Map(exceptions.map((exception) => [exception.label, 0])),
    focusOutlines: 0,
    issues: new Map(),
  };
  for (const page of pages) {
    if (page.name === labPage) continue;
    for (const node of page.findAll(() => true)) {
      const radius = node.cornerRadius;
      if (radius === undefined) continue;
      result.seen++;
      if (Number.isFinite(radius) && radius >= 0) {
        if (scale.has(radius)) continue;
        if (node.parent && focusGeometryIssues(node, node.parent, focus).length === 0) {
          result.focusOutlines++;
          continue;
        }
        // Dots, pips, and thin bars can derive fractional radii from geometry.
        const diameter = Math.min(node.width, node.height);
        if (Number.isFinite(diameter) && diameter > 0 && radius >= diameter / 2) {
          result.fullyRounded++;
          continue;
        }
        const exception = exceptions.find((candidate) =>
          page.name === contract.workspace.pages[candidate.page] && candidate.matches(node));
        if (exception) {
          result.exceptions.set(exception.label, (result.exceptions.get(exception.label) || 0) + 1);
          continue;
        }
      }
      const key = String(radius) + ' px on "' + node.name + '" in ' + page.name;
      result.issues.set(key, (result.issues.get(key) || 0) + 1);
    }
  }
  return result;
}

export const radiusScale: AuditRule = {
  id: 'radius-scale',
  run({ pages, runtime }) {
    const result = inspectRadii(pages, runtime.CONTRACT);
    console.log('\n--- radius scale ---');
    const issues = [...result.issues.values()].reduce((sum, count) => sum + count, 0);
    console.log('  ' + result.seen + ' corner radii checked; ' + issues + ' off-scale');
    console.log('  Exceptions: ' + result.fullyRounded + ' geometric round marks; '
      + [...result.exceptions].map(([label, count]) => count + ' ' + label + '; ').join('')
      + result.focusOutlines + ' derived focus outlines; ' + labPageName(runtime.CONTRACT.workspace).replace(/^\d+ · /, '') + ' exempt');
    for (const [key, count] of [...result.issues.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14)) {
      console.log('   - ' + key + (count > 1 ? '  x' + count : ''));
    }
    return issues;
  },
};
