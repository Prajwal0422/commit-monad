import { useState } from 'react';
import { useAccount } from 'wagmi';
import { getCommitmentById } from '../data/mockCommitments';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { TransactionState } from '../components/TransactionState';
import type { TxStatus } from '../components/TransactionState';
import type { AppView } from '../App';

interface Props {
  commitmentId: string;
  onNavigate: (view: AppView, commitmentId?: string) => void;
  onBack: () => void;
}

export function ClaimReward({ commitmentId, onNavigate, onBack }: Props) {
  const { address } = useAccount();
  const commitment = getCommitmentById(commitmentId) ?? getCommitmentById('commit-resolved');

  const [txStatus, setTxStatus] = useState<TxStatus>('idle');

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

  // Determine if connected wallet is a winner
  // MOCK ONLY — replace with contract read when live
  const connectedParticipant = address
    ? commitment.participants.find(
        (p) => p.address.toLowerCase() === address.toLowerCase()
      )
    : null;

  // Default to showing success state for demo purposes when no wallet matched
  const participantStatus = connectedParticipant?.status ?? 'success';
  const isWinner = participantStatus === 'success';

  const stake = commitment.stakePerParticipant;
  const successCount = commitment.successCount ?? 2;
  const failureCount = commitment.failureCount ?? 1;
  const failedPool = failureCount * stake;
  const rewardBonus = successCount > 0 ? failedPool / successCount : 0;
  const totalPayout = isWinner ? stake + rewardBonus : 0;

  // MOCK claim — replace with useWriteContract when live
  function handleClaim() {
    setTxStatus('preparing');
    setTimeout(() => setTxStatus('confirming'), 900);
    setTimeout(() => setTxStatus('pending'), 1800);
    setTimeout(() => setTxStatus('success'), 3200);
  }

  return (
    <main style={{ padding: 'var(--space-10) 0 var(--space-20)' }}>
      <div className="container" style={{ maxWidth: '560px' }}>
        <BackButton onClick={onBack} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <Badge
            variant={isWinner ? 'success' : 'danger'}
            style={{ marginBottom: 'var(--space-4)' }}
          >
            {isWinner ? 'Winner' : 'Failed'} · Mock
          </Badge>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: 'var(--space-2)' }}>
            {isWinner ? 'Claim your reward' : 'Better luck next time'}
          </h1>
          <p style={{ fontSize: '14px', maxWidth: '380px', margin: '0 auto' }}>
            {isWinner
              ? 'You completed your commitment. Claim your original stake plus a share of the failed pool.'
              : 'You did not meet the commitment criteria. Your stake was distributed to the winners.'}
          </p>
        </div>

        {/* Payout card */}
        <Card style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <PayoutRow label="Your result" value={isWinner ? '✓ Success' : '✕ Failed'} success={isWinner} />
            <PayoutRow label="Original stake" value={`${stake} MON`} />
            {isWinner && (
              <PayoutRow
                label={`Bonus from ${failureCount} failed stake${failureCount !== 1 ? 's' : ''}`}
                value={`+${rewardBonus.toFixed(4)} MON`}
                positive
              />
            )}
            <PayoutRow
              label="Total payout"
              value={isWinner ? `${totalPayout.toFixed(4)} MON` : '0 MON'}
              highlight
              last
            />
          </div>
        </Card>

        {/* Tx state or CTA */}
        {txStatus !== 'idle' ? (
          <TransactionState
            status={txStatus}
            title={
              txStatus === 'success' ? `Reward claimed — +${totalPayout.toFixed(4)} MON` :
              txStatus === 'error' ? 'Claim failed' :
              'Claiming reward…'
            }
            description={
              txStatus === 'preparing' ? 'Preparing transaction…' :
              txStatus === 'confirming' ? 'Waiting for wallet confirmation…' :
              txStatus === 'pending' ? 'Transaction pending on Monad…' :
              txStatus === 'success'
                ? `${totalPayout.toFixed(4)} MON will be returned to your wallet once the contract is live.`
                : 'Something went wrong. Please try again.'
            }
            isMock
            onDismiss={
              txStatus === 'success'
                ? () => onNavigate('landing')
                : () => setTxStatus('idle')
            }
            onRetry={handleClaim}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {isWinner ? (
              <Button variant="primary" size="lg" fullWidth onClick={handleClaim}>
                Claim {totalPayout.toFixed(4)} MON →
              </Button>
            ) : (
              <Button variant="secondary" size="lg" fullWidth onClick={() => onNavigate('landing')}>
                Back to Home
              </Button>
            )}
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
              Mock transaction — no funds moved until contract integration
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function PayoutRow({
  label,
  value,
  highlight = false,
  positive = false,
  success = false,
  last = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  positive?: boolean;
  success?: boolean;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: 'var(--space-4) 0',
        borderBottom: last ? 'none' : '1px solid var(--border)',
        fontSize: '14px',
        fontWeight: highlight ? 700 : 400,
      }}
    >
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span
        style={{
          color: highlight ? 'var(--accent)'
            : positive ? 'var(--success)'
            : success ? 'var(--success)'
            : 'var(--text)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
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
