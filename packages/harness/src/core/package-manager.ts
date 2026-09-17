/* Run pnpm from a Node tool: the command that started the tool, whether pnpm
 * is a JavaScript entry point or a native executable. */
'use strict';

const fs = require('node:fs') as typeof import('node:fs');

/** The pnpm that started this process. */
export function packageManager(): string {
  const executable = process.env['npm_execpath'];
  if (!executable || !fs.existsSync(executable)) throw new Error('start this command through pnpm');
  return executable;
}

/** The executable and arguments that run pnpm with `args`. */
export function packageManagerCommand(executable: string, args: readonly string[]): [string, string[]] {
  return /\.[cm]?js$/.test(executable)
    ? [process.execPath, [executable, ...args]]
    : [executable, [...args]];
}
