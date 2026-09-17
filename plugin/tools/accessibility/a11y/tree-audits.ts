/* Stable facade for independent rendered-tree accessibility rules. */

import { adjacency } from './tree/adjacency.ts';
import { controlFocus } from './tree/focus.ts';
import { shadowOnly } from './tree/shadow.ts';
import { soleCarrierCheck } from './tree/sole-carrier.ts';
import { treeContrast } from './tree/contrast.ts';
import type {
  AddFinding,
  ContractTreeHarness,
} from './tree/types.ts';

export function createTreeAudits(harness: ContractTreeHarness) {
  return {
    adjacency: (): Promise<Set<string>> => adjacency(harness),
    controlFocus: (add: AddFinding): Promise<void> => controlFocus(harness, add),
    shadowOnly: (add: AddFinding): Promise<void> => shadowOnly(harness, add),
    soleCarrierCheck: (add: AddFinding): Promise<void> => soleCarrierCheck(harness, add),
    treeContrast: (add: AddFinding): Promise<void> => treeContrast(harness, add),
  };
}
