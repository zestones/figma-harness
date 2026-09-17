# Third-party notices for the Carrara example

Carrara's own palette, sizes, components and sheets are covered by the repository's [MIT licence](../../LICENSE). It uses the following open-source packages, pinned in this package's `package.json`.

Coffer, the app built with Carrara, is fictional: every company, person, address, amount and identifier in it is invented.

## Heroicons

- Package: `heroicons` 2.2.0
- Used for: the glyph paths in `src/primitives/icons.generated.ts`, copied from the package's 16 and 20 px solid icons by `generators/icons/icons.ts`
- Source: https://github.com/tailwindlabs/heroicons

```text
MIT License

Copyright (c) Tailwind Labs, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Inter and JetBrains Mono

- Packages: `@fontsource/inter` 5.3.0 and `@fontsource/jetbrains-mono` 5.3.0, both under the [SIL Open Font License 1.1](https://openfontlicense.org)
- Used for: measuring and rendering text offline. The harness reads the font files from `node_modules`; no font file is copied into the repository, and the plugin asks Figma for the fonts by name.
- Sources: https://github.com/rsms/inter and https://github.com/JetBrains/JetBrainsMono
