'use strict';

import type { AuditRule } from './types.ts';

const rule: AuditRule = {
  id: 'layout-lint',
  run({ runtime, pages, layout, verbose }) {
    console.log('\n--- layout lint ---');
    let issues = 0;
    for (const page of pages) {
      for (const top of page.children) {
        if (!top.children || !top.children.length) continue;
        layout(top);
        const report = runtime.lint(top, { tolerance: 1.5 });
        issues += report.issues.length;
        const heading = page.name + ' / ' + top.name;
        if (!report.issues.length) {
          console.log('  clean  ' + heading + '  (' + report.nodes + ' nodes)');
          continue;
        }
        console.log('  ' + String(report.issues.length).padStart(4) +
          ' issues in ' + heading + '  (' + report.nodes + ' nodes)');
        const byKind: Record<string, number> = {};
        for (const issue of report.issues) {
          byKind[issue.kind] = (byKind[issue.kind] || 0) + 1;
        }
        for (const kind of Object.keys(byKind)) {
          console.log('         ' + byKind[kind] + ' x ' + kind);
        }
        const shown = verbose ? report.issues : report.issues.slice(0, 6);
        for (const issue of shown) {
          console.log('         - ' + issue.node + '\n           ' + issue.detail);
        }
        if (!verbose && report.issues.length > 6) {
          console.log('         … ' + (report.issues.length - 6) + ' more (--verbose)');
        }
      }
    }
    return issues;
  },
};

module.exports = rule;
