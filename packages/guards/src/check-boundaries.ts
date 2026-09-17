'use strict';

const { validateSourceGraph } = require('./boundaries.ts');

const report = validateSourceGraph();
if (report.violations.length) {
  console.error('architecture: ' + report.violations.length + ' violation(s)');
  for (const violation of report.violations) {
    console.error('  ' + violation.file + ':' + violation.line + '  ' + violation.message);
  }
  process.exit(1);
}

console.log('architecture: clean (' + report.files + ' modules, public authoring boundaries enforced)');
