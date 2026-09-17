import {
  hex,
  ratio,
  simulate,
} from '../../core/color.ts';
import { toOklch, type Oklch } from '../../core/oklch.ts';
import { CVD_KINDS } from '../../core/palette-analysis.ts';

export type TokenValues = Readonly<Record<string, string>>;

export interface WorstContrast {
  readonly ratio: number;
  readonly vision: string;
}

export interface ThemeVerificationContext {
  check(ok: boolean, message: string): void;
  contrast(first: string, second: string): number;
  failureCount(): number;
  oklch(token: string): Oklch;
  value(token: string): string;
  /** The lowest contrast of a pair across normal vision and every simulated deficiency. */
  worstContrast(first: string, second: string): WorstContrast;
}

export function createVerificationContext(tokens: TokenValues): ThemeVerificationContext {
  let failures = 0;
  const value = (token: string): string => {
    const found = tokens[token];
    if (!found) throw new Error('the theme contract names an undeclared colour token: ' + token);
    return found;
  };
  const contrast = (first: string, second: string): number =>
    ratio(hex(value(first)), hex(value(second)));
  return {
    check(ok: boolean, message: string): void {
      if (!ok) failures++;
      console.log('  ' + (ok ? 'ok  ' : 'FAIL') + '  ' + message);
    },
    contrast,
    failureCount: (): number => failures,
    oklch: (token: string): Oklch => toOklch(value(token)),
    value,
    worstContrast(first: string, second: string): WorstContrast {
      let worst: WorstContrast = { ratio: contrast(first, second), vision: 'normal' };
      for (const kind of CVD_KINDS) {
        const simulated = ratio(simulate(hex(value(first)), kind), simulate(hex(value(second)), kind));
        if (simulated < worst.ratio) worst = { ratio: simulated, vision: kind };
      }
      return worst;
    },
  };
}
