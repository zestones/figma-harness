/* The workspace's declared audit contract, as the offline tools see it.
 *
 * Tools never import product source. Everything they need to know about a
 * design system or a generated document is declared under src/ and published
 * through HARNESS_API.CONTRACT (see src/plugin/harness-api.ts). */

import type { MockNode } from './figma-mock/types.ts';

type StressResult = Promise<unknown> | unknown;

export interface ColorSharingDecision {
  readonly policy: 'independent-semantics' | 'linked-aliases';
  readonly rationale: string;
}

export interface CategoricalWaiver {
  readonly counts: 'adjacent' | 'always';
  readonly detail: string;
  readonly label: string;
  matches(first: string, second: string): boolean;
  summary(count: number): string;
}

export interface FocusContract {
  readonly band: { readonly token: string; readonly width: number };
  readonly bandName: string;
  /** CSS outline-offset per placement; a ring's box extends by offset + width. */
  readonly offsets: Readonly<Record<string, number>>;
  readonly placementKey: string;
  readonly restEdgeKey: string;
  readonly ringName: string;
  readonly ringRole: string;
  readonly ringRoleKey: string;
  readonly specimenKey: string;
  readonly specimenValue: string;
  readonly token: string;
  readonly width: number;
}

export interface NeutralLadderContract {
  readonly minimumStep: number;
  readonly tokens: readonly string[];
}

export interface ThemeContract {
  readonly accent: {
    readonly marks: ReadonlyArray<readonly [mark: string, ground: string, purpose: string]>;
    readonly readable: ReadonlyArray<readonly [ink: string, ground: string, purpose: string]>;
    readonly tints: ReadonlyArray<readonly [tint: string, surface: string, minimum: number]>;
  };
  readonly inkGrounds: readonly string[];
  readonly inkRamp: readonly string[];
  readonly ladders: readonly NeutralLadderContract[];
  readonly maximumNeutralChroma: number;
  readonly maximumNeutralHueDrift: number;
  readonly minimumInkStep: number;
  readonly neutralTokens: readonly string[];
}

export type ContrastPairContract = readonly [
  foreground: string, background: string, required: number, purpose: string, ground?: string,
];

export interface SurfaceControlContract {
  readonly edge: string;
  readonly interactive: boolean;
  readonly outside: string;
  readonly subject: string;
  readonly waiver?: string;
}

export interface DesignSystemContract {
  readonly adjacencyPrefixes: readonly string[];
  readonly categorical: {
    readonly rampPrefixes: readonly string[];
    readonly sameFamilyPrefixes: readonly string[];
    readonly tokens: readonly string[];
    readonly waivers: readonly CategoricalWaiver[];
  };
  readonly colorOwnership: Readonly<Record<string, string>>;
  /** Reviewed paints outside a token's scope, by exact layer name. */
  readonly colorScopeExceptions: ReadonlyArray<{
    readonly node: string;
    readonly reason: string;
    readonly scope: string;
    readonly token: string;
  }>;
  /** Figma variable scopes per colour token, as the design system declares them. */
  readonly colorScopes: Readonly<Record<string, readonly string[]>>;
  readonly colorSharingDecisions: Readonly<Record<string, ColorSharingDecision>>;
  /** [name, #RRGGBB or #RRGGBBAA, description]. */
  readonly colors: ReadonlyArray<readonly [name: string, hex: string, description: string]>;
  readonly componentInventory: ReadonlyArray<readonly [family: string, nodeName: RegExp]>;
  readonly contrastPairs: readonly ContrastPairContract[];
  readonly cvd: {
    readonly quoted: ReadonlyArray<readonly [string, string]>;
    readonly show: readonly string[];
  };
  readonly focus: FocusContract;
  readonly radiusScale: readonly number[];
  readonly spacingScale: readonly number[];
  readonly statusColorTokens: readonly string[];
  readonly surfaceContrast: {
    readonly controls: readonly SurfaceControlContract[];
    readonly disabled: {
      readonly pairs: ReadonlyArray<readonly [string, string]>;
    };
    readonly focusGrounds: readonly string[];
    readonly shadows: ReadonlyArray<readonly [effect: string, alpha: number, ground: string]>;
    readonly textPairs: ReadonlyArray<readonly [string, string]>;
  };
  readonly theme: ThemeContract;
}

export interface FlowSelector {
  readonly ancestor?: string;
  readonly kind: 'frame' | 'name' | 'prefix';
  readonly value?: string;
}

export interface FlowTransition {
  readonly cardinality: 'many' | 'one';
  readonly destination: string | null;
  readonly id: string;
  readonly motion?: string;
  readonly navigation: 'BACK' | 'NAVIGATE';
  readonly selector: FlowSelector;
  readonly sources: readonly string[];
  readonly timeoutSeconds?: number;
  readonly trigger: 'AFTER_TIMEOUT' | 'ON_CLICK';
}

export interface MotionTransition {
  duration: number;
  easing: {
    easingFunctionCubicBezier?: { x1: number; x2: number; y1: number; y2: number };
    type: string;
  };
  type: string;
}

export interface PrototypeContract {
  readonly frames: ReadonlyArray<{ readonly key: string; readonly title: string }>;
  readonly instantTransitionPrefixes: readonly string[];
  readonly motion: {
    readonly names: readonly string[];
    transition(name: string): MotionTransition;
  };
  readonly requiredReachableKeys: readonly string[];
  readonly startScreenKey: string;
  readonly transitions: readonly FlowTransition[];
  validateProductRules(): string[];
}

export interface StressContract {
  readonly boxes: ReadonlyArray<{
    readonly heights: readonly number[];
    readonly name: string;
    readonly widths: readonly number[];
    build(width: number, height: number): StressResult;
  }>;
  readonly frameSizes: ReadonlyArray<readonly [width: number, height: number]>;
  readonly screens: ReadonlyArray<{ readonly name: string; build(): StressResult }>;
  frameSize(): readonly [width: number, height: number];
  prepareMutations(): {
    readonly mutations: ReadonlyArray<readonly [label: string, apply: () => void]>;
    restore(): void;
  };
  setFrameSize(width: number, height: number): void;
}

export interface DocumentContract {
  readonly focusStrokeExemptions: ReadonlyArray<(node: MockNode) => boolean>;
  readonly prototype: PrototypeContract;
  readonly radiusExceptions: ReadonlyArray<{
    readonly label: string;
    readonly page: string;
    matches(node: MockNode): boolean;
  }>;
  readonly signatureComponents: ReadonlyArray<{
    readonly key: string;
    readonly node: string;
    readonly page: string;
    readonly topLevel: string;
  }>;
  readonly stress: StressContract;
}

export interface WorkspaceContract {
  readonly labPageKey: string;
  readonly pages: Readonly<Record<string, string>>;
  readonly protectedPageKeys: readonly string[];
}

export interface HarnessContract {
  readonly designSystem: DesignSystemContract;
  readonly document: DocumentContract;
  readonly workspace: WorkspaceContract;
}

/* The contract lives in the bundle's VM realm. Helpers return arrays created
 * in this realm so strict structural comparisons behave as expected. */

/** Page names in document order. */
export function workspacePageNames(workspace: WorkspaceContract): string[] {
  return Array.from(Object.values(workspace.pages));
}

export function protectedPageNames(workspace: WorkspaceContract): string[] {
  return Array.from(workspace.protectedPageKeys, (key) => workspace.pages[key]);
}

export function labPageName(workspace: WorkspaceContract): string {
  return workspace.pages[workspace.labPageKey];
}
