import type { HarnessContract } from '../contract.ts';
import type {
  MockCreationRecord,
  MockNode,
  MockStore,
} from '../figma-mock/types.ts';

export interface LayoutIssue {
  detail: string;
  kind: string;
  node: string;
}

export interface AuditRuntime {
  BUILDERS: Readonly<Record<string, () => Promise<unknown> | unknown>>;
  readonly CONTRACT: HarnessContract;
  ensureTokens(): Promise<unknown> | unknown;
  lint(
    root: MockNode,
    options: { tolerance: number },
  ): { issues: LayoutIssue[]; nodes: number };
  loadFonts(): Promise<unknown> | unknown;
}

export interface AuditContext {
  created: MockCreationRecord[];
  layout(node: MockNode): void;
  nodeById: Map<string, MockNode>;
  pages: MockNode[];
  root: string;
  runtime: AuditRuntime;
  solveLayout(node: MockNode): void;
  store: MockStore;
  stress(): Promise<number>;
  verbose: boolean;
}

export type AuditHarness = Omit<AuditContext, 'root' | 'verbose'>;

export interface AuditRule {
  id: string;
  run(context: AuditContext): number | Promise<number>;
}
