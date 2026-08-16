// ─── CommitPool contract ABI & address ───────────────────────────────────────
//
// ABI sourced from the authoritative compiled artifact:
//   commitpool-contract/artifacts/contracts/CommitPool.sol/CommitPool.json
//
// DO NOT hand-edit this ABI. If the contract changes, re-copy the `abi` field
// from that artifact file.
//
// DEPLOYED on Monad Testnet (chainId 10143):
//   tx 0x207eeae7d30d7706c6692299fc58987aa4f15980d0782cde486fdbcb31b9cd41
//   record: commitpool-contract/deployments/monadTestnet.json
// Keep this file in sync with the artifact whenever the contract is recompiled.

import { type Address } from 'viem';

// ─── Contract address ─────────────────────────────────────────────────────────
// Real deployed CommitPool on Monad Testnet. Do NOT change unless redeploying.
export const COMMIT_POOL_ADDRESS = '0x4A2D4eb789FE86029C58F2fc604B1957C6D12b09' as const satisfies Address;

// Authorized verifier (result submitter) — mirrors the deployment record.
// The authoritative on-chain value is read via the `verifier()` getter; this
// constant lets the UI gate verifier-only controls without an extra read.
export const VERIFIER_ADDRESS = '0x105586A142c95BCC27C78549e0b0D9796D243BDe' as const satisfies Address;

// ─── ABI — exact copy of the artifact's `abi` field ──────────────────────────
export const CommitPoolAbi = [

  // ── Constructor ──────────────────────────────────────────────────────────────
  {
    type: 'constructor',
    stateMutability: 'nonpayable',
    inputs: [
      { internalType: 'address', name: '_verifier', type: 'address' },
    ],
  },

  // ── Custom errors ─────────────────────────────────────────────────────────────
  { type: 'error', name: 'AlreadyClaimed',            inputs: [] },
  { type: 'error', name: 'AlreadyJoined',             inputs: [] },
  { type: 'error', name: 'ChallengeAlreadyResolved',  inputs: [] },
  { type: 'error', name: 'ChallengeFull',             inputs: [] },
  { type: 'error', name: 'ChallengeNotOpen',          inputs: [] },
  { type: 'error', name: 'ChallengeNotResolved',      inputs: [] },
  { type: 'error', name: 'DeadlineInPast',            inputs: [] },
  { type: 'error', name: 'DeadlinePassed',            inputs: [] },
  { type: 'error', name: 'EmptyGoal',                 inputs: [] },
  { type: 'error', name: 'IncorrectStakeAmount',      inputs: [] },
  { type: 'error', name: 'InsufficientParticipants',  inputs: [] },
  { type: 'error', name: 'InvalidChallengeId',        inputs: [] },
  { type: 'error', name: 'InvalidMaxParticipants',    inputs: [] },
  { type: 'error', name: 'InvalidResult',             inputs: [] },
  { type: 'error', name: 'NotAllResultsSubmitted',    inputs: [] },
  { type: 'error', name: 'NotParticipant',            inputs: [] },
  { type: 'error', name: 'NotVerifier',               inputs: [] },
  { type: 'error', name: 'OnlySuccessfulParticipants', inputs: [] },
  { type: 'error', name: 'ResultAlreadySet',          inputs: [] },
  { type: 'error', name: 'TransferFailed',            inputs: [] },
  { type: 'error', name: 'ZeroStake',                 inputs: [] },

  // ── Events ────────────────────────────────────────────────────────────────────
  {
    type: 'event',
    name: 'ChallengeCreated',
    anonymous: false,
    inputs: [
      { indexed: true,  internalType: 'uint256', name: 'challengeId',     type: 'uint256' },
      { indexed: true,  internalType: 'address', name: 'creator',         type: 'address' },
      { indexed: false, internalType: 'string',  name: 'goal',            type: 'string'  },
      { indexed: false, internalType: 'uint256', name: 'stakeAmount',     type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'deadline',        type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'maxParticipants', type: 'uint256' },
    ],
  },

  {
    type: 'event',
    name: 'ChallengeJoined',
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'challengeId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'participant', type: 'address' },
    ],
  },

  {
    // NOTE: artifact field names are `successfulCount` / `failedCount`
    // (not successCount / failureCount — previous frontend ABI was wrong)
    type: 'event',
    name: 'ChallengeResolved',
    anonymous: false,
    inputs: [
      { indexed: true,  internalType: 'uint256', name: 'challengeId',    type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'successfulCount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'failedCount',     type: 'uint256' },
    ],
  },

  {
    type: 'event',
    name: 'ResultSubmitted',
    anonymous: false,
    inputs: [
      { indexed: true,  internalType: 'uint256',      name: 'challengeId', type: 'uint256' },
      { indexed: true,  internalType: 'address',      name: 'participant', type: 'address' },
      { indexed: false, internalType: 'enum Result',  name: 'result',      type: 'uint8'   },
    ],
  },

  {
    // NOTE: artifact field name is `payout` (not `amount` — previous frontend ABI was wrong)
    type: 'event',
    name: 'RewardClaimed',
    anonymous: false,
    inputs: [
      { indexed: true,  internalType: 'uint256', name: 'challengeId', type: 'uint256' },
      { indexed: true,  internalType: 'address', name: 'participant', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'payout',      type: 'uint256' },
    ],
  },

  // ── Public mapping accessors (auto-generated getters) ────────────────────────
  {
    type: 'function',
    name: 'challenges',
    stateMutability: 'view',
    inputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
    ],
    outputs: [
      { internalType: 'address',     name: 'creator',          type: 'address' },
      { internalType: 'string',      name: 'goal',             type: 'string'  },
      { internalType: 'uint256',     name: 'stakeAmount',      type: 'uint256' },
      { internalType: 'uint256',     name: 'deadline',         type: 'uint256' },
      { internalType: 'uint256',     name: 'maxParticipants',  type: 'uint256' },
      { internalType: 'uint256',     name: 'participantCount', type: 'uint256' },
      { internalType: 'uint256',     name: 'totalPool',        type: 'uint256' },
      { internalType: 'enum Status', name: 'status',           type: 'uint8'   },
    ],
  },

  {
    type: 'function',
    name: 'participants',
    stateMutability: 'view',
    inputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'address', name: '', type: 'address' },
    ],
    outputs: [
      { internalType: 'bool',          name: 'hasJoined',  type: 'bool'  },
      { internalType: 'enum Result',   name: 'result',     type: 'uint8' },
      { internalType: 'bool',          name: 'hasClaimed', type: 'bool'  },
    ],
  },

  // ── Write functions ───────────────────────────────────────────────────────────
  {
    type: 'function',
    name: 'createChallenge',
    stateMutability: 'payable',
    inputs: [
      { internalType: 'string',  name: 'goal',            type: 'string'  },
      { internalType: 'uint256', name: 'stakeAmount',     type: 'uint256' },
      { internalType: 'uint256', name: 'deadline',        type: 'uint256' },
      { internalType: 'uint256', name: 'maxParticipants', type: 'uint256' },
    ],
    outputs: [
      { internalType: 'uint256', name: 'challengeId', type: 'uint256' },
    ],
  },

  {
    type: 'function',
    name: 'joinChallenge',
    stateMutability: 'payable',
    inputs: [
      { internalType: 'uint256', name: 'challengeId', type: 'uint256' },
    ],
    outputs: [],
  },

  {
    type: 'function',
    name: 'submitResult',
    stateMutability: 'nonpayable',
    inputs: [
      { internalType: 'uint256',     name: 'challengeId', type: 'uint256' },
      { internalType: 'address',     name: 'participant', type: 'address' },
      { internalType: 'enum Result', name: 'result',      type: 'uint8'   },
    ],
    outputs: [],
  },

  {
    type: 'function',
    name: 'resolveChallenge',
    stateMutability: 'nonpayable',
    inputs: [
      { internalType: 'uint256', name: 'challengeId', type: 'uint256' },
    ],
    outputs: [],
  },

  {
    type: 'function',
    name: 'claimReward',
    stateMutability: 'nonpayable',
    inputs: [
      { internalType: 'uint256', name: 'challengeId', type: 'uint256' },
    ],
    outputs: [],
  },

  // ── Read functions ────────────────────────────────────────────────────────────
  {
    // Returns the full Challenge struct including participantList.
    // NOTE: output is a tuple (struct), not flat fields.
    // Field order matches the artifact exactly:
    //   creator, goal, stakeAmount, deadline, maxParticipants,
    //   participantCount, totalPool, status (uint8), participantList (address[])
    type: 'function',
    name: 'getChallenge',
    stateMutability: 'view',
    inputs: [
      { internalType: 'uint256', name: 'challengeId', type: 'uint256' },
    ],
    outputs: [
      {
        internalType: 'struct Challenge',
        name: '',
        type: 'tuple',
        components: [
          { internalType: 'address',     name: 'creator',          type: 'address'   },
          { internalType: 'string',      name: 'goal',             type: 'string'    },
          { internalType: 'uint256',     name: 'stakeAmount',      type: 'uint256'   },
          { internalType: 'uint256',     name: 'deadline',         type: 'uint256'   },
          { internalType: 'uint256',     name: 'maxParticipants',  type: 'uint256'   },
          { internalType: 'uint256',     name: 'participantCount', type: 'uint256'   },
          { internalType: 'uint256',     name: 'totalPool',        type: 'uint256'   },
          { internalType: 'enum Status', name: 'status',           type: 'uint8'     },
          { internalType: 'address[]',   name: 'participantList',  type: 'address[]' },
        ],
      },
    ],
  },

  {
    // Returns the Participant struct.
    // NOTE: field is `hasClaimed` (not `claimed` — previous frontend ABI was wrong).
    type: 'function',
    name: 'getParticipant',
    stateMutability: 'view',
    inputs: [
      { internalType: 'uint256', name: 'challengeId', type: 'uint256' },
      { internalType: 'address', name: 'participant', type: 'address' },
    ],
    outputs: [
      {
        internalType: 'struct Participant',
        name: '',
        type: 'tuple',
        components: [
          { internalType: 'bool',        name: 'hasJoined',  type: 'bool'  },
          { internalType: 'enum Result', name: 'result',     type: 'uint8' },
          { internalType: 'bool',        name: 'hasClaimed', type: 'bool'  },
        ],
      },
    ],
  },

  {
    type: 'function',
    name: 'nextChallengeId',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
    ],
  },

  {
    type: 'function',
    name: 'verifier',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { internalType: 'address', name: '', type: 'address' },
    ],
  },

] as const;

// ─── On-chain enum values ─────────────────────────────────────────────────────
// These must stay in sync with the Solidity enum declarations in CommitPool.sol.

/** Result enum — order: Pending=0, Success=1, Failure=2 */
export const ParticipantResult = {
  Pending: 0,
  Success: 1,
  Failure: 2,
} as const;
export type ParticipantResultValue = (typeof ParticipantResult)[keyof typeof ParticipantResult];

/** Status enum — order: Open=0, Resolved=1 */
export const ChallengeStatus = {
  Open:     0,
  Resolved: 1,
} as const;
export type ChallengeStatusValue = (typeof ChallengeStatus)[keyof typeof ChallengeStatus];
