import {
  dE,
  simulate,
  toHex,
  type ColorVisionDeficiency,
} from '../../../color/core/color.ts';
import type { ColorOwnershipReport } from '../../../color/core/token-source.ts';
import { loadContract } from '../../../runtime/contract-loader.ts';
import type { DesignSystemContract } from '../../../runtime/harness/contract.ts';
import type { AddFinding } from '../tree/types.ts';
import type { ColorLookup } from './surface-contrast.ts';

const fs = require('node:fs');
const path = require('node:path');
const { errorMessage } = require('../../../core/errors.ts') as {
  errorMessage(error: unknown): string;
};
const { table } = require('../../cvd-table.ts') as {
  table(
    colors: Readonly<Record<string, import('../../../color/core/color.ts').Color>> | undefined,
    cvd: DesignSystemContract['cvd'],
  ): Promise<CvdTable>;
};

type StoredCvdValue = number | string;
type CvdTable = Record<string, Record<string, StoredCvdValue>> & {
  normal: Record<string, string>;
  ratios: Record<string, number>;
};

const DEFICIENCIES: readonly ColorVisionDeficiency[] = [
  'protanopia',
  'deuteranopia',
  'tritanopia',
];

function sameHex(firstToken: string, secondToken: string, color: ColorLookup): boolean {
  const first = color(firstToken);
  const second = color(secondToken);
  return !!first && !!second && toHex(first) === toHex(second);
}

/** Category separation and the reviewed waivers declared by the design system. */
export function auditCategoricalSeparation(
  color: ColorLookup,
  adjacentPairs: ReadonlySet<string>,
  add: AddFinding,
  contract: Pick<DesignSystemContract, 'categorical'> = loadContract().designSystem,
): void {
  const { rampPrefixes, sameFamilyPrefixes, tokens, waivers } = contract.categorical;
  const waived = waivers.map(() => 0);
  const inRamp = (token: string): boolean => rampPrefixes.some((prefix) => token.startsWith(prefix));
  for (const deficiency of DEFICIENCIES) {
    for (let firstIndex = 0; firstIndex < tokens.length; firstIndex++) {
      for (let secondIndex = firstIndex + 1; secondIndex < tokens.length; secondIndex++) {
        const firstToken = tokens[firstIndex];
        const secondToken = tokens[secondIndex];
        const firstColor = color(firstToken);
        const secondColor = color(secondToken);
        if (!firstColor || !secondColor) continue;
        if (sameFamilyPrefixes.some((prefix) =>
          firstToken.startsWith(prefix) && secondToken.startsWith(prefix))) continue;
        if (sameHex(firstToken, secondToken, color)) continue;

        const simulatedFirst = simulate(firstColor, deficiency);
        const simulatedSecond = simulate(secondColor, deficiency);
        const distance = dE(simulatedFirst, simulatedSecond);
        const normalDistance = dE(firstColor, secondColor);
        if (distance >= 12) continue;

        const meet = adjacentPairs.has(firstToken + '|' + secondToken);
        const intraRamp = inRamp(firstToken) && inRamp(secondToken);
        const matched = waivers
          .map((waiver, index) => ({ index, waiver }))
          .filter(({ waiver }) => waiver.matches(firstToken, secondToken));
        for (const { index, waiver } of matched) {
          if (waiver.counts === 'always' || meet) waived[index]++;
        }
        const severity = !meet
          ? 'note'
          : intraRamp || matched.length ? 'WARN'
            : distance < 8 ? 'FAIL' : 'WARN';
        add(
          severity,
          '1.4.1',
          `${firstToken} vs ${secondToken} · ${deficiency}`,
          `ΔE ${distance.toFixed(1)} (normal vision ${normalDistance.toFixed(1)}) — ${toHex(simulatedFirst)} vs ${toHex(simulatedSecond)}`
          + (meet ? ' — and they appear together on screen' : ' — never painted within sight of each other')
          + (intraRamp && meet ? '. Two category colours, not a category error: the series name is rendered beside every swatch' : '')
          + matched.map(({ waiver }) => '. WAIVED: ' + waiver.detail).join(''),
        );
      }
    }
  }

  waivers.forEach((waiver, index) => {
    add('note', '1.4.1', waiver.label, waiver.summary(waived[index]));
  });
}

export async function auditGeneratedCvd(
  colors: Readonly<Record<string, import('../../../color/core/color.ts').Color>>,
  add: AddFinding,
  contract: Pick<DesignSystemContract, 'cvd'>,
): Promise<void> {
  try {
    const fresh = await table(colors, contract.cvd);
    const generatedPath = path.resolve(
      __dirname,
      '..', '..', '..', '..',
      'src', 'kit', 'foundations', 'cvd.generated.ts',
    );
    const onDisk = fs.readFileSync(generatedPath, 'utf8') as string;
    const match = onDisk.match(/export const CVD = ([\s\S]*?);\n/);
    const stored = match ? JSON.parse(match[1]) as CvdTable : null;
    const drift: string[] = [];
    for (const deficiency of Object.keys(fresh)) {
      for (const token of Object.keys(fresh[deficiency])) {
        const freshValue = fresh[deficiency][token];
        const storedValue = stored?.[deficiency]?.[token];
        if (freshValue !== storedValue) {
          drift.push(
            `${deficiency}/${token}: sheet shows ${storedValue || 'nothing'}, tokens now give ${freshValue}`,
          );
        }
      }
    }
    if (drift.length) {
      add(
        'FAIL',
        'generated',
        'src/kit/foundations/cvd.generated.ts is stale',
        `${drift.length} value(s) drifted — run npx tsx tools/accessibility/cvd-table.ts. ${drift[0]}`,
      );
    } else {
      add(
        'note',
        'generated',
        'src/kit/foundations/cvd.generated.ts matches the tokens',
        `${Object.keys(fresh.normal).length} colours × 3 deficiencies, re-derived and identical`,
      );
    }
  } catch (error: unknown) {
    add('FAIL', 'generated', 'CVD table could not be checked', errorMessage(error));
  }
}

export function auditTokenOwnership(
  report: ColorOwnershipReport,
  add: AddFinding,
): void {
  for (const issue of report.issues) {
    add(
      'FAIL',
      'tokens',
      'semantic colour ownership is incomplete',
      issue,
    );
  }

  const linked = report.groups.filter((group) => group.policy === 'linked-aliases');
  const independent = report.groups.filter((group) => group.policy === 'independent-semantics');
  add(
    'note',
    'tokens',
    'categorical aliases have one owner',
    linked.length
      ? `${linked.length}: ${linked.map((group) => group.tokens.join(' = ')).join(' · ')} — each pair is generated from one private categorical source`
      : 'none — no categorical aliases are declared',
  );
  add(
    'note',
    'tokens',
    'every shared value has an ownership decision',
    report.groups.length
      ? `${report.groups.length} declared group(s): ${linked.length} linked alias(es), ${independent.length} independent semantic contract(s); ${report.issues.length} unexplained`
      : 'none — every token resolves to its own value',
  );
}
