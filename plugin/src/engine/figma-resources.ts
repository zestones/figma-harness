/* Runtime: Figma variables, styles, and bound paints. */



/* --- tokens --------------------------------------------------------------- */

let variablesByName: Record<string, Variable> = {};
export { variablesByName as V };
let textStylesByName: Record<string, TextStyle> = {};
export { textStylesByName as TS };
let effectStylesByName: Record<string, EffectStyle> = {};
export { effectStylesByName as ES };

const HEX_COLOR = /^#[0-9A-Fa-f]{6}(?:[0-9A-Fa-f]{2})?$/;

/** #RRGGBB or #RRGGBBAA as Figma's RGBA; the alpha defaults to opaque. */
export const hex = function (h: string): RGBA {
  if (!HEX_COLOR.test(h)) throw new Error('Invalid colour: ' + h);
  return {
    r: parseInt(h.slice(1, 3), 16) / 255,
    g: parseInt(h.slice(3, 5), 16) / 255,
    b: parseInt(h.slice(5, 7), 16) / 255,
    a: h.length === 9 ? parseInt(h.slice(7, 9), 16) / 255 : 1,
  };
};

/** The variable collections a design system installs its tokens into. */
export interface TokenCollectionNames {
  readonly color: string;
  readonly dimension: string;
}

export const loadTokens = async function (names: TokenCollectionNames) {
  variablesByName = {};
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const colorCollection = collections.find(collection => collection.name === names.color);
  const dimensionCollection = collections.find(collection => collection.name === names.dimension);
  var c = await figma.variables.getLocalVariablesAsync('COLOR');
  for (var i = 0; i < c.length; i++) {
    if (c[i].variableCollectionId === colorCollection?.id) variablesByName[c[i].name] = c[i];
  }
  var f = await figma.variables.getLocalVariablesAsync('FLOAT');
  for (var j = 0; j < f.length; j++) {
    if (f[j].variableCollectionId === dimensionCollection?.id) variablesByName[f[j].name] = f[j];
  }
  textStylesByName = {};
  var t = await figma.getLocalTextStylesAsync();
  for (var k = 0; k < t.length; k++) textStylesByName[t[k].name] = t[k];
  effectStylesByName = {};
  var e = await figma.getLocalEffectStylesAsync();
  for (var l = 0; l < e.length; l++) effectStylesByName[e[l].name] = e[l];
};

/** A paint bound to a colour variable. Throws loudly on an unknown token. The
 *  variable carries the alpha; the paint stays opaque. */
const tokenPaint = function (name: string): SolidPaint {
  var v = variablesByName[name];
  if (!v) throw new Error('Unknown colour token: ' + name);
  return figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', v) as SolidPaint;
};
export { tokenPaint as P };
const tokenPaintWithOpacity = function (name: string, opacity: number): SolidPaint {
  return Object.assign({}, tokenPaint(name), { opacity: opacity });
};
export { tokenPaintWithOpacity as Pa };
/** A literal paint. A paint colour is RGB only; its alpha becomes the paint opacity. */
const solidPaint = function (hexValue: string, opacity?: number): SolidPaint {
  const color = hex(hexValue);
  const alpha = color.a * (opacity == null ? 1 : opacity);
  const rgb = { r: color.r, g: color.g, b: color.b };
  return alpha === 1 ? { type: 'SOLID', color: rgb } : { type: 'SOLID', color: rgb, opacity: alpha };
};
export { solidPaint as solid };
