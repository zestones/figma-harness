/* Adversarial accessibility audit orchestration. Individual rules live under a11y/. */
'use strict';

import {
  colorTokenMap,
  type TokenVariable,
} from '../color/core/token-values.ts';
import { analyzeProjectColorOwnership } from '../color/core/token-source.ts';
import {
  createFindingCollector,
  reportFindings,
} from './a11y/findings.ts';
import {
  auditCategoricalSeparation,
  auditGeneratedCvd,
  auditTokenOwnership,
} from './a11y/rules/categorical.ts';
import {
  auditSurfaceContrast,
  type ColorLookup,
} from './a11y/rules/surface-contrast.ts';
import { createTreeAudits } from './a11y/tree-audits.ts';
import type { ContractTreeHarness } from './a11y/tree/types.ts';

interface A11yHarness extends ContractTreeHarness {
  vars: TokenVariable[];
}

const { createHarness } = require('../runtime/harness.ts') as {
  createHarness(): A11yHarness;
};

async function collect(stage: string): Promise<void> {
  await new Promise(resolve => setImmediate(resolve));
  global.gc?.();
  const memory = process.memoryUsage();
  console.log(
    `a11y ${stage}: heap ${(memory.heapUsed / 1024 / 1024).toFixed(1)} MiB`
    + ` · rss ${(memory.rss / 1024 / 1024).toFixed(1)} MiB`,
  );
}

async function run(): Promise<void> {
  const harness = createHarness();
  const {
    adjacency,
    controlFocus,
    shadowOnly,
    soleCarrierCheck,
    treeContrast,
  } = createTreeAudits(harness);

  await harness.buildAll();
  await collect('document');
  const colors = colorTokenMap(harness.vars);
  const color: ColorLookup = (token) => colors[token];
  const { add, findings } = createFindingCollector();
  const adjacentPairs = await adjacency();
  await collect('adjacency');

  const designSystem = harness.runtime.CONTRACT.designSystem;
  auditSurfaceContrast(color, add, designSystem);
  auditCategoricalSeparation(color, adjacentPairs, add, designSystem);
  await auditGeneratedCvd(colors, add, designSystem);
  auditTokenOwnership(analyzeProjectColorOwnership(designSystem), add);
  await collect('token rules');
  await treeContrast(add);
  await collect('text contrast');
  await controlFocus(add);
  await collect('focus');
  await shadowOnly(add);
  await collect('elevation');
  await soleCarrierCheck(add);
  await collect('colour carriers');

  const failures = reportFindings(findings);
  process.exit(failures ? 1 : 0);
}

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
