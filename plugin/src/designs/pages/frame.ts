/* The frame every Relay screen shares: the app header over a PageLayout. */

import {
  appHeader,
  pageLayout,
  type PageLayout,
} from '../../kit/public.ts';
import { RELAY } from '../../fixtures/public.ts';
import { APP_ACTIONS, APP_USER, PRODUCT, appNavigation, type AppSection } from '../app.ts';
import { frameReuseKey, reuseFrame } from './render-cache.ts';

export let FRAME_W = 1440;
export let FRAME_H = 1024;

export const setFrameSize = function (width: number, height: number): void {
  FRAME_W = width;
  FRAME_H = height;
};

export interface ShellOptions {
  name: string;
  pane?: 'start' | 'end';
  section: AppSection;
}

export const shell = async function (options: ShellOptions): Promise<PageLayout> {
  const header = await reuseFrame(
    frameReuseKey('app-header', { section: options.section, width: FRAME_W, releases: RELAY.counts.total }),
    () => appHeader({
      w: FRAME_W,
      product: PRODUCT,
      context: [RELAY.org, RELAY.project],
      search: 'Search or jump to…',
      actions: APP_ACTIONS,
      user: APP_USER,
      nav: appNavigation(options.section, RELAY.counts.total),
    }),
  );
  return pageLayout({ name: options.name, w: FRAME_W, h: FRAME_H, header, pane: options.pane });
};
