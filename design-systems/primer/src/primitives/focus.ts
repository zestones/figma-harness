import { abs, f } from '@figma-harness/engine';
import { FOCUS, focusExtent, type FocusPlacement } from '../foundations/focus.ts';

export interface FocusOptions {
  /** Primer's inset band between the ring and an emphasis fill. */
  band?: boolean;
}

const layer = async function (
  control: FrameNode,
  name: string,
  extent: number,
  radius: number,
  token: string,
  width: number,
): Promise<FrameNode> {
  const node = await f({
    name,
    w: control.width + extent * 2,
    h: control.height + extent * 2,
    radius,
    fill: false,
    stroke: token,
    strokeW: width,
  });
  abs(control, node, -extent, -extent);
  node.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' };
  node.setPluginData(FOCUS.ringRoleKey, FOCUS.ringRole);
  return node;
};

/** Draw the focus outline where Primer draws it for this kind of control,
 * without changing the control's layout, fill, border or content. Call after
 * the control has been sized. */
export async function withFocus(
  control: FrameNode,
  placement: FocusPlacement,
  options: FocusOptions = {},
): Promise<FrameNode> {
  const extent = focusExtent(placement);
  if (control.clipsContent && extent > 0) {
    throw new Error('an outside focus outline needs an unclipped control: ' + control.name);
  }
  if (options.band && placement !== 'inset') {
    throw new Error('the focus band only sits under an inset outline: ' + control.name);
  }
  for (const previous of control.children.filter((node) =>
    node.name === FOCUS.ringName || node.name === FOCUS.bandName)) previous.remove();
  const own = Math.min(
    typeof control.cornerRadius === 'number' ? control.cornerRadius : 0,
    control.width / 2,
    control.height / 2,
  );
  // CSS outlines follow the border radius, offset by the same distance.
  const radius = own > 0 ? own + extent : 0;
  if (options.band) await layer(control, FOCUS.bandName, extent, radius, FOCUS.band.token, FOCUS.band.width);
  await layer(control, FOCUS.ringName, extent, radius, FOCUS.token, FOCUS.width);
  control.setPluginData(FOCUS.specimenKey, FOCUS.specimenValue);
  control.setPluginData(FOCUS.placementKey, placement);
  return control;
}
