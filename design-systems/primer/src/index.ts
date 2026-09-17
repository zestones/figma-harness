/*
 * Primer's authoring vocabulary: the only module an app imports visuals from.
 *
 * It re-exports the engine calls authors need, so a page never reaches into
 * the engine or into this package's internals.
 */

export {
  ES,
  LEGAL_SPANS,
  P,
  TS,
  V,
  abs,
  add,
  below,
  bindDimensions,
  clearPage,
  cols,
  f,
  focusViewport,
  frameReuseKey,
  getPage,
  hex,
  inner,
  reuseFrame,
  setDimension,
  solid,
  span,
  split,
  spread,
  strut,
  strutForCol,
  strutForRow,
  verifyPrototypeReactionReadback,
  writePrototypeReactions,
} from '@figma-harness/engine';
export type {
  FrameOptions,
  PrototypeAction,
  PrototypeBackAction,
  PrototypeNodeAction,
  PrototypeReaction,
  PrototypeTransition,
} from '@figma-harness/engine';

export { COLORS, COLOR_SCOPES, COLOR_TOKEN_OWNERSHIP } from './foundations/colors.ts';
export type { ColorScope, ColorToken } from './foundations/colors.ts';
export { CVD, R } from './foundations/cvd.generated.ts';
export {
  BREAKPOINTS,
  CONTROL_SIZES,
  DIMS,
  OVERLAY_WIDTHS,
  RADII,
  SHELL_DIMENSIONS,
  SPACING,
  STACK,
  dim,
  sizeToken,
} from './foundations/dimensions.ts';
export type { ControlSize, DimensionName, DimensionToken } from './foundations/dimensions.ts';
export { ELEVATION } from './foundations/elevation.ts';
export type { ShadowName } from './foundations/elevation.ts';
export { FOCUS, FOCUS_OFFSETS, focusExtent } from './foundations/focus.ts';
export type { FocusPlacement } from './foundations/focus.ts';
export {
  MOTION_DURATIONS,
  MOTION_DURATION_ORDER,
  MOTION_EASINGS,
  MOTION_EASING_ORDER,
  MOTION_TRANSITIONS,
  MOTION_TRANSITION_ORDER,
  prototypeMotionTransition,
} from './foundations/motion.ts';
export type {
  MotionDurationName,
  MotionEasingName,
  MotionPrototypeTransition,
  MotionTransitionName,
} from './foundations/motion.ts';
export { PRIMER_VERSION } from './foundations/primer.generated.ts';
export {
  DATA_HUES,
  DATA_MUTED_TOKENS,
  DATA_OTHER,
  DATA_TOKENS,
  STATUS,
  STATUS_KINDS,
  dataToken,
  series,
  statusToken,
} from './foundations/semantics.ts';
export type {
  ColorFamily,
  DataHue,
  StatusKind,
  StatusTokenRole,
} from './foundations/semantics.ts';
export { FONT_FAMILIES, TYPE } from './foundations/typography.ts';
export type { TextStyleName, TextStyleSpec } from './foundations/typography.ts';

export { ICONS, OCTICONS_VERSION } from './primitives/icons.generated.ts';
export { icon } from './primitives/icons.ts';
export type { IconName } from './primitives/icons.ts';
export { glyph, spinner } from './primitives/glyph.ts';
export type { GlyphPath } from './primitives/glyph.ts';
export { dot, rect } from './primitives/primitives.ts';
export { lh, t } from './primitives/text.ts';
export type { TextOptions } from './primitives/text.ts';
export { withFocus } from './primitives/focus.ts';
export type { FocusOptions } from './primitives/focus.ts';
export { chartLegend, columnChart, niceMaximum } from './primitives/visualization.ts';
export type { ChartSeries, ColumnChartOptions } from './primitives/visualization.ts';

export { actionList, actionListItem, navList } from './components/action-list.ts';
export type { ActionListItemOptions, ActionListOptions } from './components/action-list.ts';
export { avatar, avatarStack } from './components/avatar.ts';
export type { AvatarOptions, AvatarStackOptions } from './components/avatar.ts';
export {
  BUTTON_METRICS,
  button,
  iconButton,
  resolveButtonAppearance,
} from './components/button.ts';
export type {
  ButtonAppearance,
  ButtonMetrics,
  ButtonOptions,
  ButtonVariant,
  IconButtonOptions,
} from './components/button.ts';
export {
  checkbox,
  radio,
  segmentedControl,
  toggleSwitch,
} from './components/choice.ts';
export type {
  CheckboxOptions,
  ChoiceOptions,
  SegmentedControlOptions,
  SegmentedOption,
  ToggleSwitchOptions,
} from './components/choice.ts';
export {
  banner,
  blankslate,
  inlineMessage,
  skeletonBox,
} from './components/feedback.ts';
export type {
  BannerOptions,
  BannerVariant,
  BlankslateOptions,
  InlineMessageVariant,
} from './components/feedback.ts';
export { formControl, validationMessage } from './components/form-control.ts';
export type { FormControlOptions, Validation } from './components/form-control.ts';
export { INTERACTION_STATES } from './components/interaction-state.ts';
export type { InteractionState } from './components/interaction-state.ts';
export {
  branchName,
  counterLabel,
  label,
  stateLabel,
  token,
} from './components/labels.ts';
export type {
  CounterLabelOptions,
  LabelOptions,
  LabelVariant,
  StateLabelOptions,
  StateLabelStatus,
  TokenOptions,
} from './components/labels.ts';
export {
  breadcrumbs,
  pagination,
  paginationPages,
  underlineNav,
} from './components/navigation.ts';
export type {
  BreadcrumbItem,
  PaginationOptions,
  UnderlineNavItem,
  UnderlineNavOptions,
} from './components/navigation.ts';
export {
  box,
  dialog,
  overlayBackdrop,
  tooltip,
} from './components/overlay.ts';
export type { BoxOptions, DialogOptions } from './components/overlay.ts';
export { progressBar } from './components/progress.ts';
export type { ProgressBarOptions, ProgressSegment } from './components/progress.ts';
export {
  inputAppearance,
  select,
  textarea,
  textInput,
} from './components/text-input.ts';
export type {
  InputState,
  SelectOptions,
  TextareaOptions,
  TextInputOptions,
} from './components/text-input.ts';
export { timeline } from './components/timeline.ts';
export type { TimelineItemOptions, TimelineOptions } from './components/timeline.ts';

export { appHeader } from './patterns/shell/app-header.ts';
export type { AppHeaderOptions } from './patterns/shell/app-header.ts';
export { pageLayout } from './patterns/shell/page-layout.ts';
export type { PageLayout, PageLayoutOptions } from './patterns/shell/page-layout.ts';
export { pageHeader } from './patterns/blocks/page-header.ts';
export type { PageHeaderOptions } from './patterns/blocks/page-header.ts';
export { dataTable } from './patterns/blocks/data-table.ts';
export type {
  DataTableCell,
  DataTableColumn,
  DataTableOptions,
  DataTableRow,
} from './patterns/blocks/data-table.ts';
