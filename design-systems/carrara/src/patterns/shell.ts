/* Shell: the frame every screen shares, a dark sidebar beside a top bar and
 * the page. Under 1024 px the sidebar folds into the top bar. The frame grows
 * to its content, never below the size asked for. */

import { bindDimensions, f as frame, frameReuseKey, reuseFrame } from '@figma-harness/engine';
import { dim } from '../foundations/dimensions.ts';
import { sidebar, type SidebarOptions } from './sidebar.ts';
import { topbar } from './topbar.ts';

export interface ShellOptions extends Omit<SidebarOptions, 'h'> {
  /** Controls at the end of the top bar. */
  actions?: readonly SceneNode[];
  h: number;
  name: string;
  /** The search field's placeholder. */
  search: string;
  w: number;
}

export interface ShellLayout {
  readonly content: FrameNode;
  readonly contentWidth: number;
  /** Grow the frame to its content. Call once the content is complete. */
  fit(): void;
  readonly frame: FrameNode;
}

/** Below this width the sidebar folds into the top bar. */
export const COMPACT_BELOW = 1024;

export const shell = async function (options: ShellOptions): Promise<ShellLayout> {
  const compact = options.w < COMPACT_BELOW;
  const root = await frame({
    name: options.name, dir: compact ? 'V' : 'H', w: options.w, h: options.h, fill: 'bg/canvas', clip: true, align: 'MIN',
  });
  const side = compact ? null : await sidebar({ ...options, h: options.h });
  if (side) root.appendChild(side);
  const mainWidth = options.w - (side ? side.width : 0);
  const main = await frame({ name: 'main', dir: 'V', w: mainWidth, h: options.h });
  const compactProduct = compact ? options.product.name : undefined;
  // Every screen of a build shares one top bar, so it is cloned, not rebuilt.
  const bar = options.actions?.length
    ? await topbar({ w: mainWidth, search: options.search, actions: options.actions, compactProduct })
    : await reuseFrame(frameReuseKey('carrara-topbar', { width: mainWidth, search: options.search, compactProduct }),
      () => topbar({ w: mainWidth, search: options.search, compactProduct }));
  main.appendChild(bar);
  const sidePad = dim(compact ? 'space/16' : 'space/32');
  const content = await frame({
    name: 'content', dir: 'V', w: mainWidth, gap: dim('space/24'),
    pad: [dim(compact ? 'space/24' : 'space/32'), sidePad, dim('space/40'), sidePad],
  });
  content.setPluginData('aria.role', 'main');
  main.appendChild(content);
  root.appendChild(main);
  const fit = function (): void {
    const height = Math.max(options.h, Math.ceil(bar.height + content.height));
    main.resize(mainWidth, height);
    if (side) {
      side.resize(side.width, height);
      // resize() is not documented to keep a size variable, so the width is bound again.
      bindDimensions(side, { width: dim('sidebar/width') });
    }
    root.resize(options.w, height);
  };
  return { frame: root, content, contentWidth: mainWidth - sidePad.value * 2, fit };
};
