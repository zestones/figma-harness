import type { WorkspacePageKey } from '@figma-harness/contract';

export type { WorkspacePageKey };

/* Plugin-owned Figma pages, in document order.
 *
 * A Starter file allows three pages. The builders claim them by index and the
 * signature requires exactly these names in this order. */

export const PAGES = Object.freeze({
  screens: '01 · Screens',
  system: '02 · Design system',
  states: '03 · Design lab',
} satisfies Record<WorkspacePageKey, string>);

/** Pages whose settled structure enters the stable design signature. */
export const PROTECTED_PAGE_KEYS: readonly WorkspacePageKey[] = Object.freeze(['screens', 'system']);

/** The disposable exploration page: fully audited, exempt from parity and scale rules. */
export const LAB_PAGE_KEY: WorkspacePageKey = 'states';

/** A refreshable generated screen. */
export interface ScreenRegistration {
  /** Durable machine key stored in plugin data; never shown to people. */
  readonly key: string;
  /** Visible top-level frame name. */
  readonly title: string;
  readonly build: () => Promise<FrameNode>;
}
