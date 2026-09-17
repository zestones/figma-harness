import { validateToolingHygiene } from './tooling-hygiene.ts';

const report = validateToolingHygiene();
if (report.violations.length) {
  for (const issue of report.violations) {
    console.error(`${issue.file}:${issue.line}: ${issue.message}`);
  }
  process.exit(1);
}
console.log(
  `tooling hygiene: clean (${report.toolFiles} reachable modules, `
  + `${report.cloneCandidates} non-trivial function bodies unique)`,
);
