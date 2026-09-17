/* Matrix-driven prototype planning. The app declares the transitions, the
 * design system resolves their motion, and the engine owns the native I/O. */

import type {
  FlowSelector,
  FlowTransition,
  PrototypeFlows,
  PrototypeTransition,
} from '@figma-harness/contract';
import {
  verifyPrototypeReactionReadback,
  writePrototypeReactions,
  type PrototypeReaction,
} from '@figma-harness/engine';

type PrototypeFrames = Readonly<Record<string, FrameNode>>;

/** A document's transitions, with the design system's motion for each name. */
export interface PrototypeWiring extends PrototypeFlows {
  motion(name: string): PrototypeTransition;
}

interface PrototypeFrameIndex {
  all: SceneNode[];
  byName: Map<string, SceneNode[]>;
}

export interface WirePrototypeOptions {
  cleanStaleReactions?: boolean;
  sourceKeys?: readonly string[];
}

export const findAllNamed = function (root: FrameNode, name: string): SceneNode[] {
  return root.findAll(function (node) { return node.name === name; });
};

const indexFrame = function (frame: FrameNode): PrototypeFrameIndex {
  /* Native findAll() is expensive. Every selector in the declarative flow
   * matrix consumes this one traversal instead of rescanning the same screen. */
  var all = frame.findAll(function () { return true; });
  var byName = new Map<string, SceneNode[]>();
  for (const node of all) {
    var named = byName.get(node.name) || [];
    named.push(node);
    byName.set(node.name, named);
  }
  return { all: all, byName: byName };
};

const indexFrames = function (
  frames: PrototypeFrames,
): ReadonlyMap<FrameNode, PrototypeFrameIndex> {
  var indexes = new Map<FrameNode, PrototypeFrameIndex>();
  for (const frame of Object.values(frames)) indexes.set(frame, indexFrame(frame));
  return indexes;
};

const selectNodes = function (
  frame: FrameNode,
  index: PrototypeFrameIndex,
  selector: FlowSelector,
): SceneNode[] {
  if (selector.kind === 'frame') return [frame];
  var matches = selector.kind === 'name'
    ? [...(index.byName.get(selector.value || '') || [])]
    : index.all.filter(function (node) {
      return node.name.indexOf(selector.value || '') === 0;
    });
  if (!selector.ancestor) return matches;
  return matches.filter(function (node) {
    var parent: BaseNode | null = node.parent;
    while (parent && parent !== frame) {
      if (parent.name === selector.ancestor) return true;
      parent = parent.parent;
    }
    return false;
  });
};

const reactionFor = function (
  transition: FlowTransition,
  motion: PrototypeWiring['motion'],
  destinationId?: string,
): PrototypeReaction {
  var trigger: PrototypeReaction['trigger'] = transition.trigger === 'AFTER_TIMEOUT'
    ? { type: 'AFTER_TIMEOUT', timeout: transition.timeoutSeconds || 0 }
    : { type: transition.trigger };
  if (transition.navigation === 'BACK') {
    return {
      trigger,
      actions: [{ type: 'BACK' }],
    };
  }
  if (!destinationId) {
    throw new Error(transition.id + ': NAVIGATE transition has no destination node');
  }
  return {
    trigger,
    actions: [{
      type: 'NODE',
      destinationId,
      navigation: 'NAVIGATE',
      transition: transition.motion
        ? motion(transition.motion)
        : null,
      preserveScrollPosition: false,
    }],
  };
};

const nodeLocation = function (node: SceneNode): string {
  var top: BaseNode | null = node;
  while (top.parent && top.parent.type !== 'PAGE') top = top.parent;
  return '"' + top.name + '" / "' + node.name + '"';
};

const writePlannedReactions = async function (
  planned: ReadonlyMap<SceneNode, readonly PrototypeReaction[]>,
): Promise<void> {
  const failures: string[] = [];
  for (const [node, reactions] of planned) {
    try {
      await writePrototypeReactions(node, reactions);
    } catch (error) {
      failures.push(
        nodeLocation(node) + ': '
        + (error instanceof Error ? error.message : String(error)),
      );
    }
  }
  if (failures.length) {
    throw new Error(
      'Figma rejected prototype reactions on ' + failures.length
      + ' control(s). ' + failures.slice(0, 4).join(' | ')
      + (failures.length > 4 ? ' | …' : ''),
    );
  }
};

export const wirePrototype = async function (
  frames: PrototypeFrames,
  flows: PrototypeWiring,
  options: WirePrototypeOptions = {},
): Promise<number> {
  const sourceFrames: Record<string, FrameNode> = {};
  const selectedSourceKeys = options.sourceKeys
    ? new Set(options.sourceKeys)
    : null;
  for (const [key, frame] of Object.entries(frames)) {
    if (!selectedSourceKeys || selectedSourceKeys.has(key)) sourceFrames[key] = frame;
  }
  if (selectedSourceKeys) {
    for (const key of selectedSourceKeys) {
      if (!sourceFrames[key]) throw new Error('missing prototype source frame "' + key + '"');
    }
  }
  const indexes = indexFrames(sourceFrames);
  const planned = new Map<SceneNode, PrototypeReaction[]>();

  for (const transition of flows.transitions) {
    const destination = transition.navigation === 'NAVIGATE' && transition.destination
      ? frames[transition.destination]
      : null;
    if (transition.navigation === 'NAVIGATE' && !destination) continue;
    for (const sourceKey of transition.sources) {
      const source = frames[sourceKey];
      if (!source) continue;
      const sourceIndex = indexes.get(source);
      if (!sourceIndex) continue;
      for (const node of selectNodes(source, sourceIndex, transition.selector)) {
        const reactions = planned.get(node) || [];
        reactions.push(reactionFor(transition, flows.motion, destination?.id));
        planned.set(node, reactions);
      }
    }
  }

  if (options.cleanStaleReactions) {
    const stale = new Map<SceneNode, readonly PrototypeReaction[]>();
    for (const [frame, index] of indexes) {
      for (const node of [frame, ...index.all]) {
        const host = node as SceneNode & { readonly reactions?: readonly unknown[] };
        if (!node.removed && !planned.has(node) && Array.isArray(host.reactions) && host.reactions.length) {
          stale.set(node, []);
        }
      }
    }
    await writePlannedReactions(stale);
  }

  await writePlannedReactions(planned);

  var linked = 0;
  const readbackFailures: string[] = [];
  for (const [node, reactions] of planned) {
    try {
      linked += verifyPrototypeReactionReadback(node, reactions);
    } catch (error) {
      readbackFailures.push(
        nodeLocation(node) + ': '
        + (error instanceof Error ? error.message : String(error)),
      );
    }
  }
  if (readbackFailures.length) {
    throw new Error(
      'native prototype readback failed on ' + readbackFailures.length
      + ' control(s). ' + readbackFailures.slice(0, 4).join(' | ')
      + (readbackFailures.length > 4 ? ' | …' : ''),
    );
  }
  return linked;
};
