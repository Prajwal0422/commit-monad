// ─── Contract utility helpers ─────────────────────────────────────────────────
// Thin wrappers around viem primitives — only added where they provide
// meaningful domain context. Don't duplicate parseEther / formatEther.

import { parseEther, formatEther } from 'viem';
import { ParticipantResult, type ParticipantResultValue } from '../contracts/CommitPool';
import type { ParticipantStatus } from '../types/commitment';

// ─── MON / wei conversions ────────────────────────────────────────────────────
// MON uses 18 decimals, same as ETH — parseEther / formatEther work directly.

/** Convert a human-readable MON amount (string or number) to wei (bigint) */
export function monToWei(amount: string | number): bigint {
  return parseEther(String(amount));
}

/** Convert wei (bigint) to a human-readable MON string, e.g. "1.5" */
export function weiToMon(wei: bigint): string {
  return formatEther(wei);
}

/** Format wei to a display string with fixed decimal places */
export function formatMon(wei: bigint, decimals = 4): string {
  const full = formatEther(wei);
  const [whole, frac = ''] = full.split('.');
  return `${whole}.${frac.padEnd(decimals, '0').slice(0, decimals)}`;
}

// ─── Deadline helpers ─────────────────────────────────────────────────────────

/**
 * Convert a duration in days to a Unix timestamp (seconds) suitable for the
 * contract's `deadline` parameter.
 */
export function daysToDeadline(days: number): bigint {
  const nowSec = Math.floor(Date.now() / 1000);
  return BigInt(nowSec + days * 86_400);
}

/** Convert a Unix timestamp (seconds, bigint) to a JS Date */
export function deadlineToDate(unixSec: bigint): Date {
  return new Date(Number(unixSec) * 1000);
}

// ─── Challenge ID ─────────────────────────────────────────────────────────────

/** Format a raw uint256 challenge ID for display, e.g. "#42" */
export function formatChallengeId(id: bigint): string {
  return `#${id.toString()}`;
}

// ─── Result enum mapping ──────────────────────────────────────────────────────

/**
 * Map the frontend ParticipantStatus string to the on-chain uint8 result value.
 * Used when calling submitResult().
 */
export function statusToResult(status: ParticipantStatus): ParticipantResultValue {
  if (status === 'success') return ParticipantResult.Success;
  if (status === 'failure') return ParticipantResult.Failure;
  return ParticipantResult.Pending;
}

/**
 * Map the on-chain uint8 result back to a frontend ParticipantStatus.
 * Used when reading getParticipant().
 */
export function resultToStatus(result: ParticipantResultValue): ParticipantStatus {
  if (result === ParticipantResult.Success) return 'success';
  if (result === ParticipantResult.Failure) return 'failure';
  return 'pending';
}

