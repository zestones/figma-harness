/* Idempotent installation of a design system's variables, text styles and
 * effect styles. The design system supplies the data; this module owns the
 * Figma calls and the reconciliation of an earlier install. */

import { hex, loadTokens, type TokenCollectionNames } from './figma-resources.ts';
import { fontName, fontsLoaded, loadFonts } from './font-loader.ts';

export interface SizeTokenSpec {
  readonly description: string;
  readonly name: string;
  readonly scopes: readonly string[];
  readonly value: number;
}

export interface TextStyleTokenSpec {
  readonly description: string;
  readonly family: string;
  readonly lineHeight: number;
  readonly name: string;
  readonly size: number;
  readonly style: string;
}

export interface EffectStyleTokenSpec {
  readonly description: string;
  readonly effects: readonly Effect[];
  readonly name: string;
}

export interface TokenSet {
  readonly collections: TokenCollectionNames;
  /** Read at install time, so an in-place override is honoured. */
  readonly colors: ReadonlyArray<readonly [name: string, hex: string, description: string]>;
  readonly colorScopes: Readonly<Record<string, readonly string[]>>;
  readonly effectStyles: readonly EffectStyleTokenSpec[];
  readonly fonts: readonly FontName[];
  readonly sizes: readonly SizeTokenSpec[];
  readonly textStyles: readonly TextStyleTokenSpec[];
}

const collection = function (
  collections: readonly VariableCollection[],
  name: string,
): VariableCollection {
  return collections.find((candidate) => candidate.name === name)
    || figma.variables.createVariableCollection(name);
};

export const installTokens = async function (tokens: TokenSet): Promise<void> {
  // Text styles name resolved fonts; load them if the caller has not.
  if (!fontsLoaded(tokens.fonts)) await loadFonts(tokens.fonts);
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const colorCollection = collection(collections, tokens.collections.color);
  const sizeCollection = collection(collections, tokens.collections.dimension);

  const existing = new Map<string, Variable>();
  for (const variable of await figma.variables.getLocalVariablesAsync()) {
    if (variable.variableCollectionId === colorCollection.id && variable.resolvedType === 'COLOR') {
      existing.set('COLOR:' + variable.name, variable);
    }
    if (variable.variableCollectionId === sizeCollection.id && variable.resolvedType === 'FLOAT') {
      existing.set('FLOAT:' + variable.name, variable);
    }
  }

  for (const [name, value, description] of tokens.colors) {
    const variable = existing.get('COLOR:' + name)
      || figma.variables.createVariable(name, colorCollection, 'COLOR');
    // Reconcile scopes and descriptions of variables installed by an earlier build too.
    variable.scopes = [...(tokens.colorScopes[name] || ['ALL_SCOPES'])] as VariableScope[];
    variable.description = description;
    variable.setValueForMode(colorCollection.modes[0].modeId, hex(value));
  }
  for (const token of tokens.sizes) {
    const variable = existing.get('FLOAT:' + token.name)
      || figma.variables.createVariable(token.name, sizeCollection, 'FLOAT');
    variable.scopes = [...token.scopes] as VariableScope[];
    variable.description = token.description;
    variable.setValueForMode(sizeCollection.modes[0].modeId, token.value);
  }

  const textStyles = new Map((await figma.getLocalTextStylesAsync()).map((style) => [style.name, style]));
  for (const spec of tokens.textStyles) {
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
  for (const shadow of tokens.effectStyles) {
    const style = effectStyles.get(shadow.name) || figma.createEffectStyle();
    style.name = shadow.name;
    style.effects = shadow.effects;
    style.description = shadow.description;
  }

  await loadTokens(tokens.collections);
};
