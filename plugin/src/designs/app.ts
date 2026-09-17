/* The example application: Relay, a release manager. Product identity,
 * navigation and the signed-in person. */

import { RELAY, personById } from '../fixtures/public.ts';
import type { IconName, UnderlineNavItem } from '../kit/public.ts';

export const PRODUCT = Object.freeze({ name: 'Relay', icon: 'rocket' as IconName });

export type AppSection = 'Overview' | 'Releases' | 'Settings';

/** The local navigation, with the section being shown marked current. */
export const appNavigation = function (current: AppSection, releaseCount: number): readonly UnderlineNavItem[] {
  return Object.freeze([
    Object.freeze({ label: 'Overview', icon: 'home' as IconName, current: current === 'Overview' }),
    Object.freeze({
      label: 'Releases', icon: 'tag' as IconName, current: current === 'Releases',
      count: releaseCount > 0 ? releaseCount : undefined,
    }),
    Object.freeze({ label: 'Settings', icon: 'gear' as IconName, current: current === 'Settings' }),
  ]);
};

const viewer = personById(RELAY, RELAY.viewerId);

export const APP_USER = Object.freeze({
  name: viewer ? viewer.name : 'Signed-in person',
  initials: viewer ? viewer.initials : '?',
});

export const APP_ACTIONS = Object.freeze([
  Object.freeze({ icon: 'plus' as IconName, label: 'Create' }),
  Object.freeze({ icon: 'bell' as IconName, label: 'Notifications' }),
]);
