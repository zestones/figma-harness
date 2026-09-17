'use strict';

import { labPageName } from '@figma-harness/contract';
import type { AuditRule } from './types.ts';

const rule: AuditRule = {
  id: 'spacing-ramp',
  run({ pages, runtime }) {
    const scale = runtime.CONTRACT.designSystem.spacingScale;
    const spacingScale = new Set(scale);
    const labPage = labPageName(runtime.CONTRACT.workspace);
    const offScale = new Map<string, number>();
    let seen = 0;
    for (const page of pages) {
      // The lab deliberately explores values outside the shipping system.
      if (page.name === labPage) continue;
      for (const top of page.children) {
        for (const node of [top, ...top.findAll(() => true)]) {
          if (!node.children || !node.children.length) continue;
          const values: ReadonlyArray<readonly [string, number | undefined]> = [
            ['itemSpacing', node.itemSpacing],
            ['counterAxisSpacing', node.layoutWrap === 'WRAP' ? node.counterAxisSpacing : 0],
            ['paddingTop', node.paddingTop],
            ['paddingRight', node.paddingRight],
            ['paddingBottom', node.paddingBottom],
            ['paddingLeft', node.paddingLeft],
          ];
          for (const [property, raw] of values) {
            const value = Math.round(raw || 0);
            seen++;
            if (spacingScale.has(value)) continue;
            const key = value + ' (' + property + ') on "' + node.name + '"';
            offScale.set(key, (offScale.get(key) || 0) + 1);
          }
        }
      }
    }

    console.log('\n--- spacing ramp ---');
    if (!offScale.size) {
      console.log('  ' + seen +
        ' rendered spacing values on the system pages, all on the ' +
        scale.filter((value) => value > 0).join('/') + ' scale (the design lab is exempt by design)');
      return 0;
    }

    let issues = 0;
    for (const count of offScale.values()) issues += count;
    console.log('  ' + issues + ' OFF-SCALE of ' + seen + ':');
    const ranked = [...offScale.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14);
    for (const [key, count] of ranked) {
      console.log('   - ' + key + (count > 1 ? '  x' + count : ''));
    }
    return issues;
  },
};

module.exports = rule;
