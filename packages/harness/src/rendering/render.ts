/* Render the isolated Figma tree as SVG for local visual inspection. */
'use strict';

import { resolvePaintColor } from '../color/core/token-values.ts';
import { FIGMA_CANVAS_HEX } from '../core/figma-canvas.ts';
import { labPageName, type WorkspaceContract } from '@figma-harness/contract';
import { fromRoot, rendersDirectory } from '../core/workspace.ts';
import { drawNode } from './svg/node.ts';
import type {
  RenderContext,
  RenderHarness,
  SvgNode,
} from './svg/types.ts';

const fs = require('node:fs');
const path = require('node:path');
const { createHarness } = require('../runtime/harness.ts') as {
  createHarness(options?: { colorOverrides?: Record<string, string> }): RenderHarness & {
    runtime: { readonly CONTRACT: { readonly workspace: WorkspaceContract } };
  };
};


function colorOverrides(): Record<string, string> | undefined {
  const encoded = process.env['FIGMA_HARNESS_COLOR_OVERRIDES'];
  if (!encoded) return undefined;
  const parsed: unknown = JSON.parse(encoded);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('FIGMA_HARNESS_COLOR_OVERRIDES must be a JSON object');
  }
  for (const [token, value] of Object.entries(parsed)) {
    if (typeof value !== 'string') {
      throw new Error('FIGMA_HARNESS_COLOR_OVERRIDES[' + token + '] must be a string');
    }
  }
  return parsed as Record<string, string>;
}

const harness = createHarness({ colorOverrides: colorOverrides() });
const context: RenderContext = {
  harness,
  resolvePaint: (paint) => resolvePaintColor(paint, harness.vars),
};

export function renderFrame(frame: SvgNode): string {
  const output: string[] = [];
  const savedX = frame.x;
  const savedY = frame.y;
  frame.x = 0;
  frame.y = 0;
  try {
    drawNode(frame, 0, 0, output, 0, context);
  } finally {
    frame.x = savedX;
    frame.y = savedY;
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + frame.width
    + '" height="' + frame.height
    + '" viewBox="0 0 ' + frame.width + ' ' + frame.height + '">'
    + '<rect width="100%" height="100%" fill="' + FIGMA_CANVAS_HEX + '"/>'
    + output.join('') + '</svg>';
}

if (require.main === module) {
  (async () => {
    const wantedPage = process.argv[2] || labPageName(harness.runtime.CONTRACT.workspace);
    const outputDirectory = process.argv[3] ? fromRoot(process.argv[3]) : rendersDirectory();
    fs.mkdirSync(outputDirectory, { recursive: true });
    const pages = await harness.buildAll();
    let rendered = 0;
    for (const page of pages) {
      if (wantedPage !== 'all' && !page.name.includes(wantedPage)) continue;
      for (const frame of page.children) {
        if (frame.type !== 'FRAME' || !frame.width || frame.width < 200) continue;
        const safeName = frame.name
          .replace(/[^\w -]+/g, '')
          .replace(/\s+/g, '-')
          .slice(0, 48);
        fs.writeFileSync(path.join(outputDirectory, safeName + '.svg'), renderFrame(frame));
        rendered++;
      }
    }
    console.log('rendered ' + rendered + ' frames to ' + outputDirectory);
  })().catch((error: unknown) => {
    console.error(error instanceof Error ? error.stack || error.message : error);
    process.exit(1);
  });
}
