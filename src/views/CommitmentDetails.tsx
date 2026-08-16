import { useState } from 'react';
import { useAccount } from 'wagmi';
import { getCommitmentById, formatTimeRemaining } from '../data/mockCommitments';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { TransactionState } from '../components/TransactionState';
import type { TxStatus } from '../components/TransactionState';
import type { Participant } from '../types/commitment';
import type { AppView } from '../App';

interface Props {
  commitmentId: string;
  onNavigate: (view: AppView, commitmentId?: string) => void;
  onBack: () => void;
}

export function CommitmentDetails({ commitmentId, onNavigate, onBack }: Props) {
  const { address } = useAccount();
  const commitment = getCommitmentById(commitmentId);

  const [joinStatus, setJoinStatus] = useState<TxStatus>('idle');
  const [hasJoined, setHasJoined] = useState(false);

  if (!commitment) {
    return (
      <main style={{ padding: 'var(--space-10) 0' }}>
        <div className="container">
          <BackButton onClick={onBack} />
          <p style={{ color: 'var(--text-muted)' }}>Commitment not found.</p>
        </div>
      </main>
    );
  }

  const fillRatio = commitment.participantCount / commitment.maxParticipants;
  const isFull = commitment.participantCount >= commitment.maxParticipants;
  const isResolved = commitment.status === 'resolved';

  // Check if connected wallet is already a participant (mock comparison)
  const isParticipant =
    hasJoined ||
    (address ? commitment.participants.some((p) => p.address.toLowerCase() === address.toLowerCase()) : false);

  // ── Mock join flow ────────────────────────────────────────────────────────────
  // MOCK ONLY — replace with useWriteContract when contract is live
  function handleJoin() {
    setJoinStatus('preparing');
    setTimeout(() => setJoinStatus('confirming'), 900);
    setTimeout(() => setJoinStatus('pending'), 1800);
    setTimeout(() => {
      setJoinStatus('success');
      setHasJoined(true);
    }, 3000);
  }

  return (
    <main style={{ padding: 'var(--space-10) 0 var(--space-20)' }}>
      <div className="container">
        <BackButton onClick={onBack} />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 300px',
            gap: 'var(--space-8)',
            alignItems: 'start',
          }}
          className="create-form-grid"
        >
          {/* ── Left: main content ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

            {/* Header card */}
            <Card>
              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
                <Badge variant="default">{commitment.category}</Badge>
                <StatusBadge status={commitment.status} />
                <Badge variant="accent">Mock Data</Badge>
              </div>
              <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', marginBottom: 'var(--space-3)' }}>
                {commitment.goal}
              </h1>
              <p style={{ fontSize: '14px', lineHeight: 1.7, marginBottom: 'var(--space-5)' }}>
                {commitment.description}
              </p>

              {/* Stats grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: 'var(--space-1)',
                  paddingTop: 'var(--space-5)',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <DetailStat label="Stake" value={`${commitment.stakePerParticipant} MON`} highlight />
                <DetailStat label="Pool" value={`${commitment.pool} MON`} highlight />
                <DetailStat label="Participants" value={`${commitment.participantCount} / ${commitment.maxParticipants}`} />
                <DetailStat label="Time Left" value={formatTimeRemaining(commitment.deadline)} />
              </div>
            </Card>

            {/* Participants card */}
            <Card>
              <div style={{ marginBottom: 'var(--space-5)' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
                  Participants
                </h2>
                {/* Fill bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                  <span>Filled</span>
                  <span>{commitment.participantCount} / {commitment.maxParticipants}</span>
                </div>
                <div style={{ height: '6px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${fillRatio * 100}%`,
                      background: 'var(--accent)',
                      borderRadius: '99px',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {commitment.participants.map((p) => (
                  <ParticipantRow key={p.address} participant={p} />
                ))}
              </div>
            </Card>

            {/* Join tx state */}
            {joinStatus !== 'idle' && (
              <TransactionState
                status={joinStatus}
                title={
                  joinStatus === 'success' ? 'You joined the commitment!' :
                  joinStatus === 'error' ? 'Failed to join' :
                  'Joining commitment…'
                }
                description={
                  joinStatus === 'preparing' ? 'Preparing transaction…' :
                  joinStatus === 'confirming' ? 'Waiting for wallet confirmation…' :
                  joinStatus === 'pending' ? 'Transaction pending on Monad…' :
                  joinStatus === 'success' ? `${commitment.stakePerParticipant} MON staked. Good luck.` :
                  'Something went wrong. Try again.'
                }
                isMock
                onDismiss={() => setJoinStatus('idle')}
                onRetry={handleJoin}
              />
            )}
          </div>

          {/* ── Right: action panel ── */}
          <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Card>
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 'var(--space-5)' }}>
                {isResolved ? 'Commitment Resolved' : 'Join this Commitment'}
              </h3>

              {isResolved ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <p style={{ fontSize: '13px' }}>This commitment has been resolved.</p>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => onNavigate('resolution', commitment.id)}
                  >
                    View Results →
                  </Button>
                </div>
              ) : isParticipant ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-3) var(--space-4)',
                      background: 'var(--success-dim)',
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    <span style={{ color: 'var(--success)', fontSize: '14px' }}>✓</span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--success)' }}>
                      You're participating
                    </span>
                  </div>
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => onNavigate('submit-result', commitment.id)}
                  >
                    Submit Result →
                  </Button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <ActionRow label="Stake required" value={`${commitment.stakePerParticipant} MON`} />
                  <ActionRow label="Spots left" value={isFull ? 'Full' : `${commitment.maxParticipants - commitment.participantCount}`} />
                  <Button
                    variant="primary"
                    fullWidth
                    disabled={isFull || joinStatus !== 'idle'}
                    onClick={handleJoin}
                  >
                    {isFull ? 'Full' : `Join · Stake ${commitment.stakePerParticipant} MON`}
                  </Button>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
                    Mock transaction — no funds moved
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ParticipantRow({ participant }: { participant: Participant }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-3) var(--space-4)',
        background: 'var(--surface-2)',
        borderRadius: 'var(--radius)',
        gap: 'var(--space-3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            color: 'var(--text-muted)',
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          {participant.shortAddress.slice(2, 4).toUpperCase()}
        </div>
        <div>
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
            {participant.shortAddress}
          </span>
          {participant.isCreator && (
            <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--accent)', fontWeight: 600 }}>CREATOR</span>
          )}
        </div>
      </div>
      <ParticipantStatusBadge status={participant.status} />
    </div>
  );
}

function ParticipantStatusBadge({ status }: { status: Participant['status'] }) {
  const map = {
    success: { label: 'Success', variant: 'success' as const },
    failure: { label: 'Failed',  variant: 'danger'  as const },
    pending: { label: 'Pending', variant: 'default' as const },
  };
  const cfg = map[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: 'success' | 'warning' | 'default' | 'danger' }> = {
    active:             { label: 'Active',    variant: 'success' },
    pending_resolution: { label: 'Resolving', variant: 'warning' },
    resolved:           { label: 'Resolved',  variant: 'default' },
    cancelled:          { label: 'Cancelled', variant: 'danger'  },
  };
  const cfg = map[status] ?? { label: status, variant: 'default' as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function DetailStat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ padding: 'var(--space-4)' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontSize: '16px', fontWeight: 700, color: highlight ? 'var(--accent)' : 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  );
}

function ActionRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{value}</span>
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
