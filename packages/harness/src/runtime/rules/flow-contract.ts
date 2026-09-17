'use strict';

import type {
  FlowSelector,
  FlowTransition,
  PrototypeContract,
} from '@figma-harness/contract';
import type { MockNode } from '../figma-mock/types.ts';
import type { AuditRule } from './types.ts';

interface RuntimeAction {
  destinationId?: string;
  navigation?: string;
  transition?: {
    duration?: number;
    easing?: {
      easingFunctionCubicBezier?: { x1?: number; x2?: number; y1?: number; y2?: number };
      type?: string;
    };
    type?: string;
  } | null;
  type?: string;
}

interface RuntimeReaction {
  actions?: RuntimeAction[];
  trigger?: { timeout?: number; type?: string };
}

const selectNodes = function (frame: MockNode, selector: FlowSelector): MockNode[] {
  if (selector.kind === 'frame') return [frame];
  const matches = selector.kind === 'name'
    ? frame.findAll((node) => node.name === (selector.value || ''))
    : frame.findAll((node) => node.name.startsWith(selector.value || ''));
  if (!selector.ancestor) return matches;
  return matches.filter((node) => {
    var parent = node.parent;
    while (parent && parent !== frame) {
      if (parent.name === selector.ancestor) return true;
      parent = parent.parent;
    }
    return false;
  });
};

const expectedSignature = function (
  contract: PrototypeContract,
  transition: FlowTransition,
  destinationId?: string,
): string {
  const trigger = transition.trigger === 'AFTER_TIMEOUT'
    ? 'AFTER_TIMEOUT@' + String(transition.timeoutSeconds)
    : transition.trigger;
  if (transition.navigation === 'BACK') return trigger + '|BACK||instant';
  const motion = transition.motion
    ? contract.motion.transition(transition.motion)
    : null;
  return trigger + '|NAVIGATE|' + destinationId + '|' + transitionSignature(motion);
};

const transitionSignature = function (
  transition: RuntimeAction['transition'],
): string {
  if (!transition) return 'instant';
  const duration = typeof transition.duration === 'number'
    ? Math.round(transition.duration * 1_000_000) / 1_000_000
    : '?';
  const bezier = transition.easing?.easingFunctionCubicBezier;
  const curve = bezier
    ? '(' + [bezier.x1, bezier.y1, bezier.x2, bezier.y2].map((value) => Math.round((value ?? NaN) * 1000) / 1000).join(',') + ')'
    : '';
  return (transition.type || '?') + '@' + duration + ':' + (transition.easing?.type || '?') + curve;
};

interface MotionDelta {
  added: number;
  changed: number;
  matched: number;
  removed: number;
}

/* Smart Animate matches layer names inside the same hierarchy. Duplicate names
 * are disambiguated by their order so the offline proof stays deterministic. */
const motionLayerPaths = function (root: MockNode): Map<string, MockNode> {
  const paths = new Map<string, MockNode>();
  const visit = function (node: MockNode, parentPath: string): void {
    const sameNameSiblings = node.parent?.children.filter((sibling) =>
      sibling.name === node.name) || [node];
    const ordinal = sameNameSiblings.length > 1
      ? '[' + sameNameSiblings.indexOf(node) + ']'
      : '';
    const segment = node.name + ordinal;
    const path = parentPath ? parentPath + '/' + segment : segment;
    paths.set(path, node);
    for (const child of node.children) visit(child, path);
  };
  for (const child of root.children) visit(child, '');
  return paths;
};

const motionVisualSignature = function (node: MockNode): string {
  return JSON.stringify({
    type: node.type,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    opacity: node.opacity,
    visible: node.visible,
    cornerRadius: node.cornerRadius,
    fills: node.fills,
    strokes: node.strokes,
    strokeWeight: node.strokeWeight,
    characters: node.characters,
  });
};

const measureMotionDelta = function (
  source: MockNode,
  destination: MockNode,
): MotionDelta {
  const sourceLayers = motionLayerPaths(source);
  const destinationLayers = motionLayerPaths(destination);
  var matched = 0;
  var changed = 0;
  var removed = 0;
  for (const [path, sourceNode] of sourceLayers) {
    const destinationNode = destinationLayers.get(path);
    if (!destinationNode) {
      removed++;
      continue;
    }
    matched++;
    if (motionVisualSignature(sourceNode) !== motionVisualSignature(destinationNode)) changed++;
  }
  var added = 0;
  for (const path of destinationLayers.keys()) {
    if (!sourceLayers.has(path)) added++;
  }
  return { added, changed, matched, removed };
};

const validateMotionDelta = function (
  issues: string[],
  transition: FlowTransition,
  sourceKey: string,
  delta: MotionDelta,
): void {
  if (!transition.motion) return;
  const context = transition.id + ' (' + sourceKey + ' -> ' + transition.destination + ')';
  if (transition.motion === 'enter' && delta.added < 1) {
    issues.push(context + ': entering motion adds no visible layer');
    return;
  }
  if (transition.motion === 'exit' && delta.removed < 1) {
    issues.push(context + ': exiting motion removes no visible layer');
    return;
  }
  if (delta.changed + delta.added + delta.removed < 1) {
    issues.push(context + ': animated states have no observable visual delta');
  }
};

const actualTrigger = function (reaction: RuntimeReaction): string {
  const type = reaction.trigger?.type || '?';
  return type === 'AFTER_TIMEOUT'
    ? type + '@' + String(reaction.trigger?.timeout)
    : type;
};

const actualSignatures = function (node: MockNode): string[] {
  const reactions = Array.isArray(node.reactions)
    ? node.reactions as RuntimeReaction[]
    : [];
  const signatures: string[] = [];
  for (const reaction of reactions) {
    for (const action of reaction.actions || []) {
      if (action.type === 'BACK') {
        signatures.push(actualTrigger(reaction) + '|BACK||instant');
        continue;
      }
      if (action.type !== 'NODE') {
        signatures.push(actualTrigger(reaction) + '|UNSUPPORTED|' + (action.type || '?'));
        continue;
      }
      signatures.push(
        actualTrigger(reaction) + '|'
        + (action.navigation || '?') + '|'
        + (action.destinationId || '') + '|'
        + transitionSignature(action.transition),
      );
    }
  }
  return signatures.sort();
};

const rule: AuditRule = {
  id: 'flow-contract',
  run({ pages, runtime, solveLayout }) {
    const issues: string[] = [];
    const contract = runtime.CONTRACT.document.prototype;
    const screensPage = runtime.CONTRACT.workspace.pages['screens'];
    const page = pages.find((candidate) => candidate.name === screensPage);
    if (!page) {
      console.log('\n--- flow contract ---');
      console.log('  missing ' + screensPage);
      return 1;
    }

    const solveTree = function (node: MockNode): void {
      solveLayout(node);
      for (const child of node.children) solveTree(child);
    };
    for (const top of page.children) solveTree(top);

    const nameByKey = new Map<string, string>();
    for (const screen of contract.frames) nameByKey.set(screen.key, screen.title);

    const frameByKey = new Map<string, MockNode>();
    for (const [key, name] of nameByKey) {
      const matches = page.children.filter((node) => node.type === 'FRAME' && node.name === name);
      if (matches.length !== 1) {
        issues.push(key + ': expected one top-level frame named "' + name + '", found ' + matches.length);
      } else {
        frameByKey.set(key, matches[0]);
      }
    }

    const expectedByNode = new Map<string, string[]>();
    var expectedActions = 0;
    var expectedAnimatedActions = 0;
    var motionProofs = 0;
    for (const transition of contract.transitions) {
      const destination = transition.destination
        ? frameByKey.get(transition.destination)
        : null;
      if (transition.navigation === 'NAVIGATE' && !destination) continue;
      for (const sourceKey of transition.sources) {
        const source = frameByKey.get(sourceKey);
        if (!source) continue;
        if (transition.motion && destination) {
          validateMotionDelta(
            issues,
            transition,
            sourceKey,
            measureMotionDelta(source, destination),
          );
          motionProofs++;
        }
        const nodes = selectNodes(source, transition.selector);
        if (transition.cardinality === 'one' && nodes.length !== 1) {
          issues.push(
            transition.id + ': expected one trigger in ' + source.name + ', found ' + nodes.length,
          );
        }
        if (transition.cardinality === 'many' && nodes.length < 1) {
          issues.push(transition.id + ': expected at least one trigger in ' + source.name);
        }
        for (const node of nodes) {
          const expected = expectedByNode.get(node.id) || [];
          expected.push(expectedSignature(contract, transition, destination?.id));
          expectedByNode.set(node.id, expected);
          expectedActions++;
          if (transition.motion) expectedAnimatedActions++;
        }
      }
    }

    for (const top of page.children) {
      for (const node of [top, ...top.findAll(() => true)]) {
        const actual = actualSignatures(node);
        const expected = (expectedByNode.get(node.id) || []).sort();
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          if (!expected.length && actual.length) {
            issues.push(node.topLevelFrame.name + ' / ' + node.name + ': undeclared reaction(s) ' + actual.join(', '));
          } else {
            issues.push(
              node.topLevelFrame.name + ' / ' + node.name
              + ': expected [' + expected.join(', ') + '] but found [' + actual.join(', ') + ']',
            );
          }
        }
        const triggers = new Set((Array.isArray(node.reactions)
          ? node.reactions as RuntimeReaction[]
          : []).map((reaction) => reaction.trigger?.type));
        if (triggers.has('ON_HOVER') && triggers.has('ON_CLICK')) {
          issues.push(node.topLevelFrame.name + ' / ' + node.name + ': direct hover and click collide');
        }
      }
    }

    console.log('\n--- flow contract ---');
    if (!issues.length) {
      console.log(
        '  ' + contract.transitions.length + ' declared transitions expand to '
        + expectedActions + ' exact actions (' + expectedAnimatedActions + ' animated with '
        + motionProofs + ' observable-delta proofs)',
      );
    } else {
      console.log('  ' + issues.length + ' contract violation(s):');
      for (const issue of issues.slice(0, 20)) console.log('   - ' + issue);
    }
    return issues.length;
  },
};

module.exports = rule;
