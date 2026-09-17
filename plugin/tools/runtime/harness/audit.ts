'use strict';

import { printMeasurement } from './measure.ts';
import type {
  AuditContext,
  AuditHarness,
  AuditRuntime,
  AuditRule,
} from './rules/types.ts';

const { AUDIT_RULES } = require('./rules/index.ts') as {
  AUDIT_RULES: readonly AuditRule[];
};
const { errorMessage, errorStack } = require('../../core/errors.ts') as {
  errorMessage(error: unknown): string;
  errorStack(error: unknown): string;
};

export interface AuditOptions {
  args?: string[];
  root: string;
  verbose?: boolean;
}

export interface AuditResult {
  failures: number;
  issues: number;
  ok: boolean;
}

async function buildRegisteredPages(runtime: AuditRuntime): Promise<number> {
  const builders = Object.keys(runtime.BUILDERS);
  if (!builders.length) throw new Error('no builders registered on HARNESS_API.BUILDERS');

  let failures = 0;
  for (const name of builders) {
    try {
      await runtime.BUILDERS[name]();
      console.log('  built  ' + name);
    } catch (error: unknown) {
      failures++;
      console.log('  FAILED ' + name + ' -> ' + errorMessage(error));
      console.log(errorStack(error).split('\n').slice(1, 5).join('\n'));
    }
  }
  return failures;
}

export async function runAudit(
  harness: AuditHarness,
  options: AuditOptions,
): Promise<AuditResult> {
  const startedAt = Date.now();
  const { runtime, pages } = harness;

  await runtime.loadFonts();
  await runtime.ensureTokens();
  const failures = await buildRegisteredPages(runtime);

  const context: AuditContext = {
    runtime,
    pages,
    layout: harness.layout,
    solveLayout: harness.solveLayout,
    store: harness.store,
    stress: harness.stress,
    created: harness.created,
    nodeById: harness.nodeById,
    root: options.root,
    verbose: Boolean(options.verbose),
  };

  let issues = 0;
  for (const rule of AUDIT_RULES) {
    const result = await rule.run(context);
    if (!Number.isInteger(result) || result < 0) {
      throw new Error(
        'Harness audit rule "' + rule.id
        + '" returned an invalid issue count: ' + result,
      );
    }
    issues += result;
  }

  const args = options.args || [];
  const measureArgument = args.find((argument) => argument.startsWith('--measure='));
  printMeasurement(pages, measureArgument?.slice('--measure='.length));

  console.log('\npages: ' + pages.map((page) =>
    page.name + '(' + page.children.length + ')').join(', '));
  console.log('time: ' + ((Date.now() - startedAt) / 1000).toFixed(1) + 's');
  if (failures || issues) {
    console.log('\nRESULT: ' + failures + ' build failure(s), ' + issues + ' layout issue(s)');
    return { ok: false, failures, issues };
  }
  console.log('\nRESULT: clean');
  return { ok: true, failures: 0, issues: 0 };
}
