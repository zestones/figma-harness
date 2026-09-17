/* The two modules the build aliases to the active app and its design system
 * (see packages/harness/src/bundle/bundle.ts). Only the plugin's composition
 * imports them. */

declare module '@figma-harness/active-app' {
  import type { AppDefinition } from '@figma-harness/contract';

  export const app: AppDefinition;
}

declare module '@figma-harness/active-design-system' {
  import type { DesignSystemDefinition } from '@figma-harness/contract';

  export const designSystem: DesignSystemDefinition;
}
