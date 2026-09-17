/* Per-build reuse for deterministic, reaction-free screen subtrees.
 *
 * The cache exists only while Screens are being materialized. It is closed
 * before prototype wiring starts, so clone() can never copy reactions from a
 * previously wired card or control. Nothing is retained between
 * builds: clearPage() may destroy every source node at the next invocation. */

export interface ScreenMaterializationStats {
  readonly builtTemplates: number;
  readonly cloneMilliseconds: number;
  readonly clonedSubtrees: number;
  readonly reuseEnabled: boolean;
}

interface ScreenMaterializationSession {
  cache: Map<string, FrameNode>;
  stats: {
    builtTemplates: number;
    cloneMilliseconds: number;
    clonedSubtrees: number;
    reuseEnabled: boolean;
  };
}

let activeSession: ScreenMaterializationSession | null = null;

export const beginScreenMaterialization = function (
  reuseEnabled = true,
): void {
  if (activeSession) throw new Error('a screen materialization session is already active');
  activeSession = {
    cache: new Map<string, FrameNode>(),
    stats: {
      builtTemplates: 0,
      cloneMilliseconds: 0,
      clonedSubtrees: 0,
      reuseEnabled: reuseEnabled,
    },
  };
};

export const endScreenMaterialization = function (): ScreenMaterializationStats {
  const session = activeSession;
  activeSession = null;
  return Object.freeze(session ? { ...session.stats } : {
    builtTemplates: 0,
    cloneMilliseconds: 0,
    clonedSubtrees: 0,
    reuseEnabled: false,
  });
};

export const reuseFrame = async function (
  key: string,
  build: () => Promise<FrameNode>,
): Promise<FrameNode> {
  const session = activeSession;
  if (!session || !session.stats.reuseEnabled) return build();

  const template = session.cache.get(key);
  if (template) {
    if (template.removed) {
      throw new Error('cached frame was destroyed before materialization completed: ' + key);
    }
    var cloneStartedAt = Date.now();
    var cloned = template.clone();
    session.stats.cloneMilliseconds += Date.now() - cloneStartedAt;
    session.stats.clonedSubtrees++;
    return cloned;
  }

  const frame = await build();
  session.cache.set(key, frame);
  session.stats.builtTemplates++;
  return frame;
};

export const frameReuseKey = function (
  namespace: string,
  value: Record<string, unknown>,
): string {
  return namespace + ':' + JSON.stringify(value);
};
