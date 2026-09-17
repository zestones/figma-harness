import { rgba } from '../../core/color.ts';
import type { ThemeContract } from '@figma-harness/contract';
import type { ThemeVerificationContext } from './context.ts';

/** The accent: readable inks, visible marks and tints that still read on the page. */
export function verifyAccent(context: ThemeVerificationContext, theme: ThemeContract): void {
  const { check, contrast, value } = context;
  console.log('\n--- accent and primary action ---');
  for (const [ink, ground, purpose] of theme.accent.readable) {
    const measured = contrast(ink, ground);
    check(measured >= 4.5, purpose + '   ' + measured.toFixed(2) + ':1');
  }
  for (const [mark, ground, purpose] of theme.accent.marks) {
    const measured = contrast(mark, ground);
    check(measured >= 3, purpose + '   ' + measured.toFixed(2) + ':1');
  }
  for (const [tint, surface, minimum] of theme.accent.tints) {
    if (rgba(value(tint)).a < 1) {
      check(false, tint + ' must be opaque to be measured as a tint');
      continue;
    }
    const measured = contrast(tint, surface);
    check(measured >= minimum, tint + ' reads against ' + surface + '   ' + measured.toFixed(3) + ':1 (minimum ' + minimum + ')');
  }
}
