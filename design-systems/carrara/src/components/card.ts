/* Card: a bordered panel with an optional header. A flush card lets its body
 * (a table, a list) run to the edges. */

import { f as frame } from '@figma-harness/engine';
import { dim, type DimensionName } from '../foundations/dimensions.ts';
import { text } from '../primitives/text.ts';

export interface CardOptions {
  /** Controls at the end of the header. */
  actions?: readonly SceneNode[];
  description?: string;
  /** The body runs to the edges, under a divided header. */
  flush?: boolean;
  /** The space between the header and the blocks of the body; 16 px by default. */
  gap?: DimensionName | 0;
  /** The layer name; `card` by default. */
  name?: string;
  title?: string;
  w: number;
}

export interface CardLayout {
  /** Where the body goes. */
  readonly body: FrameNode;
  readonly bodyWidth: number;
  readonly frame: FrameNode;
}

const PAD = 20;

const header = async function (options: CardOptions, width: number): Promise<FrameNode> {
  const worded = !!(options.title || options.description);
  // Actions alone sit at the end of the header.
  const row = await frame({
    name: 'card-header', dir: 'H', w: width, gap: dim('space/16'), align: 'CENTER', justify: worded ? 'MIN' : 'MAX',
  });
  // Figma places every new frame on the page, so the actions frame exists only when it is used.
  const actions = options.actions?.length
    ? await frame({ name: 'card-actions', dir: 'H', gap: dim('space/8'), align: 'CENTER' })
    : null;
  for (const action of options.actions || []) actions?.appendChild(action);
  const room = width - (actions ? actions.width + row.itemSpacing : 0);
  if (worded) {
    const words = await frame({ name: 'card-heading', dir: 'V', w: room, gap: dim('space/2') });
    if (options.title) {
      const title = await text({ style: 'title/card', text: options.title, w: room, truncate: true });
      title.setPluginData('aria.role', 'heading');
      title.setPluginData('aria.level', '2');
      words.appendChild(title);
    }
    if (options.description) {
      words.appendChild(await text({ style: 'body/sm', text: options.description, color: 'text/tertiary', w: room }));
    }
    row.appendChild(words);
  }
  if (actions) row.appendChild(actions);
  return row;
};

export const card = async function (options: CardOptions): Promise<CardLayout> {
  const root = await frame({
    name: options.name || 'card', dir: 'V', w: options.w, radius: dim('radius/lg'),
    fill: 'bg/surface', stroke: 'border/default', strokeW: 1, elevation: 'shadow/sm',
    gap: options.flush || options.gap === 0 ? 0 : dim(options.gap || 'space/16'), pad: options.flush ? 0 : dim('space/20'),
    // A flush body is clipped to the rounded corners.
    clip: !!options.flush,
  });
  const titled = options.title || options.description || options.actions?.length;
  if (options.flush) {
    if (titled) {
      const band = await frame({
        name: 'card-band', dir: 'V', w: options.w, pad: dim('space/20'),
        stroke: 'border/default', strokeSide: 'Bottom', strokeW: 1,
      });
      band.appendChild(await header(options, options.w - PAD * 2));
      root.appendChild(band);
    }
    return { frame: root, body: root, bodyWidth: options.w };
  }
  if (titled) root.appendChild(await header(options, options.w - PAD * 2));
  return { frame: root, body: root, bodyWidth: options.w - PAD * 2 };
};

/** Cards side by side take the height of the tallest, as a row of cards should. */
export const matchHeights = function (cards: readonly FrameNode[]): void {
  const height = Math.max(...cards.map((node) => node.height));
  for (const node of cards) node.resize(node.width, height);
};
