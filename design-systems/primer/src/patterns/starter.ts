/* The starter vocabulary: the screen a newly created app starts from, drawn
 * with Primer's own shell, header, box, labels and buttons. */

import type {
  StarterAction,
  StarterItem,
  StarterScreenOptions,
  StarterVocabulary,
} from '@figma-harness/contract';
import {
  f as createFrame,
  frameReuseKey,
  reuseFrame,
} from '@figma-harness/engine';
import { dim, SHELL_DIMENSIONS } from '../foundations/dimensions.ts';
import type { MotionTransitionName } from '../foundations/motion.ts';
import { t as createText } from '../primitives/text.ts';
import { button } from '../components/button.ts';
import { stateLabel, type StateLabelStatus } from '../components/labels.ts';
import { box } from '../components/overlay.ts';
import { pageHeader } from './blocks/page-header.ts';
import { pageLayout } from './shell/page-layout.ts';

const TONES: Readonly<Record<NonNullable<StarterItem['status']>['tone'], StateLabelStatus>> = Object.freeze({
  neutral: 'unavailable',
  positive: 'open',
  warning: 'queued',
  critical: 'closed',
});

/* Every screen of a build shares the same header, so it is cloned, not rebuilt. */
const header = function (product: string, width: number): Promise<FrameNode> {
  return reuseFrame(frameReuseKey('starter-header', { product, width }), async () => {
    const frame = await createFrame({
      name: 'starter-header', dir: 'H', w: width, h: SHELL_DIMENSIONS.header,
      pad: [0, dim('base/size/16'), 0, dim('base/size/16')], align: 'CENTER',
      fill: 'page/header/bgColor', stroke: 'borderColor/default', strokeSide: 'Bottom', strokeW: 1,
    });
    frame.appendChild(await createText({ style: 'body/medium-600', text: product, maxW: width - 32 }));
    frame.setPluginData('aria.role', 'banner');
    return frame;
  });
};

const action = async function (spec: StarterAction, variant: 'default' | 'primary'): Promise<FrameNode> {
  const node = await button({ label: spec.label, variant });
  node.name = spec.name;
  return node;
};

const row = async function (item: StarterItem, width: number): Promise<FrameNode> {
  const frame = await createFrame({
    name: item.name, dir: 'H', w: width, gap: dim('stack/gap/normal'), pad: dim('stack/padding/normal'), align: 'CENTER',
  });
  const status = item.status
    ? await stateLabel({ status: TONES[item.status.tone], text: item.status.label, size: 'small' })
    : null;
  const textWidth = width - 32 - (status ? status.width + 16 : 0);
  const text = await createFrame({ name: 'starter-row/text', dir: 'V', w: textWidth, gap: dim('base/size/4') });
  text.appendChild(await createText({ style: 'body/medium-600', text: item.label, w: textWidth, truncate: true }));
  text.appendChild(await createText({ style: 'body/small', text: item.detail, color: 'fgColor/muted', w: textWidth, truncate: true }));
  frame.appendChild(text);
  // The text takes the room the label leaves, so the label ends the row.
  if (status) frame.appendChild(status);
  frame.setPluginData('aria.role', item.link ? 'link' : 'listitem');
  frame.setPluginData('aria.accessible-name', item.label);
  return frame;
};

export const starter: StarterVocabulary = Object.freeze({
  stateMotion: 'stateChange' satisfies MotionTransitionName,
  async screen(options: StarterScreenOptions): Promise<FrameNode> {
    const layout = await pageLayout({
      name: options.name, w: options.w, h: options.h, header: await header(options.product, options.w),
    });
    const width = layout.contentWidth;
    const actions: FrameNode[] = [];
    if (options.secondary) actions.push(await action(options.secondary, 'default'));
    if (options.primary) actions.push(await action(options.primary, 'primary'));
    layout.content.appendChild(await pageHeader({ w: width, title: options.title, actions, hasBorder: true }));
    layout.content.appendChild(await createText({ style: 'body/medium', text: options.text, color: 'fgColor/muted', w: width }));
    if (options.items) {
      const rows: FrameNode[] = [];
      for (const item of options.items) rows.push(await row(item, width));
      if (!rows.length) {
        const empty = await createFrame({ name: 'starter-list/empty', dir: 'V', w: width, pad: dim('stack/padding/normal') });
        empty.appendChild(await createText({ style: 'body/medium', text: 'Nothing here yet.', color: 'fgColor/muted', w: width - 32 }));
        rows.push(empty);
      }
      layout.content.appendChild(await box({ name: 'starter-list', w: width, rows }));
    }
    layout.fit();
    return layout.frame;
  },
});
