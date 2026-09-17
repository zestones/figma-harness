/* DataTable: Primer's bordered table with a muted header row. */

import { dim } from '../../foundations/dimensions.ts';
import { split } from '../../../engine/layout-math.ts';
import { f as createFrame } from '../../../engine/node-factory.ts';
import { t as createText } from '../../primitives/text.ts';
import { blankslate } from '../../components/feedback.ts';
import type { IconName } from '../../primitives/icons.ts';

type CellNode = SceneNode & LayoutMixin;

/** A plain value, or a builder that draws inside the column width. */
export type DataTableCell = string | ((width: number) => Promise<CellNode>);

export interface DataTableColumn {
  readonly align?: 'start' | 'end';
  readonly field: string;
  readonly header: string;
  /** The column that names the row: semibold, default ink. */
  readonly rowHeader?: boolean;
  /** Share of the available width. */
  readonly weight: number;
}

export interface DataTableRow {
  readonly cells: Readonly<Record<string, DataTableCell>>;
  readonly id: string;
}

export interface DataTableOptions {
  columns: readonly DataTableColumn[];
  empty?: { readonly description: string; readonly heading: string; readonly icon: IconName };
  name?: string;
  /** Node-name prefix of every row, used by prototype selectors. */
  rowPrefix?: string;
  rows: readonly DataTableRow[];
  w: number;
}

const ROW_HEIGHT = 44;
const HEADER_HEIGHT = 36;

export const dataTable = async function (options: DataTableOptions): Promise<FrameNode> {
  const table = await createFrame({
    name: 'data-table', dir: 'V', w: options.w, gap: 0, clip: true,
    radius: dim('borderRadius/medium'), fill: 'bgColor/default', stroke: 'borderColor/default', strokeW: 1,
  });
  if (options.name) table.setPluginData('spec.table.name', options.name);
  table.setPluginData('aria.role', 'table');
  const inner = options.w - 32;
  const widths = split(inner, options.columns.map((column) => column.weight), 12);
  const row = async function (name: string, height: number, header: boolean): Promise<FrameNode> {
    const frame = await createFrame({
      name, dir: 'H', w: options.w, h: height, gap: dim('base/size/12'),
      pad: [0, dim('base/size/16'), 0, dim('base/size/16')], align: 'CENTER',
      fill: header ? 'bgColor/muted' : null,
      stroke: 'borderColor/default', strokeSide: 'Top', strokeW: 1,
    });
    frame.setPluginData('aria.role', 'row');
    return frame;
  };
  const cell = function (column: DataTableColumn, width: number, height: number): Promise<FrameNode> {
    return createFrame({
      name: 'cell/' + column.field, dir: 'H', w: width, h: height, align: 'CENTER',
      justify: column.align === 'end' ? 'MAX' : 'MIN',
    });
  };

  const head = await row('data-table/header', HEADER_HEIGHT, true);
  head.strokes = [];
  for (let index = 0; index < options.columns.length; index++) {
    const column = options.columns[index];
    const holder = await cell(column, widths[index], HEADER_HEIGHT);
    holder.appendChild(await createText({
      style: 'body/small-600', text: column.header, color: 'fgColor/muted',
      w: widths[index], align: column.align === 'end' ? 'RIGHT' : 'LEFT', truncate: true,
    }));
    head.appendChild(holder);
  }
  table.appendChild(head);

  if (!options.rows.length && options.empty) {
    table.appendChild(await blankslate({
      w: options.w, icon: options.empty.icon, heading: options.empty.heading, description: options.empty.description,
    }));
    return table;
  }
  for (const record of options.rows) {
    const line = await row((options.rowPrefix || 'row/') + record.id, ROW_HEIGHT, false);
    for (let index = 0; index < options.columns.length; index++) {
      const column = options.columns[index];
      const holder = await cell(column, widths[index], ROW_HEIGHT);
      const value = record.cells[column.field];
      if (typeof value === 'function') holder.appendChild(await value(widths[index]));
      else {
        holder.appendChild(await createText({
          style: column.rowHeader ? 'body/medium-600' : 'body/medium',
          text: value == null ? '—' : value,
          color: column.rowHeader ? 'fgColor/default' : 'fgColor/muted',
          w: widths[index], align: column.align === 'end' ? 'RIGHT' : 'LEFT', truncate: true,
        }));
      }
      line.appendChild(holder);
    }
    table.appendChild(line);
  }
  return table;
};
