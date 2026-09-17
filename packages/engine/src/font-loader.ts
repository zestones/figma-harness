/* Runtime: Figma font loading with style-name resolution.
 *
 * Font files name the same weight differently ("SemiBold", "Semi Bold"), and
 * Figma only loads the exact name it lists. Each declared style is matched to
 * the listed one, loaded, and remembered for the text styles that use it. */

const resolved = new Map<string, FontName>();

const fontKey = function (family: string, style: string): string {
  return family + '|' + style.replace(/[\s_-]+/g, '').toLowerCase();
};

export const loadFonts = async function (fonts: readonly FontName[]): Promise<void> {
  const listed = new Map<string, FontName>();
  for (const font of await figma.listAvailableFontsAsync()) {
    listed.set(fontKey(font.fontName.family, font.fontName.style), font.fontName);
  }
  for (const font of fonts) {
    const key = fontKey(font.family, font.style);
    // An empty list means the host does not enumerate fonts; try the declared name.
    const name = listed.get(key) || font;
    try {
      await figma.loadFontAsync(name);
    } catch (error) {
      throw Object.assign(new Error('Figma cannot load ' + font.family + ' ' + font.style
        + (listed.size ? '' : ' (the font list is empty)') + ': ' + String(error)), { cause: error });
    }
    resolved.set(key, { family: name.family, style: name.style });
  }
};

/** Whether every declared font has been loaded and resolved. */
export const fontsLoaded = function (fonts: readonly FontName[]): boolean {
  return fonts.every((font) => resolved.has(fontKey(font.family, font.style)));
};

/** The loaded font name for a declared family and style. */
export const fontName = function (family: string, style: string): FontName {
  const name = resolved.get(fontKey(family, style));
  if (!name) throw new Error('font not loaded: ' + family + ' ' + style);
  return name;
};
