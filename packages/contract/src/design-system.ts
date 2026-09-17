/* What a design system gives the plugin. The plugin installs it, lays out its
 * sheets on the Design system page, draws the page chrome with it, animates the
 * prototype with its motion, and publishes its audit policy to the harness. */

import type {
  RadiusExceptionDefinition,
  SignatureComponentDefinition,
} from './app.ts';
import type { PrototypeTransition } from './flows.ts';
import type { AuditedNode, DesignSystemContract } from './harness.ts';

export interface SheetDefinition {
  build(): Promise<FrameNode>;
  /** A stable code such as A1, F4 or C8. */
  readonly code: string;
  readonly group: string;
  readonly title: string;
}

export interface SheetGroup {
  readonly name: string;
  readonly note: string;
}

export interface DocumentChrome {
  /** A titled band above a group of frames; returns the height it takes. */
  band(page: PageNode, x: number, y: number, letter: string, title: string, body: string, width: number): Promise<number>;
  /** A frame's name, drawn above it on the canvas. */
  caption(page: PageNode, x: number, y: number, title: string): Promise<TextNode>;
}

export interface DesignSystemDefinition<Motion extends string = string> {
  readonly name: string;
  /** The audit policy the harness measures, including the component inventory. */
  readonly audit: DesignSystemContract;
  readonly chrome: DocumentChrome;
  /** Colour tokens as [name, hex, description]; a harness may preview overrides in place. */
  readonly colors: Array<[string, string, string]>;
  readonly focusStrokeExemptions: ReadonlyArray<(node: AuditedNode) => boolean>;
  /** Install or reconcile the variables, text styles and effect styles. */
  install(): Promise<void>;
  /** Load every font the text styles use. */
  loadFonts(): Promise<void>;
  readonly motion: {
    readonly names: readonly Motion[];
    transition(name: Motion, reducedMotion?: boolean): PrototypeTransition;
  };
  readonly radiusExceptions: readonly RadiusExceptionDefinition[];
  readonly sheets: {
    /** Groups in the order the page shows them. */
    readonly groups: readonly SheetGroup[];
    readonly height: number;
    readonly list: readonly SheetDefinition[];
    readonly width: number;
  };
  readonly signatureComponents: readonly SignatureComponentDefinition[];
}
