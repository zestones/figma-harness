import type { ThemeContract } from '../../../runtime/harness/contract.ts';
import type { ThemeVerificationContext } from './context.ts';

/* Below this chroma a hue angle is noise, so it does not count toward drift. */
const HUE_CHROMA_FLOOR = 0.009;

const hueDistance = function (first: number, second: number): number {
  const distance = Math.abs(first - second) % 360;
  return distance > 180 ? 360 - distance : distance;
};

/** Neutral chroma and hue, surface ladders and the ink ramp. */
export function verifyNeutrals(context: ThemeVerificationContext, theme: ThemeContract): void {
  const { check, contrast, oklch } = context;

  console.log('\n--- neutrals stay neutral ---');
  let peak = 0;
  let peakToken = '';
  for (const token of theme.neutralTokens) {
    const chroma = oklch(token).C;
    if (chroma > peak) {
      peak = chroma;
      peakToken = token;
    }
  }
  check(peak <= theme.maximumNeutralChroma,
    'peak neutral chroma ' + peak.toFixed(4) + ' (' + peakToken + ', ceiling ' + theme.maximumNeutralChroma + ')');

  const tinted = theme.neutralTokens
    .map((token) => ({ token, color: oklch(token) }))
    .filter((entry) => entry.color.C >= HUE_CHROMA_FLOOR);
  if (tinted.length) {
    let x = 0;
    let y = 0;
    for (const { color } of tinted) {
      x += color.C * Math.cos(color.h * Math.PI / 180);
      y += color.C * Math.sin(color.h * Math.PI / 180);
    }
    const family = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    let drift = 0;
    let driftToken = '';
    for (const { token, color } of tinted) {
      const distance = hueDistance(color.h, family);
      if (distance > drift) {
        drift = distance;
        driftToken = token;
      }
    }
    check(drift <= theme.maximumNeutralHueDrift,
      'neutral hue ' + family.toFixed(0) + ' deg, worst drift ' + drift.toFixed(1) + ' deg (' + driftToken + ')');
  } else {
    check(true, 'every neutral is achromatic');
  }

  console.log('\n--- surface ladders ---');
  for (const ladder of theme.ladders) {
    for (let index = 0; index + 1 < ladder.tokens.length; index++) {
      const first = ladder.tokens[index];
      const second = ladder.tokens[index + 1];
      const step = contrast(first, second);
      check(step >= ladder.minimumStep,
        first + ' -> ' + second + '   ' + step.toFixed(3) + ':1 (minimum ' + ladder.minimumStep + ')');
    }
  }

  console.log('\n--- ink ramp: every rung a step apart ---');
  for (let index = 0; index + 1 < theme.inkRamp.length; index++) {
    const first = theme.inkRamp[index];
    const second = theme.inkRamp[index + 1];
    const delta = oklch(second).L - oklch(first).L;
    check(delta >= theme.minimumInkStep,
      first + ' -> ' + second + '   deltaL ' + delta.toFixed(3) + ' (minimum ' + theme.minimumInkStep + ')');
  }

  console.log('\n--- ink on the grounds it lands on ---');
  for (const ink of theme.inkRamp) {
    for (const ground of theme.inkGrounds) {
      const measured = contrast(ink, ground);
      check(measured >= 4.5, ink + ' on ' + ground + '   ' + measured.toFixed(2) + ':1');
    }
  }
}

/** The focus ring must reach 3:1 on every ground, whatever the reader's colour vision. */
export function verifyFocusGrounds(
  context: ThemeVerificationContext,
  focusToken: string,
  grounds: readonly string[],
): void {
  console.log('\n--- focus ring under every simulated vision ---');
  for (const ground of grounds) {
    const worst = context.worstContrast(focusToken, ground);
    context.check(worst.ratio >= 3,
      focusToken + ' on ' + ground + '   ' + worst.ratio.toFixed(2) + ':1 (' + worst.vision + ')');
  }
}
