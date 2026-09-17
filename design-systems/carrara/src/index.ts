/*
 * Carrara's authoring vocabulary: the only module an app imports visuals from.
 *
 * It re-exports the engine calls authors need, so a page never reaches into
 * the engine or into this package's internals.
 */

export {
  P,
  V,
  abs,
  add,
  f,
  frameReuseKey,
  reuseFrame,
  solid,
  spread,
  strut,
  strutForCol,
  strutForRow,
} from '@figma-harness/engine';
export type { FrameOptions } from '@figma-harness/engine';

export { COLORS, COLOR_SCOPES, PALETTE } from './foundations/colors.ts';
export type { ColorScope, ColorToken, PaletteName } from './foundations/colors.ts';
export { CVD, R } from './foundations/cvd.generated.ts';
export { DIMS, RADII, SPACING, dim } from './foundations/dimensions.ts';
export type { DimensionName } from './foundations/dimensions.ts';
export { ELEVATION } from './foundations/elevation.ts';
export type { ShadowName } from './foundations/elevation.ts';
export { FOCUS, FOCUS_EXTENT } from './foundations/focus.ts';
export { MOTION, MOTION_NAMES, motionTransition } from './foundations/motion.ts';
export type { MotionName } from './foundations/motion.ts';
export { FONT_FAMILY, MONO_FAMILY, TYPE, lineHeight } from './foundations/typography.ts';
export type { TextStyleName, TextStyleSpec } from './foundations/typography.ts';

export { AVATAR_SIZES, avatar } from './primitives/avatar.ts';
export type { AvatarOptions, AvatarSize, AvatarTone } from './primitives/avatar.ts';
export { withFocus } from './primitives/focus.ts';
export { ICON_NAMES, icon } from './primitives/icon.ts';
export type { IconName, IconSize } from './primitives/icon.ts';
export { HEROICONS_VERSION } from './primitives/icons.generated.ts';
export { dot, kbd, rule } from './primitives/shapes.ts';
export { text } from './primitives/text.ts';
export type { TextOptions } from './primitives/text.ts';
export { areaChart, chartLegend, smoothPath, sparkline } from './primitives/visualization.ts';
export type {
  AreaChartOptions,
  ChartHighlight,
  ChartSeries,
  LegendItem,
  SparklineOptions,
} from './primitives/visualization.ts';

export { alert, toast } from './components/alert.ts';
export type { AlertOptions, ToastOptions } from './components/alert.ts';
export { BADGE_TONES, TONE_COLORS, badge, trend } from './components/badge.ts';
export type { BadgeOptions, BadgeTone, TrendOptions } from './components/badge.ts';
export { BUTTON_STATES, BUTTON_VARIANTS, button, iconButton } from './components/button.ts';
export type { ButtonOptions, ButtonSize, ButtonState, ButtonVariant, IconButtonOptions } from './components/button.ts';
export { card, matchHeights } from './components/card.ts';
export type { CardLayout, CardOptions } from './components/card.ts';
export { checkbox, toggle } from './components/choice.ts';
export type { ChoiceOptions } from './components/choice.ts';
export { descriptionList, factStrip } from './components/description-list.ts';
export type { Description, Fact } from './components/description-list.ts';
export { dialog, scrim } from './components/dialog.ts';
export type { DialogAction, DialogOptions } from './components/dialog.ts';
export { emptyState } from './components/empty-state.ts';
export type { EmptyStateOptions } from './components/empty-state.ts';
export { FIELD_STATES, field, select } from './components/field.ts';
export type { FieldOptions, FieldState } from './components/field.ts';
export { listRow } from './components/list-row.ts';
export type { ListRowOptions } from './components/list-row.ts';
export { menu } from './components/menu.ts';
export type { MenuItem } from './components/menu.ts';
export { pagination } from './components/pagination.ts';
export type { PaginationOptions } from './components/pagination.ts';
export { barList, progress } from './components/progress.ts';
export type { BarListRow, ProgressOptions } from './components/progress.ts';
export { stat } from './components/stat.ts';
export type { StatOptions } from './components/stat.ts';
export {
  actionCell,
  amountCell,
  badgeCell,
  codeCell,
  iconCell,
  personCell,
  stackedCell,
  table,
  textCell,
} from './components/table.ts';
export type { TableCell, TableColumn, TableOptions, TableRow } from './components/table.ts';
export { segmented, tabs } from './components/tabs.ts';
export type { SegmentItem, TabItem } from './components/tabs.ts';
export { timeline } from './components/timeline.ts';
export type { TimelineEvent } from './components/timeline.ts';

export { pageHeader } from './patterns/page-header.ts';
export type { Crumb, PageHeaderOptions } from './patterns/page-header.ts';
export { shell } from './patterns/shell.ts';
export type { ShellLayout, ShellOptions } from './patterns/shell.ts';
export { sidebar } from './patterns/sidebar.ts';
export type { NavItem, NavSection, SidebarOptions, SidebarUser } from './patterns/sidebar.ts';
export { starter } from './patterns/starter.ts';
export { topbar } from './patterns/topbar.ts';
export type { TopbarOptions } from './patterns/topbar.ts';
