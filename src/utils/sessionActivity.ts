// ─── Session activity store ───────────────────────────────────────────────────
// In-memory record of REAL transactions confirmed during this browser session.
// Entries are only appended by useCommitPoolTransaction once a receipt is
// confirmed — hashes are never fabricated. No backend or persistence involved.

import { useSyncExternalStore } from 'react';
import type { Hash } from 'viem';

export interface ActivityEntry {
  action: string;
  hash: Hash;
  challengeId?: bigint;
  timestamp: number;
}

let entries: ActivityEntry[] = [];
const listeners = new Set<() => void>();

/** Append a confirmed transaction to the session history. */
export function recordActivity(entry: Omit<ActivityEntry, 'timestamp'>): void {
  entries = [...entries, { ...entry, timestamp: Date.now() }];
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ActivityEntry[] {
  return entries;
}

/**
 * Session activity, optionally filtered to a single challenge.
 * Newest entries last — render in reverse for a compact activity feed.
 */
export function useSessionActivity(challengeId?: bigint): ActivityEntry[] {
  const all = useSyncExternalStore(subscribe, getSnapshot);
  if (challengeId === undefined) return all;
  return all.filter((entry) => entry.challengeId === challengeId);
}
