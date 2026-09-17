import type { ColorAlpha } from '../../color/core/color.ts';
import type { TokenVariable } from '../../color/core/token-values.ts';
import type {
  MockNode,
  MockPaint,
} from '../../runtime/figma-mock/types.ts';

export type SvgNode = MockNode;
export type SvgPaint = MockPaint;

export interface RenderHarness {
  buildAll(): Promise<SvgNode[]>;
  measure(
    text: string,
    size: number,
    family: string,
    trackingPixels?: number,
    upper?: boolean,
    style?: string,
  ): number;
  solveLayout(node: SvgNode): void;
  vars: TokenVariable[];
}

export interface RenderContext {
  harness: RenderHarness;
  /** Channels 0–1 and the effective alpha: the variable's times the paint opacity. */
  resolvePaint(paint: SvgPaint): ColorAlpha | null | undefined;
}

export interface SolidFill {
  color: string;
  kind: 'solid';
  opacity: number;
}

export interface GradientStop {
  a: number;
  c: string;
  o: number;
}

export interface GradientFill {
  kind: 'grad';
  stops: GradientStop[];
}

export type SvgFill = GradientFill | SolidFill;
