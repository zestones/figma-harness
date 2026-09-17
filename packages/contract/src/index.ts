/* The interfaces shared by design systems, apps, the plugin and the harness. */

export type {
  AppDefinition,
  AppPrototype,
  LabExperiment,
  RadiusExceptionDefinition,
  ScreenDefinition,
  ScreenGroup,
  SignatureComponentDefinition,
  WorkspacePageKey,
} from './app.ts';
export type {
  DesignSystemDefinition,
  DocumentChrome,
  SheetDefinition,
  SheetGroup,
} from './design-system.ts';
export { defineFlowTransition } from './flows.ts';
export type {
  FlowNavigation,
  FlowSelector,
  FlowTransition,
  FlowTrigger,
  PrototypeEasing,
  PrototypeFlows,
  PrototypeTransition,
} from './flows.ts';
export { labPageName, protectedPageNames, workspacePageNames } from './harness.ts';
export type {
  StarterAction,
  StarterItem,
  StarterScreenOptions,
  StarterVocabulary,
} from './starter.ts';
export type {
  AuditedNode,
  CategoricalWaiver,
  ColorSharingDecision,
  ContrastPairContract,
  DesignSystemContract,
  DocumentContract,
  FocusContract,
  HarnessContract,
  MotionTransition,
  NeutralLadderContract,
  PrototypeContract,
  RadiusException,
  SignatureComponent,
  StressContract,
  SurfaceControlContract,
  ThemeContract,
  WorkspaceContract,
} from './harness.ts';
