/* The design system as the plugin sees it: how to install it, how to document
 * it, how it moves, and what the harness must measure. Only the plugin imports
 * this entry; apps use the authoring vocabulary in index.ts. */

import type { DesignSystemDefinition } from '@figma-harness/contract';
import { COMPONENT_INVENTORY } from './components/inventory.ts';
import { DESIGN_SYSTEM_AUDIT, FOCUS_STROKE_EXEMPTIONS } from './foundations/audit.ts';
import { COLORS } from './foundations/colors.ts';
import { installDesignTokens, loadDesignFonts } from './foundations/install.ts';
import { MOTION_NAMES, motionTransition, type MotionName } from './foundations/motion.ts';
import { SHEET_GROUPS, SHEETS } from './sheets/catalog.ts';
import { band, caption } from './sheets/chrome.ts';
import { SHEET_H, SHEET_W } from './sheets/support.ts';

export const designSystem: DesignSystemDefinition<MotionName> = Object.freeze({
  name: 'Template',
  audit: Object.freeze({
    ...DESIGN_SYSTEM_AUDIT,
    componentInventory: COMPONENT_INVENTORY,
  }),
  chrome: Object.freeze({ band, caption }),
  colors: COLORS,
  focusStrokeExemptions: FOCUS_STROKE_EXEMPTIONS,
  install: installDesignTokens,
  loadFonts: loadDesignFonts,
  motion: Object.freeze({
    names: MOTION_NAMES,
    transition: motionTransition,
  }),
  radiusExceptions: Object.freeze([]),
  sheets: Object.freeze({
    groups: SHEET_GROUPS,
    height: SHEET_H,
    list: SHEETS,
    width: SHEET_W,
  }),
  /** The button matrix stands for every component. */
  signatureComponents: Object.freeze([
    Object.freeze({ key: 'button-matrix', page: 'system', topLevel: 'C1 · Components', node: 'row/primary' }),
  ]),
});
