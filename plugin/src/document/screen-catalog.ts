/* Stable generated-screen identity and renderer lookup.
 *
 * Figma names remain human-facing. Plugin data supplies the durable screen
 * key used by targeted refreshes, while the title fallback migrates documents
 * built before metadata existed. */

import { APP } from '../composition.ts';
import type { ScreenRegistration } from './workspace.ts';

/** The app's catalog version: a document built from another one is rewired completely. */
export const SCREEN_CATALOG_VERSION = APP.catalogVersion;

/** The frame a prototype presentation starts from. */
export const START_SCREEN_KEY = APP.startScreenKey;

/** Every refreshable screen, in canvas order. */
export const SCREENS: readonly ScreenRegistration[] = Object.freeze(
  APP.screenGroups.flatMap((group) => group.screens).map((definition): ScreenRegistration => Object.freeze({
    key: definition.key,
    title: definition.title,
    build: definition.build,
  })),
);

export const SCREEN_KEY_PLUGIN_DATA = 'workspace.screen.key';
export const SCREEN_CATALOG_PLUGIN_DATA = 'workspace.screen.catalog';
export const SCREEN_PAGE_PLUGIN_DATA = 'workspace.page.role';
export const SCREEN_PROTOTYPE_ACTION_COUNT_PLUGIN_DATA = 'workspace.prototype.action-count';

export interface ScreenCatalogItem {
  key: string;
  title: string;
}

const registrationByKey = new Map<string, ScreenRegistration>();
for (const registration of SCREENS) {
  if (registrationByKey.has(registration.key)) {
    throw new Error('duplicate registered screen key "' + registration.key + '"');
  }
  registrationByKey.set(registration.key, registration);
}
if (!registrationByKey.has(START_SCREEN_KEY)) {
  throw new Error('the prototype start screen "' + START_SCREEN_KEY + '" is not registered');
}

export const SCREEN_CATALOG: readonly Readonly<ScreenCatalogItem>[] = Object.freeze(
  SCREENS.map(function (registration) {
    return Object.freeze({ key: registration.key, title: registration.title });
  }),
);

const screenKeyByTitle = new Map(
  SCREEN_CATALOG.map(function (item) { return [item.title, item.key] as const; }),
);

export const markCatalogScreen = function (frame: FrameNode, key: string): void {
  frame.setPluginData(SCREEN_KEY_PLUGIN_DATA, key);
  frame.setPluginData(SCREEN_CATALOG_PLUGIN_DATA, SCREEN_CATALOG_VERSION);
};

export const readCatalogScreenKey = function (frame: FrameNode): string | null {
  var tagged = frame.getPluginData(SCREEN_KEY_PLUGIN_DATA);
  if (registrationByKey.has(tagged)) return tagged;
  return screenKeyByTitle.get(frame.name) || null;
};

export const buildCatalogScreen = async function (key: string): Promise<FrameNode> {
  var registration = registrationByKey.get(key);
  if (!registration) throw new Error('unknown generated screen "' + key + '"');
  var frame = await registration.build();
  markCatalogScreen(frame, key);
  return frame;
};
