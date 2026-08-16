// ─── CommitPool hooks ─────────────────────────────────────────────────────────
// Reusable wagmi/viem hooks for interacting with the REAL deployed CommitPool
// contract on Monad Testnet. Every write goes through useWriteContract and is
// only considered successful after useWaitForTransactionReceipt confirms it.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import { parseEventLogs, type Address, type Hash } from 'viem';
import {
  CommitPoolAbi,
  COMMIT_POOL_ADDRESS,
  VERIFIER_ADDRESS,
} from '../contracts/CommitPool';
import { monadTestnet } from '../config/wagmi';
import { recordActivity } from '../utils/sessionActivity';

// ─── Constants & query keys ───────────────────────────────────────────────────

export const COMMIT_POOL_CHAIN_ID = monadTestnet.id;

export const commitPoolKeys = {
  all: ['commitPool'] as const,
  challenge: (id: bigint) => ['commitPool', 'challenge', id.toString()] as const,
  participant: (id: bigint, who?: Address) =>
    ['commitPool', 'participant', id.toString(), who?.toLowerCase()] as const,
  list: ['commitPool', 'challenges'] as const,
};

// ─── On-chain types (decoded from the authoritative ABI) ─────────────────────

export interface OnChainChallenge {
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

export interface OnChainParticipant {
  hasJoined: boolean;
  result: number;
  hasClaimed: boolean;
}

export interface ChallengeWithId extends OnChainChallenge {
  id: bigint;
}

// ─── Explorer links ───────────────────────────────────────────────────────────

const EXPLORER_URL = monadTestnet.blockExplorers.default.url;

export function explorerTxUrl(hash: Hash): string {
  return `${EXPLORER_URL}/tx/${hash}`;
}

export function explorerAddressUrl(address: Address): string {
  return `${EXPLORER_URL}/address/${address}`;
}

// ─── Error formatting ─────────────────────────────────────────────────────────

/**
 * Extract a human-readable message from wallet / viem errors.
 * Prefers viem's `shortMessage` (e.g. the decoded custom error) over the
 * verbose full message.
 */
export function formatTxError(error: unknown): string {
  if (error && typeof error === 'object') {
    const err = error as { shortMessage?: string; message?: string; name?: string };
    if (err.shortMessage) return err.shortMessage;
    if (err.message) return err.message;
  }
  return 'Transaction failed';
}

// ─── Read hooks ───────────────────────────────────────────────────────────────

/** Read a single challenge via getChallenge(challengeId). */
export function useChallenge(challengeId: bigint | undefined) {
  const result = useReadContract({
    address: COMMIT_POOL_ADDRESS,
    abi: CommitPoolAbi,
    functionName: 'getChallenge',
    args: challengeId !== undefined ? [challengeId] : undefined,
    chainId: COMMIT_POOL_CHAIN_ID,
    query: {
      enabled: challengeId !== undefined,
    },
  });
  return { ...result, challenge: result.data as OnChainChallenge | undefined };
}

/** Read a participant record via getParticipant(challengeId, participant). */
export function useParticipant(challengeId: bigint | undefined, participant: Address | undefined) {
  const result = useReadContract({
    address: COMMIT_POOL_ADDRESS,
    abi: CommitPoolAbi,
    functionName: 'getParticipant',
    args: challengeId !== undefined && participant ? [challengeId, participant] : undefined,
    chainId: COMMIT_POOL_CHAIN_ID,
    query: {
      enabled: challengeId !== undefined && !!participant,
    },
  });
  return { ...result, participant: result.data as OnChainParticipant | undefined };
}

/**
 * List all challenges by reading nextChallengeId() and then getChallenge()
 * for every ID (IDs start at 1). Suitable for a hackathon-scale dataset;
 * no off-chain database is involved.
 */
export function useAllChallenges() {
  const publicClient = usePublicClient({ chainId: COMMIT_POOL_CHAIN_ID });

  return useQuery({
    queryKey: commitPoolKeys.list,
    enabled: !!publicClient,
    queryFn: async (): Promise<ChallengeWithId[]> => {
      const nextId = (await publicClient!.readContract({
        address: COMMIT_POOL_ADDRESS,
        abi: CommitPoolAbi,
        functionName: 'nextChallengeId',
      } as never)) as bigint;

      const ids: bigint[] = [];
      for (let i = 1n; i < nextId; i++) ids.push(i);

      const challenges = await Promise.all(
        ids.map((id) =>
          publicClient!.readContract({
            address: COMMIT_POOL_ADDRESS,
            abi: CommitPoolAbi,
            functionName: 'getChallenge',
            args: [id],
          } as never) as Promise<OnChainChallenge>,
        ),
      );

      return challenges.map((challenge, idx) => ({ id: ids[idx], ...challenge }));
    },
  });
}

/**
 * Read every participant record for a challenge via getParticipant().
 * Returns a map keyed by lowercased participant address.
 */
export function useChallengeParticipants(
  challengeId: bigint | undefined,
  participantList: Address[] | undefined,
) {
  const publicClient = usePublicClient({ chainId: COMMIT_POOL_CHAIN_ID });
  const listKey = participantList?.join(',').toLowerCase();

  return useQuery({
    queryKey: ['commitPool', 'participants', challengeId?.toString(), listKey],
    enabled: !!publicClient && challengeId !== undefined && !!participantList?.length,
    queryFn: async () => {
      const records = await Promise.all(
        participantList!.map((who) =>
          publicClient!.readContract({
            address: COMMIT_POOL_ADDRESS,
            abi: CommitPoolAbi,
            functionName: 'getParticipant',
            args: [challengeId!, who],
          } as never) as Promise<OnChainParticipant>,
        ),
      );
      const map: Record<string, OnChainParticipant> = {};
      participantList!.forEach((who, i) => {
        map[who.toLowerCase()] = records[i];
      });
      return map;
    },
  });
}

/**
 * Count how many participants have a SUCCESS result on-chain. Used to derive
 * claim eligibility exactly like the contract does (zero winners → everyone
 * reclaims their stake; otherwise only winners are paid).
 */
export function useSuccessCount(
  challengeId: bigint | undefined,
  participantList: Address[] | undefined,
) {
  const publicClient = usePublicClient({ chainId: COMMIT_POOL_CHAIN_ID });
  const listKey = participantList?.join(',').toLowerCase();

  return useQuery({
    queryKey: ['commitPool', 'successCount', challengeId?.toString(), listKey],
    enabled: !!publicClient && challengeId !== undefined && !!participantList?.length,
    queryFn: async (): Promise<number> => {
      const records = await Promise.all(
        participantList!.map((who) =>
          publicClient!.readContract({
            address: COMMIT_POOL_ADDRESS,
            abi: CommitPoolAbi,
            functionName: 'getParticipant',
            args: [challengeId!, who],
          } as never) as Promise<OnChainParticipant>,
        ),
      );
      return records.filter((r) => r.result === 1).length;
    },
  });
}

/** Read the on-chain verifier address (authoritative) with constant fallback. */
export function useVerifier() {
  const result = useReadContract({
    address: COMMIT_POOL_ADDRESS,
    abi: CommitPoolAbi,
    functionName: 'verifier',
    chainId: COMMIT_POOL_CHAIN_ID,
  });
  const verifier = (result.data as Address | undefined) ?? VERIFIER_ADDRESS;
  return { ...result, verifier };
}

/** True when the connected wallet is the contract's verifier. */
export function useIsVerifier() {
  const { address } = useAccount();
  const { verifier, isLoading } = useVerifier();
  const isVerifier = useMemo(
    () => !!address && address.toLowerCase() === verifier.toLowerCase(),
    [address, verifier],
  );
  return { isVerifier, verifier, isLoading };
}

/**
 * Invalidate all CommitPool reads — call after a confirmed write.
 * Covers both our custom useQuery keys ('commitPool') and wagmi's
 * auto-derived useReadContract keys ('readContract').
 */
export function useInvalidateCommitPool() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: commitPoolKeys.all });
    queryClient.invalidateQueries({ queryKey: ['readContract'] });
  }, [queryClient]);
}

// ─── Transaction lifecycle ────────────────────────────────────────────────────

/** Lifecycle states aligned with the TransactionState component. */
export type TxLifecycle = 'idle' | 'confirming' | 'pending' | 'success' | 'error';

/** Human-readable action names for the session activity feed. */
const TX_ACTION_LABELS: Record<string, string> = {
  createChallenge: 'Create Commitment',
  joinChallenge: 'Join',
  submitResult: 'Submit Result',
  resolveChallenge: 'Resolve',
  claimReward: 'Claim Reward',
};

export interface CommitPoolTxArgs {
  functionName: string;
  args?: readonly unknown[];
  value?: bigint;
}

/**
 * One full write-transaction lifecycle against CommitPool:
 *   idle → confirming (wallet prompt) → pending (on-chain) → success | error
 *
 * `success` is only reached after useWaitForTransactionReceipt confirms the
 * receipt. All CommitPool reads are invalidated once confirmed.
 */
export function useCommitPoolTransaction() {
  const { writeContractAsync } = useWriteContract();
  const invalidate = useInvalidateCommitPool();

  const [hash, setHash] = useState<Hash | undefined>();
  const [status, setStatus] = useState<TxLifecycle>('idle');
  const [error, setError] = useState<string>();

  // Last sent tx descriptor — used to record session activity once confirmed.
  const lastTx = useRef<CommitPoolTxArgs | undefined>(undefined);

  const receipt = useWaitForTransactionReceipt({ hash });

  // Wallet confirmation happens inside writeContractAsync (MetaMask prompt).
  const send = useCallback(
    async (tx: CommitPoolTxArgs): Promise<Hash | undefined> => {
      setStatus('confirming');
      setError(undefined);
      setHash(undefined);
      try {
        const txHash = await writeContractAsync({
          address: COMMIT_POOL_ADDRESS,
          abi: CommitPoolAbi,
          chainId: COMMIT_POOL_CHAIN_ID,
          functionName: tx.functionName,
          args: tx.args,
          ...(tx.value !== undefined ? { value: tx.value } : {}),
        } as Parameters<typeof writeContractAsync>[0]);
        lastTx.current = tx;
        setHash(txHash);
        setStatus('pending');
        return txHash;
      } catch (e) {
        setStatus('error');
        setError(formatTxError(e));
        return undefined;
      }
    },
    [writeContractAsync],
  );

  useEffect(() => {
    if (hash && receipt.isSuccess) {
      setStatus('success');
      invalidate();
      // Record the confirmed transaction in the session activity feed.
      const tx = lastTx.current;
      if (tx) {
        recordActivity({
          action: TX_ACTION_LABELS[tx.functionName] ?? tx.functionName,
          hash,
          challengeId: typeof tx.args?.[0] === 'bigint' ? tx.args[0] : undefined,
        });
      }
    } else if (hash && receipt.isError) {
      setStatus('error');
      setError(formatTxError(receipt.error) + ' (transaction reverted)');
    }
  }, [hash, receipt.isSuccess, receipt.isError, receipt.error, invalidate]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(undefined);
    setHash(undefined);
    lastTx.current = undefined;
  }, []);

  return {
    send,
    hash,
    status,
    error,
    reset,
    receipt: receipt.data,
    explorerUrl: hash ? explorerTxUrl(hash) : undefined,
  };
}

// ─── Event decoding ───────────────────────────────────────────────────────────

/**
 * Extract the new challenge ID from a createChallenge receipt by decoding the
 * ChallengeCreated event from the receipt logs.
 */
export function getCreatedChallengeId(
  receipt: { logs: readonly any[] } | undefined | null,
): bigint | undefined {
  if (!receipt) return undefined;
  try {
    const events = parseEventLogs({
      abi: CommitPoolAbi,
      eventName: 'ChallengeCreated',
      logs: receipt.logs as never,
    });
    const first = events[0];
    if (first && 'challengeId' in first.args) {
      return first.args.challengeId as bigint;
    }
  } catch {
    // fall through — event simply not present in these logs
  }
  return undefined;
}
