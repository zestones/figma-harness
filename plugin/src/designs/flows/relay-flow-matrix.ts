/* Declarative prototype intent for Relay.
 * Wiring consumes it; the static and runtime flow guards verify it. */

import { PROTOTYPE_SCREENS } from '../pages/state-matrix.ts';
import {
  defineFlowTransition,
  type FlowMotion,
  type FlowSelector,
  type FlowTransition,
} from './flow-types.ts';

const SCREEN_KEYS = PROTOTYPE_SCREENS.map((screen) => screen.key);
const RELEASE_KEYS = ['release', 'releasePromote'];
const SETTINGS_KEYS = ['settings', 'settingsChanged', 'settingsFailed'];

const byName = function (value: string): FlowSelector {
  return { kind: 'name', value };
};

const click = function (
  id: string,
  sources: readonly string[],
  selector: FlowSelector,
  destination: string,
  motion?: FlowMotion,
): FlowTransition {
  return defineFlowTransition({
    id,
    sources,
    selector,
    trigger: 'ON_CLICK',
    destination,
    navigation: 'NAVIGATE',
    cardinality: selector.kind === 'prefix' ? 'many' : 'one',
    motion,
  });
};

/* The dialog covers the page, so page navigation is only wired where it can be reached. */
const navigation = function (label: string, destination: string, except: readonly string[]): FlowTransition {
  return click(
    'nav.' + destination,
    SCREEN_KEYS.filter((key) => !except.includes(key) && key !== 'releasePromote'),
    byName('nav/' + label),
    destination,
  );
};

export const RELAY_FLOW_TRANSITIONS: readonly FlowTransition[] = Object.freeze([
  // Page navigation is instant.
  navigation('Overview', 'overview', ['overview']),
  navigation('Releases', 'releases', ['releases']),
  navigation('Settings', 'settings', SETTINGS_KEYS),
  click('open.release', ['overview', 'releases'], { kind: 'prefix', value: 'release-row/' }, 'release'),
  defineFlowTransition({
    id: 'back.release',
    sources: ['release'],
    selector: byName('crumb/Releases'),
    trigger: 'ON_CLICK',
    destination: null,
    navigation: 'BACK',
    cardinality: 'one',
  }),

  // A modal dialog enters and leaves.
  click('promote.open', ['release'], byName('button/Promote to 100%'), 'releasePromote', 'enter'),
  click('promote.close', ['releasePromote'], byName('promote-dialog/close'), 'release', 'exit'),
  click('promote.cancel', ['releasePromote'], byName('button/Cancel'), 'release', 'exit'),
  click('promote.confirm', ['releasePromote'], byName('button/Promote'), 'release', 'exit'),

  // A checkbox changes state in place.
  click('settings.check', ['settings'], byName('setting/Visual regression'), 'settingsChanged', 'stateChange'),
  click('settings.uncheck', ['settingsChanged'], byName('setting/Visual regression'), 'settings', 'stateChange'),

  // Saving fails; the banner keeps the change and can be dismissed.
  click('settings.save', ['settingsChanged'], byName('button/Save changes'), 'settingsFailed', 'enter'),
  click('settings.discard', ['settingsChanged'], byName('button/Discard'), 'settings', 'stateChange'),
  click('settings.error.dismiss', ['settingsFailed'], byName('save-error/dismiss'), 'settingsChanged', 'exit'),
]);

/** Frames a person must be able to reach from the start screen. */
export const REQUIRED_REACHABLE_KEYS: readonly string[] = Object.freeze([...SCREEN_KEYS]);

export const SCREEN_FAMILIES = Object.freeze({
  overview: ['overview'],
  releases: ['releases'],
  release: RELEASE_KEYS,
  settings: SETTINGS_KEYS,
});
