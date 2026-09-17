/* The document's declarative prototype: its navigation transitions. */

import type { PrototypeFlows } from './flow-types.ts';
import { RELAY_FLOW_TRANSITIONS } from './relay-flow-matrix.ts';

export const PROTOTYPE_FLOWS: PrototypeFlows = Object.freeze({
  transitions: RELAY_FLOW_TRANSITIONS,
});
