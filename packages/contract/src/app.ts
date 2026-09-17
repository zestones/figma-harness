/* What an app gives the plugin: its screens, its prototype, and the evidence
 * the harness needs to exercise them. An app composes one design system's
 * public vocabulary and its own fixtures; it never touches the plugin. */

import type { FlowTransition } from './flows.ts';
import type { AuditedNode, StressContract } from './harness.ts';

export interface ScreenDefinition {
  readonly build: () => Promise<FrameNode>;
  /** Durable key stored in plugin data; never shown to people. */
  readonly key: string;
  readonly note?: string;
  /** Visible top-level frame name. */
  readonly title: string;
}

export interface ScreenGroup {
  readonly body: string;
  readonly letter: string;
  /** Screens that take part in the clickable prototype. */
  readonly prototype: boolean;
  readonly screens: readonly ScreenDefinition[];
  readonly title: string;
}

/** A disposable Design lab experiment, registered only while it is reviewed. */
export interface LabExperiment {
  readonly id: string;
  build(page: PageNode): Promise<void>;
}

/** A workspace page, by key: `screens`, `system` or `states` (the Design lab). */
export type WorkspacePageKey = 'screens' | 'states' | 'system';

/** A representative node whose settled structure is accepted on its own. */
export interface SignatureComponentDefinition {
  readonly key: string;
  readonly node: string;
  readonly page: WorkspacePageKey;
  readonly topLevel: string;
}

/** A reviewed corner radius outside the scale, on one workspace page. */
export interface RadiusExceptionDefinition {
  readonly label: string;
  matches(node: AuditedNode): boolean;
  readonly page: WorkspacePageKey;
}

export interface AppPrototype<Motion extends string = string> {
  /** Frames a person must be able to reach from the start screen. */
  readonly requiredReachableKeys: readonly string[];
  /** Transition id prefixes that must navigate without animation. */
  readonly instantTransitionPrefixes: readonly string[];
  readonly transitions: readonly FlowTransition<Motion>[];
  /** App-specific invariants, reported by the flow guard. */
  validateProductRules(): string[];
}

export interface AppDefinition<Motion extends string = string> {
  readonly name: string;
  /** Bump when screen keys or the prototype change: a document built from an
   *  older version is rewired completely on its next refresh. */
  readonly catalogVersion: string;
  readonly lab: readonly LabExperiment[];
  readonly prototype: AppPrototype<Motion>;
  readonly radiusExceptions: readonly RadiusExceptionDefinition[];
  readonly screenGroups: readonly ScreenGroup[];
  readonly signatureComponents: readonly SignatureComponentDefinition[];
  /** The frame a prototype presentation starts from. */
  readonly startScreenKey: string;
  readonly stress: StressContract;
}
