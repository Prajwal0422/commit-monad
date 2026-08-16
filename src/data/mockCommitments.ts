// ─── Mock commitment data ─────────────────────────────────────────────────────
// MOCK ONLY — replace these with useReadContract calls when the contract is live.
// Structure intentionally mirrors Commitment type so the swap is one-for-one.

import type { Commitment } from '../types/commitment';

const now = new Date();
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000);

export const MOCK_COMMITMENTS: Commitment[] = [
  {
    id: 'commit-1',
    goal: 'Run 5km every day',
    description: 'Complete a 5km run every single day without missing a session. Track with any fitness app.',
    creator: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    stakePerParticipant: 1,
    pool: 4,
    participantCount: 4,
    maxParticipants: 10,
    deadline: hoursFromNow(5 * 24),
    status: 'active',
    category: 'Fitness',
    participants: [
      { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', shortAddress: '0xd8dA…6045', status: 'success', isCreator: true },
      { address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', shortAddress: '0xAb58…eC9B', status: 'pending', isCreator: false },
      { address: '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326', shortAddress: '0x1f90…c326', status: 'pending', isCreator: false },
      { address: '0x4675C7e5BaAFBFFbca748158bEcBA61ef3b0a263', shortAddress: '0x4675…a263', status: 'failure', isCreator: false },
    ],
  },
  {
    id: 'commit-2',
    goal: 'Study 2 hours daily',
    description: 'Dedicate at least 2 hours to focused study every day — no distractions, Pomodoro encouraged.',
    creator: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
    stakePerParticipant: 0.5,
    pool: 1.5,
    participantCount: 3,
    maxParticipants: 5,
    deadline: hoursFromNow(2 * 24),
    status: 'active',
    category: 'Learning',
    participants: [
      { address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', shortAddress: '0xAb58…eC9B', status: 'success', isCreator: true },
      { address: '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326', shortAddress: '0x1f90…c326', status: 'success', isCreator: false },
      { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', shortAddress: '0xd8dA…6045', status: 'pending', isCreator: false },
    ],
  },
  {
    id: 'commit-3',
    goal: '100 push-ups daily',
    description: 'Complete 100 push-ups every day, spread across however many sets you need.',
    creator: '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326',
    stakePerParticipant: 2,
    pool: 12,
    participantCount: 6,
    maxParticipants: 10,
    deadline: hoursFromNow(8),
    status: 'active',
    category: 'Fitness',
    participants: [
      { address: '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326', shortAddress: '0x1f90…c326', status: 'success', isCreator: true },
      { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', shortAddress: '0xd8dA…6045', status: 'success', isCreator: false },
      { address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', shortAddress: '0xAb58…eC9B', status: 'success', isCreator: false },
      { address: '0x4675C7e5BaAFBFFbca748158bEcBA61ef3b0a263', shortAddress: '0x4675…a263', status: 'failure', isCreator: false },
      { address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', shortAddress: '0x7a25…88D', status: 'pending', isCreator: false },
      { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', shortAddress: '0x2260…C599', status: 'pending', isCreator: false },
    ],
  },
  {
    id: 'commit-4',
    goal: 'Ship a side project',
    description: 'Launch a working product or feature publicly by the deadline. A GitHub repo or live URL counts.',
    creator: '0x4675C7e5BaAFBFFbca748158bEcBA61ef3b0a263',
    stakePerParticipant: 3,
    pool: 9,
    participantCount: 3,
    maxParticipants: 8,
    deadline: hoursFromNow(9 * 24),
    status: 'active',
    category: 'Build',
    participants: [
      { address: '0x4675C7e5BaAFBFFbca748158bEcBA61ef3b0a263', shortAddress: '0x4675…a263', status: 'pending', isCreator: true },
      { address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', shortAddress: '0x7a25…488D', status: 'pending', isCreator: false },
      { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', shortAddress: '0x2260…C599', status: 'pending', isCreator: false },
    ],
  },
  {
    id: 'commit-5',
    goal: 'No social media for 7 days',
    description: 'Completely avoid all social media platforms for one week. Screen time screenshots as proof.',
    creator: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    stakePerParticipant: 1.5,
    pool: 7.5,
    participantCount: 5,
    maxParticipants: 20,
    deadline: hoursFromNow(16 * 24),
    status: 'active',
    category: 'Mindfulness',
    participants: [
      { address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', shortAddress: '0x7a25…488D', status: 'pending', isCreator: true },
      { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', shortAddress: '0x2260…C599', status: 'pending', isCreator: false },
      { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', shortAddress: '0xd8dA…6045', status: 'pending', isCreator: false },
      { address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', shortAddress: '0xAb58…eC9B', status: 'pending', isCreator: false },
      { address: '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326', shortAddress: '0x1f90…c326', status: 'pending', isCreator: false },
    ],
  },
  // Resolved commitment — used for Resolution + ClaimReward demo
  {
    id: 'commit-resolved',
    goal: '100 push-ups daily',
    description: 'Complete 100 push-ups every day, spread across however many sets.',
    creator: '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326',
    stakePerParticipant: 1,
    pool: 3,
    participantCount: 3,
    maxParticipants: 10,
    deadline: hoursFromNow(-24),   // already expired
    status: 'resolved',
    category: 'Fitness',
    successCount: 2,
    failureCount: 1,
    rewardPerWinner: 1.5,
    participants: [
      { address: '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326', shortAddress: '0x1f90…c326', status: 'success', isCreator: true },
      { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', shortAddress: '0xd8dA…6045', status: 'success', isCreator: false },
      { address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', shortAddress: '0xAb58…eC9B', status: 'failure', isCreator: false },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function getCommitmentById(id: string): Commitment | undefined {
  return MOCK_COMMITMENTS.find((c) => c.id === id);
}

export function formatTimeRemaining(deadline: Date): string {
  const diffMs = deadline.getTime() - Date.now();
  if (diffMs <= 0) return 'Expired';
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 24) return `${diffH}h remaining`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d remaining`;
}
