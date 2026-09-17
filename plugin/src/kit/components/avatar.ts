/* Components: Avatar and AvatarStack. The example has no photographs, so an
 * avatar shows initials on a data-series tint. */

import { dim } from '../foundations/dimensions.ts';
import { dataToken } from '../foundations/semantics.ts';
import { f as createFrame } from '../../engine/node-factory.ts';
import { t as createText } from '../primitives/text.ts';

export interface AvatarOptions {
  /** Hide the initials, where overlapping letters would only collide. */
  bare?: boolean;
  initials: string;
  /** The person's name, announced in place of the image. */
  name: string;
  /** Which data series tints the avatar. */
  series?: number;
  size?: 16 | 20 | 24 | 32 | 40 | 48;
}

export const avatar = async function (options: AvatarOptions): Promise<FrameNode> {
  const size = options.size || 20;
  const frame = await createFrame({
    name: 'avatar',
    dir: 'H',
    w: size,
    h: size,
    justify: 'CENTER',
    align: 'CENTER',
    radius: dim('borderRadius/full'),
    fill: dataToken(options.series || 0, 'muted'),
    stroke: 'avatar/borderColor',
    strokeW: 1,
    clip: true,
  });
  if (size >= 20 && !options.bare) {
    frame.appendChild(await createText({
      style: size >= 40 ? 'body/medium-600' : 'label/small-600',
      text: size >= 32 ? options.initials : options.initials.slice(0, 1),
      color: 'fgColor/default',
    }));
  }
  frame.setPluginData('aria.role', 'img');
  frame.setPluginData('aria.accessible-name', options.name);
  return frame;
};

export interface AvatarStackOptions {
  people: ReadonlyArray<{ readonly initials: string; readonly name: string }>;
  size?: 20 | 24 | 32;
}

/** Overlapping avatars; a 1 px ring of the page ground separates each from the next. */
export const avatarStack = async function (options: AvatarStackOptions): Promise<FrameNode> {
  const size = options.size || 20;
  const step = Math.round(size * 0.45);
  const shown = options.people.slice(0, 5);
  const frame = await createFrame({
    name: 'avatar-stack',
    w: size + 2 + step * Math.max(0, shown.length - 1),
    h: size + 2,
  });
  // The first person sits on top, so the list is drawn from the last.
  for (let index = shown.length - 1; index >= 0; index--) {
    const person = shown[index];
    const ring = await createFrame({
      name: 'avatar-ring', w: size + 2, h: size + 2, radius: dim('borderRadius/full'), fill: 'bgColor/default',
    });
    const face = await avatar({ initials: person.initials, name: person.name, series: index, size, bare: true });
    ring.appendChild(face);
    face.x = 1;
    face.y = 1;
    frame.appendChild(ring);
    ring.x = index * step;
    ring.y = 0;
  }
  frame.setPluginData('aria.accessible-name', shown.map((person) => person.name).join(', '));
  return frame;
};
