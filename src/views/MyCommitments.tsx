// ─── My Commitments view ──────────────────────────────────────────────────────
// Lists every on-chain challenge where the connected wallet is the creator or
// a participant. All data comes from real CommitPool reads — no mock data.

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import {
  useAllChallenges,
  useParticipant,
  useSuccessCount,
  type ChallengeWithId,
} from '../hooks/useCommitPool';
import { shortAddress } from '../utils/challenge';
import { deadlineToDate, formatChallengeId, formatMon } from '../utils/contract';
import { ChallengeStatus, ParticipantResult } from '../contracts/CommitPool';
import type { AppView } from '../App';

type Filter = 'all' | 'active' | 'completed' | 'won' | 'lost';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
];

interface Props {
  onNavigate: (view: AppView, commitmentId?: string) => void;
  onBack: () => void;
}

export function MyCommitments({ onNavigate, onBack }: Props) {
  const { address, isConnected } = useAccount();
  const [filter, setFilter] = useState<Filter>('all');

  const { data: challenges, isLoading, isError, refetch } = useAllChallenges();

  if (!isConnected || !address) {
    return (
      <main style={{ padding: 'var(--space-10) 0 var(--space-20)' }}>
        <div className="container">
          <BackButton onClick={onBack} />
          <Card style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.4rem', marginBottom: 'var(--space-3)' }}>My Commitments</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
              Connect your wallet to see the commitments you created or joined on the
              CommitPool contract.
            </p>
          </Card>
        </div>
      </main>
    );
  }

  // Only challenges where the connected wallet is creator or a participant
  const mine = (challenges ?? []).filter(
    (c) =>
      c.creator.toLowerCase() === address.toLowerCase() ||
      c.participantList.some((p) => p.toLowerCase() === address.toLowerCase()),
  );

  return (
    <main style={{ padding: 'var(--space-10) 0 var(--space-20)' }}>
      <div className="container">
        <BackButton onClick={onBack} />

        {/* Header */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <Badge variant="success" style={{ marginBottom: 'var(--space-3)' }}>
            Live · Monad Testnet
          </Badge>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: 'var(--space-2)' }}>
            My Commitments
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
            Commitments created or joined by{' '}
            <span style={{ fontFamily: 'var(--font-mono)' }}>{shortAddress(address)}</span>{' '}
            — read directly from the CommitPool contract.
          </p>
        </div>

        {/* Filters */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            flexWrap: 'wrap',
            marginBottom: 'var(--space-6)',
          }}
          role="tablist"
          aria-label="Filter commitments"
        >
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={filter === key}
              onClick={() => setFilter(key)}
              style={{
                fontSize: '13px',
                fontWeight: 500,
                padding: '6px 14px',
                borderRadius: '99px',
                border: `1px solid ${filter === key ? 'var(--accent)' : 'var(--border)'}`,
                background: filter === key ? 'var(--accent-dim)' : 'transparent',
                color: filter === key ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'all var(--transition)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        {isLoading ? (
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>◌ Reading from chain…</p>
        ) : isError ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
            <p style={{ fontSize: '14px', color: 'var(--danger)', margin: 0 }}>
              Failed to read commitments from Monad Testnet.
            </p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : mine.length === 0 ? (
          <Card style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--space-5)' }}>
              You haven't created or joined any commitments yet.
            </p>
            <Button variant="primary" onClick={() => onNavigate('create')}>
              Create a Commitment
            </Button>
          </Card>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 'var(--space-5)',
            }}
          >
            {mine.map((challenge) => (
              <MyCommitmentCard
                key={challenge.id.toString()}
                challenge={challenge}
                address={address}
                filter={filter}
                onView={(id) => onNavigate('details', id)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function MyCommitmentCard({
  challenge,
  address,
  filter,
  onView,
}: {
  challenge: ChallengeWithId;
  address: `0x${string}`;
  filter: Filter;
  onView: (id: string) => void;
}) {
  const isCreator = challenge.creator.toLowerCase() === address.toLowerCase();

  // Authoritative participation record for the connected wallet
  const { participant } = useParticipant(challenge.id, address);
  // Success count drives claim eligibility, exactly like the contract does
  const { data: successCount } = useSuccessCount(challenge.id, challenge.participantList);

  const resolved = challenge.status === ChallengeStatus.Resolved;
  const deadlinePassed = deadlineToDate(challenge.deadline).getTime() <= Date.now();
  const isActive = !resolved && !deadlinePassed;
  const result = participant?.result ?? ParticipantResult.Pending;
  const hasJoined = !!participant?.hasJoined;
  const won = resolved && result === ParticipantResult.Success;
  const lost = resolved && result === ParticipantResult.Failure;

  // Filter match — cards that don't match the active filter are hidden
  const matches =
    filter === 'all' ||
    (filter === 'active' && isActive) ||
    (filter === 'completed' && resolved) ||
    (filter === 'won' && won) ||
    (filter === 'lost' && lost);
  if (!matches) return null;

  return (
    <Card hoverable onClick={() => onView(challenge.id.toString())} style={{ cursor: 'pointer' }}>
      {/* Badges */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        <Badge variant="default">{formatChallengeId(challenge.id)}</Badge>
        <Badge variant={isCreator ? 'accent' : 'default'}>{isCreator ? 'Creator' : 'Joined'}</Badge>
        {resolved ? (
          <Badge variant="default">Resolved</Badge>
        ) : isActive ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="warning">Resolving</Badge>
        )}
        {resolved && hasJoined && (
          result === ParticipantResult.Success ? (
            <Badge variant="success">Won</Badge>
          ) : result === ParticipantResult.Failure ? (
            <Badge variant="danger">Lost</Badge>
          ) : (
            <Badge variant="default">Result: Pending</Badge>
          )
        )}
      </div>

      {/* Goal */}
      <h3
        style={{
          fontSize: '15px',
          fontWeight: 600,
          lineHeight: 1.5,
          margin: '0 0 var(--space-4)',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {challenge.goal}
      </h3>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 'var(--space-2) var(--space-4)',
          paddingTop: 'var(--space-4)',
          borderTop: '1px solid var(--border)',
        }}
      >
        <CardStat label="Stake" value={`${formatMon(challenge.stakeAmount, 2)} MON`} />
        <CardStat label="Total Pool" value={`${formatMon(challenge.totalPool, 2)} MON`} />
        <CardStat label="Participants" value={`${challenge.participantCount} / ${challenge.maxParticipants}`} />
        <CardStat label="My Result" value={resultLabel(hasJoined, result)} />
      </div>

      {/* Claim status — derived from on-chain records, never faked */}
      <div
        style={{
          marginTop: 'var(--space-4)',
          fontSize: '12px',
          fontWeight: 500,
          color: claimTone(hasJoined, resolved, result, successCount),
        }}
      >
        {claimLabel(hasJoined, resolved, result, successCount)}
      </div>
    </Card>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resultLabel(hasJoined: boolean, result: number): string {
  if (!hasJoined) return '—';
  if (result === ParticipantResult.Success) return 'Success';
  if (result === ParticipantResult.Failure) return 'Failed';
  return 'Pending';
}

/** Claim status text, mirroring the contract's payout rules. */
function claimLabel(
  hasJoined: boolean,
  resolved: boolean,
  result: number,
  successCount: number | undefined,
): string {
  if (!hasJoined) return 'Not participating';
  if (!resolved) return 'Reward pending — commitment not resolved yet';
  if (successCount === undefined) return 'Claim status loading…';
  if (successCount === 0) return 'No winners — stake reclaimable';
  if (result === ParticipantResult.Success) return 'Claimable — you won';
  return 'Not claimable — stake goes to winners';
}

function claimTone(
  hasJoined: boolean,
  resolved: boolean,
  result: number,
  successCount: number | undefined,
): string {
  if (!hasJoined || !resolved || successCount === undefined) return 'var(--text-muted)';
  if (successCount === 0 || result === ParticipantResult.Success) return 'var(--success)';
  return 'var(--text-muted)';
}

function CardStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          fontWeight: 500,
          marginBottom: '2px',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)',
        background: 'none', border: 'none', cursor: 'pointer',
        padding: 0, marginBottom: 'var(--space-8)',
        fontFamily: 'var(--font-sans)', transition: 'color var(--transition)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
    >
      ← Back
    </button>
  );
}
