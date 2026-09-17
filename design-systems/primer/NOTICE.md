# Third-party notices for the Primer example

This example design system is generated from the following open-source packages, pinned in this package's `package.json`. The generated modules copy data these packages publish (token values and icon paths), so their licences require the notices below to travel with them.

The rest of Figma Harness is covered by the repository's [MIT licence](../../LICENSE). Relay, the example app, is fictional, and the project is not affiliated with or endorsed by GitHub.

## Primer Primitives

- Package: `@primer/primitives`
- Used for: the colour, size, typography, shadow and motion values in `src/foundations/primer.generated.ts`
- Source: https://github.com/primer/primitives

```text
The MIT License (MIT)

Copyright (c) 2018 GitHub Inc.

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

## Octicons

- Package: `@primer/octicons`
- Used for: the icon paths in `src/primitives/icons.generated.ts`
- Source: https://github.com/primer/octicons

```text
MIT License

Copyright (c) 2026 GitHub Inc.

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

## Fonts used by the offline checks

The harness measures and renders this example's text with Noto Sans and Noto Sans Mono from `@fontsource/noto-sans` and `@fontsource/noto-sans-mono`. They are development dependencies of this package, installed by `pnpm install` and never committed. Copyright 2022 The Noto Project Authors, licensed under the SIL Open Font License, Version 1.1. The Figma document uses the copies of these fonts that Figma provides.
