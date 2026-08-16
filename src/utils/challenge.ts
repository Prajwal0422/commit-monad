// ─── Challenge mapping helpers ────────────────────────────────────────────────
// Maps on-chain CommitPool data (bigint / wei / unix seconds) into the
// frontend Commitment view model so existing UI components work unchanged.

import { formatEther, type Address } from 'viem';
import { ChallengeStatus } from '../contracts/CommitPool';
import type { Commitment, CommitmentStatus, Participant } from '../types/commitment';
import { deadlineToDate, formatChallengeId, resultToStatus } from './contract';
import type { OnChainParticipant } from '../hooks/useCommitPool';

/** Shape accepted by the mapper — matches the getChallenge() tuple + id. */
export interface ChainChallenge {
  id: bigint;
  creator: Address;
  goal: string;
  stakeAmount: bigint;
  deadline: bigint;
  maxParticipants: bigint;
  participantCount: bigint;
  totalPool: bigint;
  status: number;
  participantList: Address[];
}

// ─── ID handling ──────────────────────────────────────────────────────────────

/** Parse a commitment id from navigation (decimal string) into a bigint. */
export function parseChallengeId(id: string): bigint | undefined {
  if (!/^\d+$/.test(id)) return undefined;
  try {
    return BigInt(id);
  } catch {
    return undefined;
  }
}

// ─── Address display ──────────────────────────────────────────────────────────

/** Shorten an address for display, e.g. 0x1234…5678 */
export function shortAddress(address: Address | string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

// ─── Deadline display ─────────────────────────────────────────────────────────

export function formatTimeRemaining(deadline: Date): string {
  const diffMs = deadline.getTime() - Date.now();
  if (diffMs <= 0) return 'Expired';
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 24) return `${diffH}h remaining`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d remaining`;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

/**
 * Map an on-chain challenge to the frontend Commitment view model.
 * The contract only stores `goal`, so description mirrors the goal and the
 * category badge shows the on-chain challenge ID.
 */
export function challengeToCommitment(c: ChainChallenge): Commitment {
  const deadline = deadlineToDate(c.deadline);

  let status: CommitmentStatus;
  if (c.status === ChallengeStatus.Resolved) {
    status = 'resolved';
  } else if (deadline.getTime() <= Date.now()) {
    status = 'pending_resolution';
  } else {
    status = 'active';
  }

  return {
    id: c.id.toString(),
    goal: c.goal,
    description: c.goal,
    creator: c.creator,
    stakePerParticipant: parseFloat(formatEther(c.stakeAmount)),
    pool: parseFloat(formatEther(c.totalPool)),
    participantCount: Number(c.participantCount),
    maxParticipants: Number(c.maxParticipants),
    deadline,
    status,
    category: formatChallengeId(c.id),
    participants: buildParticipants(c, {}),
  };
}

/**
 * Build the frontend participant list from the on-chain participantList,
 * enriching with result records when available (keyed by lowercase address).
 */
export function buildParticipants(
  c: ChainChallenge,
  records: Record<string, OnChainParticipant | undefined>,
): Participant[] {
  return c.participantList.map((addr) => {
    const record = records[addr.toLowerCase()];
    return {
      address: addr,
      shortAddress: shortAddress(addr),
      status: record ? resultToStatus(record.result as 0 | 1 | 2) : 'pending',
      isCreator: addr.toLowerCase() === c.creator.toLowerCase(),
    };
  });
}

/** Count success/failure results from participant records. */
export function countResults(records: Record<string, OnChainParticipant | undefined>) {
  let successCount = 0;
  let failureCount = 0;
  let pendingCount = 0;
  for (const record of Object.values(records)) {
    if (!record) continue;
    if (record.result === 1) successCount++;
    else if (record.result === 2) failureCount++;
    else pendingCount++;
  }
  return { successCount, failureCount, pendingCount };
}
