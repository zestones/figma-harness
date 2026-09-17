/* Page chrome: the bands that title a group of frames and the captions above
 * frames. Frames stay direct page children, and the grouping is drawn around
 * them rather than made of them: a prototype NAVIGATE must reach a top-level
 * frame on the same page, so a Section cannot hold the screens. */

import {
  f as createFrame,
  t as createText,
} from '../index.ts';

/** A category band; returns the height it takes. */
export const band = async function (
  page: PageNode,
  x: number,
  y: number,
  letter: string,
  title: string,
  body: string,
  width: number,
): Promise<number> {
  var head = await createFrame({ name: 'band/' + title, dir: 'H', gap: 12, align: 'CENTER' });
  // Page chrome lives outside the authored frames on Figma's dark canvas,
  // so it uses the ink Primer sets on emphasis surfaces.
  var chip = await createFrame({
    name: 'band-chip', dir: 'H', w: 40, h: 40, radius: 6, fill: 'bgColor/accent-emphasis',
    justify: 'CENTER', align: 'CENTER',
  });
  chip.appendChild(await createText({ style: 'title/medium', text: letter, color: 'fgColor/onEmphasis' }));
  head.appendChild(chip);
  var col = await createFrame({ name: 'band-text', dir: 'V', gap: 2 });
  col.appendChild(await createText({ style: 'title/large', text: title, color: 'fgColor/onEmphasis' }));
  if (body) col.appendChild(await createText({ style: 'body/large', text: body, color: 'fgColor/onEmphasis', w: width }));
  head.appendChild(col);
  page.appendChild(head);
  head.x = x; head.y = y;
  var rule = await createFrame({ name: 'band-rule', w: width, h: 2, stroke: 'borderColor/default', strokeSide: 'Top', strokeW: 2 });
  page.appendChild(rule);
  rule.x = x; rule.y = y + head.height + 20;
  return head.height + 40;
};

/** The frame's name above it. Frames stay top-level; captions are siblings. */
export const frameCaption = async function (
  page: PageNode,
  x: number,
  y: number,
  title: string,
): Promise<TextNode> {
  var text = await createText({ style: 'title/medium', text: title, color: 'fgColor/onEmphasis' });
  page.appendChild(text);
  text.x = x; text.y = y - 44;
  return text;
};
