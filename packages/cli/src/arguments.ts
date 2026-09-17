/* Command-line arguments: positional words and `--name value` options. */
'use strict';

export interface ParsedArguments {
  readonly options: Readonly<Record<string, string>>;
  readonly positional: readonly string[];
}

export function parseArguments(args: readonly string[], known: readonly string[]): ParsedArguments {
  const options: Record<string, string> = {};
  const positional: string[] = [];
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (!argument.startsWith('--')) {
      positional.push(argument);
      continue;
    }
    const [flag, inline] = argument.slice(2).split(/=(.*)/s, 2);
    if (!known.includes(flag)) throw new Error('unknown option --' + flag);
    const value = inline ?? args[++index];
    if (value === undefined || value.startsWith('--')) throw new Error('--' + flag + ' needs a value');
    options[flag] = value;
  }
  return { options, positional };
}

/** Print the error and set a failing exit code. */
export function reportFailure(error: unknown): void {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
