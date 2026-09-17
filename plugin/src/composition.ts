/* What this plugin builds: one design system and one app. The build points
 * the two imports below at the app figma-harness.config.json names (or the
 * one FIGMA_HARNESS_APP selects) and at the design system that app depends
 * on. Switch apps with `pnpm use <app>`. */

import { app } from '@figma-harness/active-app';
import { designSystem } from '@figma-harness/active-design-system';
import type { PrototypeWiring } from './document/prototype.ts';

export const DESIGN_SYSTEM = designSystem;
export const APP = app;

/** The app's transitions, animated with the design system's motion. */
export const PROTOTYPE: PrototypeWiring = Object.freeze({
  transitions: APP.prototype.transitions,
  motion: (name: string) => DESIGN_SYSTEM.motion.transition(name),
});
