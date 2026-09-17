/* Minimal runtime surface consumed by the offline Figma harness. */

import {
  BUILDERS,
  LAST_LINKS,
  LAST_PAGE_CLEARS,
  LAST_SCREEN_MATERIALIZATION,
  buildScreens,
} from '../designs/catalog.ts';
import { DOCUMENT_AUDIT } from '../designs/harness-contract.ts';
import {
  LAB_PAGE_KEY,
  PAGES,
  PROTECTED_PAGE_KEYS,
} from '../designs/workspace.ts';
import { lint } from '../engine/layout-lint.ts';
import { COMPONENT_INVENTORY } from '../kit/components/inventory.ts';
import { DESIGN_SYSTEM_AUDIT } from '../kit/foundations/audit.ts';
import { COLORS } from '../kit/foundations/colors.ts';
import { ensureTokens, loadDesignFonts } from '../kit/foundations/install.ts';
import {
  inspectScreenRefresh,
  refreshSelectedScreen,
} from './screen-refresh.ts';

/** Everything the offline tools may know about this workspace. */
export const HARNESS_CONTRACT = Object.freeze({
  workspace: Object.freeze({
    labPageKey: LAB_PAGE_KEY,
    pages: PAGES,
    protectedPageKeys: PROTECTED_PAGE_KEYS,
  }),
  designSystem: Object.freeze({
    ...DESIGN_SYSTEM_AUDIT,
    componentInventory: COMPONENT_INVENTORY,
  }),
  document: DOCUMENT_AUDIT,
});

export const HARNESS_API = Object.freeze({
  BUILDERS,
  COLORS,
  CONTRACT: HARNESS_CONTRACT,
  buildScreens,
  ensureTokens,
  get LAST_LINKS() { return LAST_LINKS; },
  get LAST_PAGE_CLEARS() { return LAST_PAGE_CLEARS; },
  get LAST_SCREEN_MATERIALIZATION() { return LAST_SCREEN_MATERIALIZATION; },
  inspectScreenRefresh,
  lint,
  loadFonts: loadDesignFonts,
  refreshSelectedScreen,
});

export type HarnessApi = typeof HARNESS_API;
