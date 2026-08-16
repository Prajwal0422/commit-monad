// ─── Commitment domain types ──────────────────────────────────────────────────
// View-model types used by the UI. On-chain CommitPool data (bigint / wei /
// unix seconds) is mapped into these shapes by src/utils/challenge.ts.

export type CommitmentStatus = 'active' | 'pending_resolution' | 'resolved' | 'cancelled';
export type ParticipantStatus = 'pending' | 'success' | 'failure';

export interface Participant {
  address: string;         // wallet address
  shortAddress: string;    // pre-shortened for display e.g. 0x1234…5678
  status: ParticipantStatus;
  isCreator: boolean;
}

export interface Commitment {
  id: string;
  goal: string;
  description: string;
  creator: string;         // wallet address
  stakePerParticipant: number;   // in MON
  pool: number;            // total pool = stake × participantCount
  participantCount: number;
  maxParticipants: number;
  deadline: Date;          // when the commitment expires
  status: CommitmentStatus;
  category: string;
  participants: Participant[];
  // Resolution data — only present when status === 'resolved'
  successCount?: number;
  failureCount?: number;
  rewardPerWinner?: number;
}
