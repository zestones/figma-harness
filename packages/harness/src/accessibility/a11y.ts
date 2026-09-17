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
import type { WorkspacePackage } from '../core/workspace.ts';
import type { ContractTreeHarness } from './a11y/tree/types.ts';

export interface A11yHarness extends ContractTreeHarness {
  buildAll(): Promise<unknown>;
  readonly composition: { readonly designSystem: WorkspacePackage };
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

/** Build the document and run every accessibility rule. Returns the failure count. */
async function auditAccessibility(harness: A11yHarness): Promise<number> {
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
  await auditGeneratedCvd(colors, add, designSystem, harness.composition.designSystem);
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

  return reportFindings(findings);
}

if (require.main === module) {
  auditAccessibility(createHarness()).then((failures) => {
    process.exit(failures ? 1 : 0);
  }).catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
