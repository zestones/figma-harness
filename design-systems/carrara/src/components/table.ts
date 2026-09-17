/* Table: a header and rows of cells, sized from column weights. Cells are
 * built by small helpers, so a page composes rows without drawing. */

import { f as frame } from '@figma-harness/engine';
import { dim } from '../foundations/dimensions.ts';
import { lineHeight } from '../foundations/typography.ts';
import { avatar } from '../primitives/avatar.ts';
import { icon, type IconName } from '../primitives/icon.ts';
import { text } from '../primitives/text.ts';
import { badge, type BadgeOptions } from './badge.ts';
import { iconButton } from './button.ts';

export type TableCell = (width: number) => Promise<SceneNode>;

export interface TableColumn {
  align?: 'LEFT' | 'RIGHT';
  header: string;
  key: string;
  /** Sorted by this column, in this direction. */
  sorted?: 'asc' | 'desc';
  /** A share of the free width; 1 by default. */
  weight?: number;
  /** A fixed width, for icons and short values. */
  width?: number;
}

export interface TableRow {
  /** A cell for each column key; a column without one stays empty. */
  readonly cells: Readonly<Partial<Record<string, TableCell>>>;
  /** The layer name, which flows select, such as payment-row/<id>. */
  readonly name: string;
  readonly selected?: boolean;
}

export interface TableOptions {
  columns: readonly TableColumn[];
  /** Shown instead of the rows when there are none. */
  empty?: (width: number) => Promise<SceneNode>;
  label: string;
  name?: string;
  rows: readonly TableRow[];
  w: number;
}

const SIDE = 20;
const GAP = 16;

const columnWidths = function (columns: readonly TableColumn[], width: number): number[] {
  const free = width - SIDE * 2 - GAP * (columns.length - 1)
    - columns.reduce((sum, column) => sum + (column.width || 0), 0);
  const weights = columns.reduce((sum, column) => sum + (column.width ? 0 : column.weight || 1), 0);
  const widths = columns.map((column) => column.width || Math.floor(free * (column.weight || 1) / weights));
  const flexible = columns.findIndex((column) => !column.width);
  const used = widths.reduce((sum, value) => sum + value, 0) + SIDE * 2 + GAP * (columns.length - 1);
  if (flexible >= 0) widths[flexible] += width - used;
  if (widths.some((value) => value < 24)) throw new Error('a table column is narrower than 24 px at ' + width + ' px');
  return widths;
};

/* A cell with nothing in it keeps a line's height: Figma never shrinks an
   empty auto-layout frame to fit, so it would stay 100 px tall. */
const cellFrame = async function (column: TableColumn, width: number, emptyHeight?: number): Promise<FrameNode> {
  return frame({
    name: 'cell/' + column.key, dir: 'H', w: width, h: emptyHeight, gap: dim('space/4'), align: 'CENTER',
    justify: column.align === 'RIGHT' ? 'MAX' : 'MIN',
  });
};

export const table = async function (options: TableOptions): Promise<FrameNode> {
  const widths = columnWidths(options.columns, options.w);
  const root = await frame({ name: options.name || 'table', dir: 'V', w: options.w });
  const head = await frame({
    name: 'table-head', dir: 'H', w: options.w, gap: GAP, align: 'CENTER', fill: 'bg/subtle',
    pad: [dim('space/12'), SIDE, dim('space/12'), SIDE], stroke: 'border/default', strokeSide: 'Bottom', strokeW: 1,
  });
  for (const [index, column] of options.columns.entries()) {
    const empty = !column.header && !column.sorted;
    const cell = await cellFrame(column, widths[index], empty ? lineHeight('body/sm-medium') : undefined);
    const room = widths[index] - (column.sorted ? 20 : 0);
    if (column.header) {
      cell.appendChild(await text({ style: 'body/sm-medium', text: column.header, color: 'text/tertiary', maxW: room }));
    }
    if (column.sorted) cell.appendChild(icon(column.sorted === 'asc' ? 'chevron-up' : 'chevron-down', 'text/tertiary', 16));
    cell.setPluginData('aria.role', 'columnheader');
    if (column.sorted) cell.setPluginData('aria.sort', column.sorted === 'asc' ? 'ascending' : 'descending');
    head.appendChild(cell);
  }
  head.setPluginData('aria.role', 'row');
  root.appendChild(head);
  for (const [rowIndex, row] of options.rows.entries()) {
    const line = await frame({
      name: row.name, dir: 'H', w: options.w, gap: GAP, align: 'CENTER',
      pad: [dim('space/12'), SIDE, dim('space/12'), SIDE], fill: row.selected ? 'accent/subtle' : false,
      stroke: rowIndex ? 'border/default' : null, strokeSide: 'Top', strokeW: 1,
    });
    for (const [index, column] of options.columns.entries()) {
      const build = row.cells[column.key];
      const cell = await cellFrame(column, widths[index], build ? undefined : lineHeight('body/md'));
      if (build) cell.appendChild(await build(widths[index]));
      cell.setPluginData('aria.role', 'cell');
      line.appendChild(cell);
    }
    line.setPluginData('aria.role', 'row');
    if (row.selected) line.setPluginData('aria.selected', 'true');
    root.appendChild(line);
  }
  if (!options.rows.length && options.empty) root.appendChild(await options.empty(options.w));
  root.setPluginData('aria.role', 'table');
  root.setPluginData('aria.accessible-name', options.label);
  return root;
};

/* --- cells ---------------------------------------------------------------- */

/** Plain text, cut to the column. */
export const textCell = function (value: string, tone: 'primary' | 'secondary' = 'secondary'): TableCell {
  return (width) => text({
    style: tone === 'primary' ? 'body/md-medium' : 'body/md', text: value, maxW: width,
    color: tone === 'primary' ? 'text/primary' : 'text/secondary',
  });
};

/** A value over a detail, such as a description over its date in a narrow table. */
export const stackedCell = function (value: string, detail: string): TableCell {
  return async (width) => {
    const words = await frame({ name: 'stacked', dir: 'V', w: width });
    words.appendChild(await text({ style: 'body/md-medium', text: value, w: width, truncate: true }));
    words.appendChild(await text({ style: 'body/sm', text: detail, color: 'text/tertiary', w: width, truncate: true }));
    return words;
  };
};

/** An identifier in monospace. */
export const codeCell = function (value: string): TableCell {
  return (width) => text({ style: 'mono/sm', text: value, color: 'text/secondary', maxW: width });
};

/** A name over a detail, with an avatar. */
export const personCell = function (name: string, detail: string, initials: string): TableCell {
  return async (width) => {
    const row = await frame({ name: 'person', dir: 'H', w: width, gap: dim('space/12'), align: 'CENTER' });
    row.appendChild(await avatar({ initials, label: name, size: 32 }));
    const room = width - 32 - row.itemSpacing;
    const words = await frame({ name: 'person-text', dir: 'V', w: room });
    words.appendChild(await text({ style: 'body/md-medium', text: name, w: room, truncate: true }));
    words.appendChild(await text({ style: 'body/sm', text: detail, color: 'text/tertiary', w: room, truncate: true }));
    row.appendChild(words);
    return row;
  };
};

/** An amount, with its currency in a lighter tone when the column has room for it. */
export const amountCell = function (amount: string, currency?: string): TableCell {
  return async (width) => {
    const row = await frame({ name: 'amount', dir: 'H', gap: dim('space/4'), align: 'BASELINE' });
    const value = await text({ style: 'body/md-strong', text: amount, maxW: width });
    row.appendChild(value);
    if (currency) {
      const unit = await text({ style: 'body/sm', text: currency, color: 'text/tertiary' });
      if (value.width + row.itemSpacing + unit.width <= width) row.appendChild(unit);
      else unit.remove();
    }
    return row;
  };
};

export const badgeCell = function (options: BadgeOptions): TableCell {
  return () => badge(options);
};

/** A value after an icon, such as a payment method. */
export const iconCell = function (glyph: IconName, value: string): TableCell {
  return async (width) => {
    const row = await frame({ name: 'icon-value', dir: 'H', gap: dim('space/8'), align: 'CENTER' });
    row.appendChild(icon(glyph, 'text/tertiary', 20));
    row.appendChild(await text({ style: 'body/md', text: value, color: 'text/secondary', maxW: width - 28 }));
    return row;
  };
};

/** The row's menu. */
export const actionCell = function (label: string, name: string): TableCell {
  return () => iconButton({ icon: 'ellipsis-horizontal', label, name, size: 'sm' });
};
