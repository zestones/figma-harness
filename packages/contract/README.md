# Contract

`@figma-harness/contract` declares what the other packages exchange. It has no dependencies and almost no code.

| Interface | Implemented by | Read by |
| --- | --- | --- |
| `DesignSystemDefinition` | a design system's `src/system.ts` | the plugin |
| `AppDefinition` | an app's `src/index.ts` | the plugin |
| `HarnessContract` | the plugin's `HARNESS_API.CONTRACT` | the harness and the guards |
| `FlowTransition`, `defineFlowTransition()` | an app's flow matrix | the plugin, the guards |

A new check that needs product knowledge starts here: add the field, publish it from the design system or the app, and read it in the harness. The harness never imports the product to find it.
