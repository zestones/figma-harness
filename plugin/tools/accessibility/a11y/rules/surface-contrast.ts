import {
  flatten,
  over,
  ratio,
  type Color,
  type ColorAlpha,
} from '../../../color/core/color.ts';
import type { DesignSystemContract } from '../../../runtime/harness/contract.ts';
import type { AddFinding } from '../tree/types.ts';

export type ColorLookup = (token: string) => ColorAlpha | undefined;

const WHITE: Color = { r: 255, g: 255, b: 255 };

/** Token-level invariants declared by the design system's audit contract. */
export function auditSurfaceContrast(
  color: ColorLookup,
  add: AddFinding,
  contract: Pick<DesignSystemContract, 'focus' | 'surfaceContrast'>,
): void {
  const { controls, disabled, focusGrounds, shadows, textPairs } = contract.surfaceContrast;
  const opaque = (token: string): Color | undefined => {
    const value = color(token);
    return value && flatten(value, WHITE);
  };
  for (const { subject, edge: edgeToken, outside: outsideToken, interactive, waiver } of controls) {
    const edge = color(edgeToken);
    const outside = opaque(outsideToken);
    if (!edge || !outside) {
      add('FAIL', '1.4.11', subject, 'the contract names an undeclared token: ' + (!edge ? edgeToken : outsideToken));
      continue;
    }
    const contrast = ratio(flatten(edge, outside), outside);
    if (contrast >= 3) continue;
    const measured = `${edgeToken} on ${outsideToken} = ${contrast.toFixed(2)}:1`;
    if (interactive && waiver) {
      add('WARN', '1.4.11', subject, measured + ', under 3:1. WAIVED: ' + waiver);
    } else if (interactive) {
      add('FAIL', '1.4.11', subject, measured + ', needs 3:1 — this edge IDENTIFIES an interactive control');
    } else {
      add('note', '1.4.11', subject, measured + ' — exempt (not a control), but it is the only thing separating these regions');
    }
  }

  const focus = opaque(contract.focus.token);
  if (focus) {
    for (const groundToken of focusGrounds) {
      const ground = opaque(groundToken);
      if (!ground) continue;
      const contrast = ratio(focus, ground);
      if (contrast < 3) {
        add('FAIL', '2.4.13', 'focus outline on ' + groundToken,
          `${contrast.toFixed(2)}:1 between focused and unfocused pixels, needs 3:1`);
      }
    }
  }

  for (const [name, alpha, backgroundToken] of shadows) {
    const background = opaque(backgroundToken);
    if (!background) continue;
    const shadowed = over({ r: 0, g: 0, b: 0 }, alpha, background);
    const contrast = ratio(shadowed, background);
    if (contrast < 3) {
      add('note', 'elevation', `shadow '${name}' on ${backgroundToken}`,
        `darkest layer composites to ${contrast.toFixed(2)}:1 — a shadow can SUGGEST raised, it cannot IDENTIFY a control`);
    }
  }

  for (const [inkToken, backgroundToken] of textPairs) {
    const ink = color(inkToken);
    const background = opaque(backgroundToken);
    if (!ink || !background) continue;
    const contrast = ratio(flatten(ink, background), background);
    if (contrast < 4.5) {
      add(contrast < 3 ? 'FAIL' : 'WARN', '1.4.3', `${inkToken} on ${backgroundToken}`,
        `${contrast.toFixed(2)}:1 — body text needs 4.5:1 (3:1 only at 18.66 px bold / 24 px regular)`);
    }
  }

  for (const [inkToken, backgroundToken] of disabled.pairs) {
    const ink = color(inkToken);
    const background = opaque(backgroundToken);
    if (!ink || !background) continue;
    const contrast = ratio(flatten(ink, background), background);
    add('note', '1.4.3 exempt', `disabled ${inkToken} on ${backgroundToken}`,
      `${contrast.toFixed(2)}:1 — inactive controls are exempt, but this is what a reader actually gets`);
  }
}
