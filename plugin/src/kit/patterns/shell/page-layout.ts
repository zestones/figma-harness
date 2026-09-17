/* PageLayout: the header, then a centred content column with an optional pane. */

import { dim, SHELL_DIMENSIONS } from '../../foundations/dimensions.ts';
import { f as createFrame } from '../../../engine/node-factory.ts';
import { bindDimensions } from '../../../engine/dimension-bindings.ts';

export interface PageLayoutOptions {
  header: FrameNode;
  h: number;
  name: string;
  /** A side pane; Primer's medium pane is 296 px wide. */
  pane?: 'start' | 'end';
  w: number;
}

export interface PageLayout {
  /** The content column to fill, top to bottom. */
  content: FrameNode;
  /** Grow the artboard to show the whole page, never below the asked height. Call once the page is filled. */
  fit: () => void;
  /** Width of the content column. */
  contentWidth: number;
  frame: FrameNode;
  /** The pane column, when one was asked for. */
  pane: FrameNode | null;
  paneWidth: number;
  /** Height visible below the header, inside the page padding. */
  visibleHeight: number;
}

export const pageLayout = async function (options: PageLayoutOptions): Promise<PageLayout> {
  const frame = await createFrame({
    name: options.name, dir: 'V', w: options.w, h: options.h, gap: 0, fill: 'bgColor/default', clip: true,
  });
  frame.appendChild(options.header);
  const padding = SHELL_DIMENSIONS.pagePadding;
  const bodyHeight = Math.max(0, options.h - options.header.height);
  const body = await createFrame({
    name: 'page', dir: 'V', w: options.w, h: bodyHeight, align: 'CENTER', scroll: 'V',
    pad: [dim('stack/padding/spacious'), dim('stack/padding/spacious'), dim('stack/padding/spacious'), dim('stack/padding/spacious')],
  });
  const containerWidth = Math.min(options.w - padding * 2, SHELL_DIMENSIONS.contentMax);
  const container = await createFrame({
    name: 'page-container', dir: 'H', w: containerWidth, gap: dim('stack/gap/spacious'), align: 'MIN',
  });
  if (containerWidth === SHELL_DIMENSIONS.contentMax) bindDimensions(container, { width: dim('app/content/maxWidth') });
  const paneWidth = options.pane ? SHELL_DIMENSIONS.pane : 0;
  const contentWidth = containerWidth - (options.pane ? paneWidth + SHELL_DIMENSIONS.columnGap : 0);
  const content = await createFrame({ name: 'content', dir: 'V', w: contentWidth, gap: dim('stack/gap/normal') });
  let pane: FrameNode | null = null;
  if (options.pane) {
    pane = await createFrame({ name: 'pane', dir: 'V', w: dim('app/pane/width'), gap: dim('stack/gap/normal') });
    pane.setPluginData('aria.role', 'complementary');
  }
  if (pane && options.pane === 'start') container.appendChild(pane);
  container.appendChild(content);
  if (pane && options.pane === 'end') container.appendChild(pane);
  body.appendChild(container);
  frame.appendChild(body);
  content.setPluginData('aria.role', 'main');
  const fit = function (): void {
    const needed = options.header.height + padding * 2 + container.height;
    const height = Math.max(options.h, Math.ceil(needed));
    if (height === frame.height) return;
    body.resize(options.w, height - options.header.height);
    frame.resize(options.w, height);
  };
  return {
    frame,
    content,
    contentWidth,
    fit,
    pane,
    paneWidth,
    visibleHeight: Math.max(0, bodyHeight - padding * 2),
  };
};
