import type { FocusContract } from '@figma-harness/contract';

export interface FocusGeometryNode {
  children?: readonly unknown[];
  clipsContent?: boolean;
  cornerRadius?: number;
  fills?: readonly unknown[];
  getPluginData?(key: string): string;
  height: number;
  layoutMode?: string;
  layoutPositioning?: string;
  name: string;
  strokeAlign?: string;
  strokeWeight?: number;
  type: string;
  visible?: boolean;
  width: number;
  x: number;
  y: number;
}

/** How far a focused control's outline extends past it, from its declared placement. */
export function focusExtent(control: FocusGeometryNode, focus: FocusContract): number | null {
  const placement = control.getPluginData?.(focus.placementKey) || '';
  const offset = focus.offsets[placement];
  return typeof offset === 'number' ? offset + focus.width : null;
}

/** Verify actual outline geometry, never an exemption based on its name alone.
 * The ring and the design system's inset band share one box; only their stroke differs. */
export function focusGeometryIssues(
  ring: FocusGeometryNode,
  control: FocusGeometryNode,
  focus: FocusContract,
): string[] {
  const issues: string[] = [];
  const near = (a: number | undefined, b: number): boolean =>
    typeof a === 'number' && Number.isFinite(a) && Math.abs(a - b) < 0.01;
  const band = ring.name === focus.bandName;
  if ((ring.name !== focus.ringName && !band) || ring.type !== 'FRAME'
    || ring.getPluginData?.(focus.ringRoleKey) !== focus.ringRole
    || control.getPluginData?.(focus.specimenKey) !== focus.specimenValue) issues.push('missing focus ownership');
  const extent = focusExtent(control, focus);
  if (extent == null) {
    issues.push('unknown focus placement');
    return issues;
  }
  if (control.clipsContent && extent > 0) issues.push('control clips its outline');
  if (ring.visible === false) issues.push('outline is hidden');
  if (control.layoutMode !== 'NONE' && ring.layoutPositioning !== 'ABSOLUTE') issues.push('outline participates in layout');
  if (ring.fills?.length || ring.children?.length) issues.push('outline must be empty and transparent');
  const weight = band ? focus.band.width : focus.width;
  if (ring.strokeAlign !== 'INSIDE' || !near(ring.strokeWeight, weight)) issues.push('incorrect ring thickness or alignment');
  if (band && extent !== 0) issues.push('a focus band only sits under an inset outline');
  if (!near(ring.x, -extent) || !near(ring.y, -extent)
    || !near(ring.width, control.width + extent * 2)
    || !near(ring.height, control.height + extent * 2)) issues.push('outline is not where its placement puts it');
  const own = Math.min(control.cornerRadius || 0, control.width / 2, control.height / 2);
  if (!near(ring.cornerRadius, own > 0 ? own + extent : 0)) issues.push('outline radius does not follow the control');
  return issues;
}
