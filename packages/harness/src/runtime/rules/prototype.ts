'use strict';

import type { MockNode } from '../figma-mock/types.ts';
import type { AuditRule } from './types.ts';

interface PrototypeAction {
  destinationId?: string;
  navigation?: string;
  type?: string;
}

interface PrototypeReaction {
  actions?: PrototypeAction[];
}

function reactionsOf(node: MockNode): PrototypeReaction[] {
  return Array.isArray(node.reactions)
    ? node.reactions as PrototypeReaction[]
    : [];
}

const rule: AuditRule = {
  id: 'prototype',
  run({ pages, nodeById }) {
    let reactions = 0;
    const issues: string[] = [];
    for (const page of pages) {
      const topLevel = new Set(page.children.map((child) => child.id));
      for (const top of page.children) {
        for (const node of [top, ...top.findAll(() => true)]) {
          const nodeReactions = reactionsOf(node);
          if (!nodeReactions.length) continue;
          for (const reaction of nodeReactions) {
            for (const action of reaction.actions || []) {
              if (action.type !== 'NODE') continue;
              reactions++;
              const destinationId = action.destinationId || '';
              const destination = nodeById.get(destinationId);
              if (!destination) {
                issues.push(node.name + ' -> unknown destination ' + destinationId);
              } else if (action.navigation === 'CHANGE_TO') {
                const componentSet = node.parent;
                if (node.type !== 'COMPONENT' || destination.type !== 'COMPONENT'
                  || !componentSet || componentSet.type !== 'COMPONENT_SET'
                  || destination.parent !== componentSet) {
                  issues.push(
                    node.name + ' -> "' + destination.name
                    + '" is not a sibling variant in the same component set',
                  );
                }
              } else if (!topLevel.has(destination.id)) {
                issues.push(node.name + ' -> "' + destination.name +
                  '" is NOT a top-level frame (parent: ' +
                  (destination.parent ? destination.parent.name : 'none') + ')');
              } else if (destination.page !== page) {
                issues.push(node.name + ' -> "' + destination.name + '" is on another page');
              } else if (destination === node.topLevelFrame) {
                issues.push(node.name + ' -> its own frame "' +
                  destination.name + '" (self-navigation)');
              }
            }
          }
        }
      }
    }

    console.log('\n--- prototype ---');
    if (!issues.length) {
      console.log('  ' + reactions +
        ' actions: frame navigations stay top-level and variant changes stay inside their set');
    } else {
      console.log('  ' + issues.length + ' INVALID of ' + reactions + ' navigations:');
      for (const issue of issues.slice(0, 10)) console.log('   - ' + issue);
    }
    return issues.length;
  },
};

module.exports = rule;
