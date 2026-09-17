/* Screen: a header with the product name over a centred content column. The
 * frame grows to fit its content, never below the height it was asked for. */

import { f as frame, frameReuseKey, reuseFrame } from '@figma-harness/engine';
import { dim } from '../foundations/dimensions.ts';
import { text } from '../primitives/text.ts';

export interface ScreenOptions {
  h: number;
  name: string;
  /** Shown in the header of every screen. */
  product: string;
  w: number;
}

export interface ScreenLayout {
  content: FrameNode;
  contentWidth: number;
  /** Grow the frame to its content. Call once the content is complete. */
  fit(): void;
  frame: FrameNode;
}

const PADDING = 32;

const header = function (product: string, width: number): Promise<FrameNode> {
  // Every screen of a build shares the same header, so it is cloned, not rebuilt.
  return reuseFrame(frameReuseKey('starter-header', { product, width }), async () => {
    const node = await frame({
      name: 'screen-header', dir: 'H', w: width, h: dim('header/height'),
      pad: [0, dim('space/24'), 0, dim('space/24')], align: 'CENTER',
      fill: 'surface/subtle', stroke: 'border/default', strokeSide: 'Bottom', strokeW: 1,
    });
    node.appendChild(await text({ style: 'body/strong', text: product, w: width - 48, truncate: true }));
    node.setPluginData('aria.role', 'banner');
    return node;
  });
};

export const screen = async function (options: ScreenOptions): Promise<ScreenLayout> {
  const root = await frame({ name: options.name, dir: 'V', w: options.w, h: options.h, fill: 'surface/page', clip: true });
  const top = await header(options.product, options.w);
  root.appendChild(top);
  const contentWidth = Math.min(options.w - PADDING * 2, dim('content/max-width').value);
  const body = await frame({
    name: 'screen-body', dir: 'V', w: options.w, h: options.h - top.height,
    pad: dim('space/32'), align: 'CENTER',
  });
  const content = await frame({ name: 'screen-content', dir: 'V', w: contentWidth, gap: dim('space/24') });
  content.setPluginData('aria.role', 'main');
  body.appendChild(content);
  root.appendChild(body);
  const fit = function (): void {
    const height = Math.max(options.h, Math.ceil(top.height + PADDING * 2 + content.height));
    body.resize(options.w, height - top.height);
    root.resize(options.w, height);
  };
  return { frame: root, content, contentWidth, fit };
};
