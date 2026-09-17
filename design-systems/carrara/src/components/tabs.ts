/* Tabs: sections of one page, and Segmented: one choice among a few, such as
 * a time range. The current item is marked in words for assistive technology. */

import { abs, P as tokenPaint, f as frame } from '@figma-harness/engine';
import { dim } from '../foundations/dimensions.ts';
import { text } from '../primitives/text.ts';

export interface TabItem {
  /** A count after the label, such as 1,204. */
  count?: string;
  current?: boolean;
  label: string;
  /** The layer name, which flows select; `tab/<label>` by default. */
  name?: string;
}

export const tabs = async function (items: readonly TabItem[], width: number): Promise<FrameNode> {
  if (!items.length) throw new Error('tabs need at least one tab');
  const row = await frame({
    name: 'tabs', dir: 'H', w: width, gap: dim('space/24'), align: 'MAX',
    stroke: 'border/default', strokeSide: 'Bottom', strokeW: 1,
  });
  for (const item of items) {
    const tab = await frame({
      name: item.name || 'tab/' + item.label, dir: 'H', gap: dim('space/8'), align: 'CENTER',
      pad: [dim('space/8'), dim('space/2'), dim('space/12'), dim('space/2')],
    });
    tab.appendChild(await text({
      style: 'body/md-medium', text: item.label, color: item.current ? 'text/primary' : 'text/secondary',
    }));
    if (item.count) {
      const count = await frame({
        name: 'tab-count', dir: 'H', h: 20, pad: [0, dim('space/6'), 0, dim('space/6')], align: 'CENTER',
        radius: dim('radius/full'), fill: item.current ? 'accent/subtle' : 'bg/subtle',
      });
      count.appendChild(await text({
        style: 'body/sm-medium', text: item.count, color: item.current ? 'accent/text' : 'text/secondary',
      }));
      tab.appendChild(count);
    }
    tab.setPluginData('aria.role', 'tab');
    tab.setPluginData('aria.selected', String(!!item.current));
    row.appendChild(tab);
    if (item.current) {
      const underline = figma.createRectangle();
      underline.name = 'tab-indicator';
      underline.resize(tab.width, 2);
      underline.fills = [tokenPaint('accent/solid')];
      abs(tab, underline, 0, tab.height - 2);
    }
  }
  row.setPluginData('aria.role', 'tablist');
  return row;
};

export interface SegmentItem {
  current?: boolean;
  label: string;
  name?: string;
}

export const segmented = async function (items: readonly SegmentItem[], label: string): Promise<FrameNode> {
  if (!items.length) throw new Error('a segmented control needs at least one segment');
  const track = await frame({
    name: 'segmented', dir: 'H', gap: dim('space/2'), pad: dim('space/2'), align: 'CENTER',
    radius: dim('radius/md'), fill: 'bg/muted',
  });
  for (const item of items) {
    const segment = await frame({
      name: item.name || 'segment/' + item.label, dir: 'H', h: 28, pad: [0, dim('space/12'), 0, dim('space/12')],
      align: 'CENTER', justify: 'CENTER', radius: dim('radius/sm'),
      fill: item.current ? 'bg/surface' : false, stroke: item.current ? 'border/default' : null, strokeW: 1,
      elevation: item.current ? 'shadow/xs' : null,
    });
    segment.appendChild(await text({
      style: 'body/sm-medium', text: item.label, color: item.current ? 'text/primary' : 'text/secondary',
    }));
    segment.setPluginData('aria.role', 'radio');
    segment.setPluginData('aria.checked', String(!!item.current));
    track.appendChild(segment);
  }
  track.setPluginData('aria.role', 'radiogroup');
  track.setPluginData('aria.accessible-name', label);
  return track;
};
