import type { HarnessContract } from '../../../runtime/harness/contract.ts';

export interface ColorValue {
  b: number;
  g: number;
  r: number;
}

export interface TreePaint {
  boundVariables?: { color?: { id: string } };
  color?: ColorValue;
  opacity?: number;
  type?: string;
  visible?: boolean;
}

export interface TreeEffect {
  type?: string;
  visible?: boolean;
}

export interface TreeNode {
  characters?: string;
  children?: TreeNode[];
  dashPattern?: readonly number[];
  effects?: readonly TreeEffect[];
  fills?: readonly TreePaint[];
  fontName?: { style?: string };
  fontSize?: number;
  getPluginData?(key: string): string;
  name?: string;
  strokes?: readonly TreePaint[];
  type: string;
}

export interface TreeHarness {
  buildAll(): Promise<unknown>;
  pages: TreeNode[];
  vars: unknown[];
}

/** A harness whose bundle publishes the declared audit contract. */
export interface ContractTreeHarness extends TreeHarness {
  runtime: { readonly CONTRACT: HarnessContract };
}

export type AddFinding = (
  severity: 'FAIL' | 'WARN' | 'note',
  rule: string,
  subject: string,
  detail: string,
) => void;
