/* What this plugin builds: one design system and one app. To build another,
 * change these imports, the dependencies in plugin/package.json, and the design
 * system named in figma-harness.config.json. */

import { PRIMER } from '@figma-harness/primer/system';
import { RELAY_APP } from '@figma-harness/relay';
import type { PrototypeWiring } from './document/prototype.ts';

export const DESIGN_SYSTEM = PRIMER;
export const APP = RELAY_APP;

/** The app's transitions, animated with the design system's motion. */
export const PROTOTYPE: PrototypeWiring = Object.freeze({
  transitions: APP.prototype.transitions,
  motion: (name: string) => DESIGN_SYSTEM.motion.transition(name as typeof DESIGN_SYSTEM.motion.names[number]),
});
