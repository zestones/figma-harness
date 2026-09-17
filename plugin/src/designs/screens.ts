/* Refreshable screens, the prototype start frame, and the catalog version. */

import { ALL_SCREENS } from './pages/state-matrix.ts';
import type { ScreenRegistration } from './workspace.ts';

/** Bump whenever screen keys or the prototype matrix change: a document built
 *  from another version is rewired completely on its next refresh. */
export const SCREEN_CATALOG_VERSION = 'relay-v1';

/** The frame a prototype presentation starts from. */
export const START_SCREEN_KEY = 'overview';

export const SCREENS: readonly ScreenRegistration[] = Object.freeze(
  ALL_SCREENS.map((definition): ScreenRegistration => Object.freeze({
    key: definition.key,
    title: definition.title,
    build: definition.build,
  })),
);
