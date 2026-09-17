'use strict';

import { loadContract } from '../../runtime/contract-loader.ts';
import type {
  ColorSharingDecision,
  DesignSystemContract,
} from '../../runtime/harness/contract.ts';

type ColorSharingPolicy = ColorSharingDecision['policy'];

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}(?:[0-9A-Fa-f]{2})?$/;

export type ResolvedColorToken = readonly [name: string, hex: string];

export interface ColorOwnershipGroup {
  readonly hex: string;
  readonly policy: ColorSharingPolicy;
  readonly rationale: string;
  readonly source: string;
  readonly tokens: readonly string[];
}

export interface ColorOwnershipReport {
  readonly groups: readonly ColorOwnershipGroup[];
  readonly issues: readonly string[];
}

function appendToMap<T>(map: Map<string, T[]>, key: string, value: T): void {
  const entries = map.get(key) || [];
  entries.push(value);
  map.set(key, entries);
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

export function analyzeColorOwnership(
  tokens: readonly ResolvedColorToken[],
  ownership: Readonly<Partial<Record<string, string>>>,
  decisions: Readonly<Partial<Record<string, ColorSharingDecision>>>,
): ColorOwnershipReport {
  const issues: string[] = [];
  const tokenNames = new Set<string>();
  const entriesByHex = new Map<string, ResolvedColorToken[]>();
  const entriesBySource = new Map<string, ResolvedColorToken[]>();

  for (const [name, rawHex] of tokens) {
    if (tokenNames.has(name)) issues.push(`token declared more than once: ${name}`);
    tokenNames.add(name);

    if (!HEX_PATTERN.test(rawHex)) {
      issues.push(`invalid colour for ${name}: ${rawHex}`);
      continue;
    }

    const hex = rawHex.toUpperCase();
    const entry: ResolvedColorToken = [name, hex];
    appendToMap(entriesByHex, hex, entry);

    const source = ownership[name];
    if (!source) {
      issues.push(`token has no ownership source: ${name}`);
      continue;
    }
    appendToMap(entriesBySource, source, entry);
  }

  for (const name of Object.keys(ownership)) {
    if (!tokenNames.has(name)) issues.push(`ownership source has no token: ${name}`);
  }

  const groups: ColorOwnershipGroup[] = [];
  for (const [source, entries] of entriesBySource) {
    const consumers = unique(entries.map(([name]) => name));
    if (consumers.length < 2) continue;

    const values = unique(entries.map(([, hex]) => hex));
    if (values.length !== 1) {
      issues.push(
        `shared source resolves to multiple values: ${source} → ${values.join(', ')}`,
      );
    }

    const decision = decisions[source];
    if (!decision) {
      issues.push(`shared source has no ownership decision: ${source} → ${consumers.join(', ')}`);
      continue;
    }
    if (values.length !== 1) continue;

    groups.push(Object.freeze({
      source,
      hex: values[0],
      tokens: Object.freeze(consumers),
      policy: decision.policy,
      rationale: decision.rationale,
    }));
  }

  for (const [hex, entries] of entriesByHex) {
    const consumers = unique(entries.map(([name]) => name));
    if (consumers.length < 2) continue;

    const sources = unique(consumers.flatMap((name) => {
      const source = ownership[name];
      return source ? [source] : [];
    }));
    if (sources.length !== 1) {
      issues.push(
        `unexplained exact alias ${hex}: ${consumers.join(', ')} use ${sources.length ? sources.join(', ') : 'no declared source'}`,
      );
    }
  }

  for (const source of Object.keys(decisions)) {
    const consumers = unique((entriesBySource.get(source) || []).map(([name]) => name));
    if (consumers.length < 2) {
      issues.push(`stale ownership decision: ${source} has ${consumers.length} semantic consumer(s)`);
    }
  }

  return Object.freeze({
    groups: Object.freeze(groups),
    issues: Object.freeze(issues),
  });
}

type ColorContract = Pick<DesignSystemContract, 'colorOwnership' | 'colorSharingDecisions' | 'colors'>;

function projectColors(contract?: ColorContract): ColorContract {
  return contract || loadContract().designSystem;
}

/** The shipped colour tokens, by name. */
export function readProjectColorTokens(contract?: ColorContract): Record<string, string> {
  return Object.fromEntries(projectColors(contract).colors.map(([name, hex]) => [name, hex]));
}

export function analyzeProjectColorOwnership(contract?: ColorContract): ColorOwnershipReport {
  const colors = projectColors(contract);
  return analyzeColorOwnership(
    colors.colors.map(([name, hex]): ResolvedColorToken => [name, hex]),
    colors.colorOwnership,
    colors.colorSharingDecisions,
  );
}
