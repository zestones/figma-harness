/* PageHeader: title area with visuals and actions, an optional description and
 * a closing border. */

import { dim } from '../../foundations/dimensions.ts';
import { f as createFrame, strut as createStrut, strutForRow } from '@figma-harness/engine';
import { lh, t as createText } from '../../primitives/text.ts';

type HeaderNode = SceneNode & LayoutMixin;

export interface PageHeaderOptions {
  /** Buttons on the right of the title, most important last. */
  actions?: readonly HeaderNode[];
  /** A row under the title: metadata, labels, links. */
  description?: HeaderNode;
  /** Close the header with a bottom border. */
  hasBorder?: boolean;
  /** A back link or context above the title. */
  parent?: HeaderNode;
  size?: 'large' | 'medium';
  title: string;
  /** A state label or counter right after the title. */
  trailingVisual?: HeaderNode;
  w: number;
}

export const pageHeader = async function (options: PageHeaderOptions): Promise<FrameNode> {
  const header = await createFrame({
    name: 'page-header', dir: 'V', w: options.w, gap: dim('base/size/8'),
    pad: options.hasBorder ? [0, 0, dim('base/size/8'), 0] : 0,
    stroke: options.hasBorder ? 'borderColor/default' : null, strokeSide: 'Bottom', strokeW: 1,
  });
  if (options.parent) header.appendChild(options.parent);
  const large = options.size === 'large';
  const style = large ? 'title/large' : 'title/medium';
  // Primer sizes the title area to the title's line, so actions centre on it.
  const titleArea = await createFrame({
    name: 'page-header/title-area', dir: 'H', w: options.w, h: lh(style),
    gap: dim('stack/gap/condensed'), align: 'CENTER',
  });
  const actions = options.actions || [];
  const trailing = options.trailingVisual ? [options.trailingVisual] : [];
  const reserved = actions.reduce((sum, node) => sum + node.width + 8, 0)
    + trailing.reduce((sum, node) => sum + node.width + 8, 0);
  // A title hugs its words unless it has to be cut.
  const heading = await createText({ style, text: options.title, maxW: Math.max(1, options.w - reserved - 8) });
  titleArea.appendChild(heading);
  heading.name = 'page-header/title';
  heading.setPluginData('aria.role', 'heading');
  heading.setPluginData('aria.level', '1');
  for (const node of trailing) titleArea.appendChild(node);
  const placed: HeaderNode[] = [heading, ...trailing, ...actions];
  titleArea.appendChild(await createStrut(strutForRow(titleArea, placed), 1));
  for (const node of actions) titleArea.appendChild(node);
  header.appendChild(titleArea);
  if (options.description) header.appendChild(options.description);
  return header;
};
