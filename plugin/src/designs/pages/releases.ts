/* 02 · Releases: every release, searchable and filterable, one page at a time. */

import { RELAY } from '../../fixtures/public.ts';
import {
  button,
  dim,
  f as createFrame,
  pageHeader,
  pagination,
  segmentedControl,
  strut as createStrut,
  strutForRow,
  t as createText,
  textInput,
} from '../../kit/public.ts';
import { releaseList } from './cells.ts';
import { shell } from './frame.ts';

export interface ReleasesOptions {
  name: string;
}

const PAGE_SIZE = 8;

export const screenReleases = async function (options: ReleasesOptions): Promise<FrameNode> {
  const data = RELAY;
  const layout = await shell({ name: options.name, section: 'Releases' });
  const width = layout.contentWidth;
  const content = layout.content;

  content.appendChild(await pageHeader({
    w: width,
    title: 'Releases',
    actions: [await button({ label: 'Draft a new release', variant: 'primary', leadingVisual: 'plus' })],
    description: await createText({
      style: 'body/medium', color: 'fgColor/muted', w: width,
      text: data.counts.open + ' open · ' + data.counts.shipped + ' shipped',
    }),
  }));

  const toolbar = await createFrame({ name: 'filters', dir: 'H', w: width, gap: dim('stack/gap/condensed'), align: 'CENTER' });
  const search = await textInput({
    w: Math.min(360, Math.max(160, width - 360)), leadingVisual: 'search',
    placeholder: 'Search all releases', accessibleName: 'Search releases',
  });
  const filters = [
    await button({ label: 'Label', trailingAction: true }),
    await button({ label: 'Author', trailingAction: true }),
  ];
  const sort = await button({ label: 'Newest', leadingVisual: 'sort-desc', trailingAction: true });
  toolbar.appendChild(search);
  for (const filter of filters) toolbar.appendChild(filter);
  toolbar.appendChild(await createStrut(strutForRow(toolbar, [search, ...filters, sort]), 1));
  toolbar.appendChild(sort);
  content.appendChild(toolbar);

  const scope = await segmentedControl({
    accessibleName: 'Release state', size: 'small',
    options: [
      { label: 'All', selected: true },
      { label: 'Open', icon: 'rocket' },
      { label: 'Shipped', icon: 'check-circle' },
    ],
  });
  content.appendChild(await releaseList(data, data.releases.slice(0, PAGE_SIZE), width, {
    title: 'All releases', count: data.counts.total, actions: [scope],
  }));

  if (data.counts.total > PAGE_SIZE) {
    const footer = await createFrame({ name: 'releases/pagination', dir: 'H', w: width, justify: 'CENTER', pad: [dim('base/size/8'), 0, 0, 0] });
    footer.appendChild(await pagination({ currentPage: 1, pageCount: Math.ceil(data.counts.total / PAGE_SIZE) }));
    content.appendChild(footer);
  }
  layout.fit();
  return layout.frame;
};
