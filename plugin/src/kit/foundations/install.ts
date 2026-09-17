/* Tokens: idempotent Figma installation of variables, text and effect styles. */

import {
  hex,
  loadTokens,
} from '../../engine/figma-resources.ts';
import { fontName, fontsLoaded, loadFonts } from '../../engine/font-loader.ts';
import { COLORS, COLOR_SCOPES } from './colors.ts';
import { TOKEN_COLLECTIONS } from './collections.ts';
import { DIMS } from './dimensions.ts';
import { ELEVATION } from './elevation.ts';
import { FONTS, TYPE } from './typography.ts';

/** Load every font the text styles use. Call before ensureTokens(). */
export const loadDesignFonts = function (): Promise<void> {
  return loadFonts(FONTS);
};

const collection = function (
  collections: readonly VariableCollection[],
  name: string,
): VariableCollection {
  return collections.find((candidate) => candidate.name === name)
    || figma.variables.createVariableCollection(name);
};

export const ensureTokens = async function () {
  // Text styles name resolved fonts; load them if the caller has not.
  if (!fontsLoaded(FONTS)) await loadDesignFonts();
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const colorCollection = collection(collections, TOKEN_COLLECTIONS.color);
  const sizeCollection = collection(collections, TOKEN_COLLECTIONS.dimension);

  const existing = new Map<string, Variable>();
  for (const variable of await figma.variables.getLocalVariablesAsync()) {
    if (variable.variableCollectionId === colorCollection.id && variable.resolvedType === 'COLOR') {
      existing.set('COLOR:' + variable.name, variable);
    }
    if (variable.variableCollectionId === sizeCollection.id && variable.resolvedType === 'FLOAT') {
      existing.set('FLOAT:' + variable.name, variable);
    }
  }

  for (const [name, value, description] of COLORS) {
    const variable = existing.get('COLOR:' + name)
      || figma.variables.createVariable(name, colorCollection, 'COLOR');
    // Reconcile scopes and descriptions of variables installed by an earlier build too.
    variable.scopes = [...(COLOR_SCOPES[name] || ['ALL_SCOPES'])] as VariableScope[];
    variable.description = description;
    variable.setValueForMode(colorCollection.modes[0].modeId, hex(value));
  }
  for (const token of DIMS) {
    const variable = existing.get('FLOAT:' + token.name)
      || figma.variables.createVariable(token.name, sizeCollection, 'FLOAT');
    variable.scopes = [...token.scopes];
    variable.description = token.description;
    variable.setValueForMode(sizeCollection.modes[0].modeId, token.value);
  }

  const textStyles = new Map((await figma.getLocalTextStylesAsync()).map((style) => [style.name, style]));
  for (const spec of TYPE) {
    const style = textStyles.get(spec.name) || figma.createTextStyle();
    style.name = spec.name;
    style.fontName = fontName(spec.family, spec.style);
    style.fontSize = spec.size;
    style.lineHeight = { unit: 'PIXELS', value: spec.lineHeight };
    style.letterSpacing = { unit: 'PERCENT', value: 0 };
    style.textCase = 'ORIGINAL';
    style.description = spec.description;
  }

  const effectStyles = new Map((await figma.getLocalEffectStylesAsync()).map((style) => [style.name, style]));
  for (const shadow of ELEVATION) {
    const style = effectStyles.get(shadow.name) || figma.createEffectStyle();
    style.name = shadow.name;
    style.effects = shadow.effects;
    style.description = shadow.description;
  }

  await loadTokens(TOKEN_COLLECTIONS);
};
