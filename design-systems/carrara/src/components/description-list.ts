/* DescriptionList: labelled facts, one per row, and FactStrip: a few short
 * facts side by side, such as the ones under a page title. */

import { f as frame } from '@figma-harness/engine';
import { dim } from '../foundations/dimensions.ts';
import { icon, type IconName } from '../primitives/icon.ts';
import { text } from '../primitives/text.ts';

export interface Description {
  readonly label: string;
  /** Text, or a node built for the value column. */
  readonly value: string | ((width: number) => Promise<SceneNode>);
  /** Show the value in monospace. */
  readonly code?: boolean;
}

export const descriptionList = async function (items: readonly Description[], width: number, labelWidth = 160): Promise<FrameNode> {
  if (!items.length) throw new Error('a description list needs at least one item');
  const root = await frame({ name: 'description-list', dir: 'V', w: width });
  for (const [index, item] of items.entries()) {
    const row = await frame({
      name: 'fact/' + item.label, dir: 'H', w: width, gap: dim('space/16'), align: 'CENTER',
      pad: [dim('space/12'), 0, dim('space/12'), 0], stroke: index ? 'border/default' : null, strokeSide: 'Top', strokeW: 1,
    });
    row.appendChild(await text({ style: 'body/md', text: item.label, color: 'text/tertiary', w: labelWidth, truncate: true }));
    const room = width - labelWidth - row.itemSpacing;
    row.appendChild(typeof item.value === 'string'
      ? await text({ style: item.code ? 'mono/sm' : 'body/md', text: item.value, w: room })
      : await item.value(room));
    row.setPluginData('aria.role', 'listitem');
    root.appendChild(row);
  }
  root.setPluginData('aria.role', 'list');
  return root;
};

export interface Fact {
  readonly icon?: IconName;
  readonly label: string;
  readonly value: string;
}

/** Facts in one row, divided by rules; they wrap, without rules, when the row is too narrow. */
export const factStrip = async function (items: readonly Fact[], width: number): Promise<FrameNode> {
  if (!items.length) throw new Error('a fact strip needs at least one fact');
  const bodies: FrameNode[] = [];
  for (const item of items) {
    const body = await frame({ name: 'fact-body', dir: 'V', gap: dim('space/4') });
    body.appendChild(await text({ style: 'body/sm', text: item.label, color: 'text/tertiary', maxW: width }));
    const value = await frame({ name: 'fact-value', dir: 'H', gap: dim('space/6'), align: 'CENTER' });
    if (item.icon) value.appendChild(icon(item.icon, 'text/tertiary', 16));
    value.appendChild(await text({
      style: 'body/md-medium', text: item.value, maxW: width - (item.icon ? 16 + value.itemSpacing : 0),
    }));
    body.appendChild(value);
    bodies.push(body);
  }
  const space = dim('space/20');
  const needed = bodies.reduce((sum, body) => sum + body.width, 0) + (space.value * 2 + 1) * (bodies.length - 1);
  const inline = needed <= width;
  const root = await frame({
    name: 'fact-strip', dir: 'H', w: width, gap: inline ? space : dim('space/24'), rowGap: dim('space/12'),
    wrap: !inline, align: 'MIN',
  });
  for (const [index, body] of bodies.entries()) {
    const ruled = inline && index > 0;
    const slot = await frame({
      name: 'fact/' + items[index].label, dir: 'V', pad: ruled ? [0, 0, 0, space] : 0,
      stroke: ruled ? 'border/default' : null, strokeSide: 'Left', strokeW: 1,
    });
    slot.appendChild(body);
    slot.setPluginData('aria.role', 'listitem');
    root.appendChild(slot);
  }
  root.setPluginData('aria.role', 'list');
  return root;
};
