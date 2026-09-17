/* The focus outline: an empty layer stroked inside, whose box extends past the
 * control by the offset plus the outline width. */

import { abs, f as frame } from '@figma-harness/engine';
import { FOCUS, FOCUS_EXTENT } from '../foundations/focus.ts';

export const withFocus = async function (control: FrameNode): Promise<FrameNode> {
  if (control.clipsContent) throw new Error('a focus outline needs an unclipped control: ' + control.name);
  const own = typeof control.cornerRadius === 'number' ? control.cornerRadius : 0;
  const radius = Math.min(own, control.width / 2, control.height / 2);
  const ring = await frame({
    name: FOCUS.ringName,
    w: control.width + FOCUS_EXTENT * 2,
    h: control.height + FOCUS_EXTENT * 2,
    // A CSS outline follows the border radius, offset by the same distance.
    radius: radius > 0 ? radius + FOCUS_EXTENT : 0,
    stroke: FOCUS.token,
    strokeW: FOCUS.width,
  });
  abs(control, ring, -FOCUS_EXTENT, -FOCUS_EXTENT);
  ring.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' };
  ring.setPluginData(FOCUS.ringRoleKey, FOCUS.ringRole);
  control.setPluginData(FOCUS.specimenKey, FOCUS.specimenValue);
  control.setPluginData(FOCUS.placementKey, 'outset');
  return control;
};
