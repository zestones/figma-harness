/* Minimal runtime surface consumed by the offline Figma harness. */

import type { HarnessContract } from '@figma-harness/contract';
import { lint } from '@figma-harness/engine';
import { DESIGN_SYSTEM } from './composition.ts';
import {
  BUILDERS,
  LAST_LINKS,
  LAST_PAGE_CLEARS,
  LAST_SCREEN_MATERIALIZATION,
  buildScreens,
} from './document/builders.ts';
import { DOCUMENT_AUDIT } from './document/contract.ts';
import {
  LAB_PAGE_KEY,
  PAGES,
  PROTECTED_PAGE_KEYS,
} from './document/workspace.ts';
import {
  inspectScreenRefresh,
  refreshSelectedScreen,
} from './screen-refresh.ts';

/** Everything the offline tools may know about this workspace. */
export const HARNESS_CONTRACT: HarnessContract = Object.freeze({
  workspace: Object.freeze({
    labPageKey: LAB_PAGE_KEY,
    pages: PAGES,
    protectedPageKeys: PROTECTED_PAGE_KEYS,
  }),
  designSystem: DESIGN_SYSTEM.audit,
  document: DOCUMENT_AUDIT,
});

export const HARNESS_API = Object.freeze({
  BUILDERS,
  COLORS: DESIGN_SYSTEM.colors,
  CONTRACT: HARNESS_CONTRACT,
  buildScreens,
  ensureTokens: DESIGN_SYSTEM.install,
  get LAST_LINKS() { return LAST_LINKS; },
  get LAST_PAGE_CLEARS() { return LAST_PAGE_CLEARS; },
  get LAST_SCREEN_MATERIALIZATION() { return LAST_SCREEN_MATERIALIZATION; },
  inspectScreenRefresh,
  lint,
  loadFonts: DESIGN_SYSTEM.loadFonts,
  refreshSelectedScreen,
});

export type HarnessApi = typeof HARNESS_API;
