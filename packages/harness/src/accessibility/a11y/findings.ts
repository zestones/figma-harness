import type { AddFinding } from './tree/types.ts';

export type Severity = 'FAIL' | 'WARN' | 'note';

export interface Finding {
  detail: string;
  rule: string;
  severity: Severity;
  subject: string;
}

export interface FindingCollector {
  add: AddFinding;
  findings: Finding[];
}

export function createFindingCollector(): FindingCollector {
  const findings: Finding[] = [];
  return {
    findings,
    add: (severity, rule, subject, detail): void => {
      findings.push({ detail, rule, severity, subject });
    },
  };
}

export function reportFindings(findings: Finding[]): number {
  const order: Record<Severity, number> = { FAIL: 0, WARN: 1, note: 2 };
  findings.sort((first, second) =>
    order[first.severity] - order[second.severity]
    || first.rule.localeCompare(second.rule));

  const counts: Record<Severity, number> = { FAIL: 0, WARN: 0, note: 0 };
  console.log('\n--- adversarial accessibility audit ---\n');
  for (const finding of findings) {
    counts[finding.severity]++;
    const tag = finding.severity === 'FAIL'
      ? 'FAIL'
      : finding.severity === 'WARN' ? 'WARN' : ' -  ';
    console.log(`${tag}  ${finding.rule.padEnd(12)} ${finding.subject}`);
    console.log(`      ${finding.detail}`);
  }
  console.log(`\n${counts.FAIL} failing · ${counts.WARN} warnings · ${counts.note} notes`);
  return counts.FAIL;
}
