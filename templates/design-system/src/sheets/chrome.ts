/* Page chrome: titled bands above groups of frames, and captions above
 * frames. It sits on Figma's dark canvas, so it uses light text. */

import { dim, f as frame, text } from '../index.ts';

export const band = async function (
  page: PageNode,
  x: number,
  y: number,
  letter: string,
  title: string,
  body: string,
  width: number,
): Promise<number> {
  const head = await frame({ name: 'band/' + title, dir: 'H', gap: dim('space/12'), align: 'CENTER' });
  const chip = await frame({
    name: 'band-chip', dir: 'H', w: 40, h: 40, radius: dim('radius/medium'), fill: 'accent/default',
    justify: 'CENTER', align: 'CENTER',
  });
  chip.appendChild(await text({ style: 'title/small', text: letter, color: 'text/on-accent' }));
  head.appendChild(chip);
  const column = await frame({ name: 'band-text', dir: 'V', gap: dim('space/2') });
  column.appendChild(await text({ style: 'title/large', text: title, color: 'text/on-accent' }));
  if (body) column.appendChild(await text({ style: 'body/default', text: body, color: 'text/on-accent', w: width }));
  head.appendChild(column);
  page.appendChild(head);
  head.x = x;
  head.y = y;
  const rule = await frame({ name: 'band-rule', w: width, h: 2, stroke: 'border/default', strokeSide: 'Top', strokeW: 2 });
  page.appendChild(rule);
  rule.x = x;
  rule.y = y + head.height + 20;
  return head.height + 40;
};

export const caption = async function (page: PageNode, x: number, y: number, title: string): Promise<TextNode> {
  const node = await text({ style: 'title/small', text: title, color: 'text/on-accent' });
  page.appendChild(node);
  node.x = x;
  node.y = y - 44;
  return node;
};
