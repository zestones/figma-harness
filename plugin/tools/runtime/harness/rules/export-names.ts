'use strict';

import type { AuditRule } from './types.ts';

const fs = require('node:fs') as typeof import('node:fs');
const path = require('node:path') as typeof import('node:path');

function sourceFiles(directory: string, prefix: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const relative = prefix ? path.posix.join(prefix, entry.name) : entry.name;
    if (entry.isDirectory()) {
      files.push(...sourceFiles(path.join(directory, entry.name), relative));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(relative);
    }
  }
  return files.sort();
}

const rule: AuditRule = {
  id: 'export-names',
  run({ root }) {
    const seen = new Map<string, string>();
    const duplicates: string[] = [];
    const sourceRoot = path.join(root, 'src');
    for (const file of sourceFiles(sourceRoot, '')) {
      const source = fs.readFileSync(path.join(sourceRoot, file), 'utf8');
      const declarations = source.matchAll(
        /^export\s+(?:const|let|function|class)\s+([A-Za-z_$][\w$]*)/gm);
      const aliases = source.matchAll(
        /^export\s*\{\s*[A-Za-z_$][\w$]*\s+as\s+([A-Za-z_$][\w$]*)\s*\};/gm);
      for (const match of [...declarations, ...aliases]) {
        const name = match[1];
        if (seen.has(name) && seen.get(name) !== file) {
          duplicates.push(name + '  (' + seen.get(name) + ' then ' + file + ')');
        }
        seen.set(name, file);
      }
    }

    console.log('\n--- names ---');
    if (!duplicates.length) {
      console.log('  ' + seen.size + ' exported names, none defined twice');
    } else {
      console.log('  ' + duplicates.length + ' DEFINED TWICE:');
      for (const duplicate of duplicates) console.log('   - ' + duplicate);
    }
    return duplicates.length;
  },
};

module.exports = rule;
