import type { Concept } from "@/types";
import type { ProposedEdge } from "./mock-data";

export type Edge = { from: string; to: string };

/** Approved prerequisite links already in the shared course map (prerequisite → dependent). */
export const fixtureEdges = (concepts: Concept[]): Edge[] => concepts.flatMap(c => c.prerequisites.map(p => ({ from: p, to: c.id })));

/** Longest-path level of each concept in the approved course map (used for layout and direction checks). */
export function conceptLevels(concepts: Concept[]): Record<string, number> {
  const byId = new Map(concepts.map(c => [c.id, c]));
  const memo: Record<string, number> = {};
  const visit = (id: string, stack: Set<string>): number => {
    if (id in memo) return memo[id];
    if (stack.has(id)) return 0;
    stack.add(id);
    const prereqs = byId.get(id)?.prerequisites.filter(p => byId.has(p)) ?? [];
    const level = prereqs.length ? Math.max(...prereqs.map(p => visit(p, stack))) + 1 : 0;
    stack.delete(id);
    memo[id] = level;
    return level;
  };
  concepts.forEach(c => visit(c.id, new Set()));
  return memo;
}

/** Breadth-first path search; returns the node path from `start` to `goal`, or null. */
export function findPath(edges: Edge[], start: string, goal: string): string[] | null {
  const next = new Map<string, string[]>();
  edges.forEach(e => next.set(e.from, [...(next.get(e.from) ?? []), e.to]));
  const prev = new Map<string, string>();
  const queue = [start];
  const seen = new Set([start]);
  while (queue.length) {
    const node = queue.shift()!;
    if (node === goal) {
      const path = [goal];
      while (path[0] !== start) path.unshift(prev.get(path[0])!);
      return path;
    }
    for (const n of next.get(node) ?? []) {
      if (!seen.has(n)) {
        seen.add(n);
        prev.set(n, node);
        queue.push(n);
      }
    }
  }
  return null;
}

export type EdgeCheck = {
  /** Accepting would close a loop; the path runs from `to` back to `from`. */
  cyclePath: string[] | null;
  /** Same link already accepted or approved. */
  duplicate: boolean;
  /** Direction looks reversed: the linked source presents the two concepts in the opposite order. */
  directionWarning: boolean;
};

export function checkEdge(edge: ProposedEdge, accepted: Edge[]): EdgeCheck {
  const duplicate = accepted.some(e => e.from === edge.from && e.to === edge.to);
  const cyclePath = duplicate ? null : findPath(accepted, edge.to, edge.from);
  const directionWarning = !!edge.sourceOrderReversed;
  return { cyclePath, duplicate, directionWarning };
}
