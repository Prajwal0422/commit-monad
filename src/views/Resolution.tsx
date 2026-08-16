import { getCommitmentById } from '../data/mockCommitments';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import type { AppView } from '../App';

interface Props {
  commitmentId: string;
  onNavigate: (view: AppView, commitmentId?: string) => void;
  onBack: () => void;
}

export function Resolution({ commitmentId, onNavigate, onBack }: Props) {
  // Default to the resolved demo commitment if none provided
  const commitment = getCommitmentById(commitmentId) ?? getCommitmentById('commit-resolved');

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

  const successCount = commitment.successCount ?? 2;
  const failureCount = commitment.failureCount ?? 1;
  const stake = commitment.stakePerParticipant;
  const totalPool = commitment.pool;
  const failedPool = failureCount * stake;
  const rewardPerWinner = successCount > 0 ? (stake + failedPool / successCount) : stake;
  const failedShare = rewardPerWinner - stake;

  return (
    <main style={{ padding: 'var(--space-10) 0 var(--space-20)' }}>
      <div className="container" style={{ maxWidth: '680px' }}>
        <BackButton onClick={onBack} />

        {/* Header */}
        <div style={{ marginBottom: 'var(--space-8)', textAlign: 'center' }}>
          <div
            style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'var(--success-dim)', border: '1px solid var(--success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto var(--space-5)', fontSize: '24px', color: 'var(--success)',
            }}
            aria-hidden="true"
          >
            ✓
          </div>
          <Badge variant="success" style={{ marginBottom: 'var(--space-4)' }}>
            Resolved · Mock
          </Badge>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: 'var(--space-3)' }}>
            Commitment resolved
          </h1>
          <p style={{ fontSize: '15px', maxWidth: '420px', margin: '0 auto' }}>
            {commitment.goal}
          </p>
        </div>

        {/* Outcome split */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-6)',
          }}
        >
          {/* Successful */}
          <Card style={{ borderColor: 'rgba(34, 197, 94, 0.25)', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--success)', marginBottom: 'var(--space-2)' }}>
              {successCount}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--success)', fontWeight: 600, marginBottom: '4px' }}>
              ✓ Successful
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {successCount === 1 ? 'participant' : 'participants'}
            </div>
          </Card>

          {/* Failed */}
          <Card style={{ borderColor: 'rgba(239, 68, 68, 0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--danger)', marginBottom: 'var(--space-2)' }}>
              {failureCount}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--danger)', fontWeight: 600, marginBottom: '4px' }}>
              ✕ Failed
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {failureCount === 1 ? 'participant' : 'participants'}
            </div>
          </Card>
        </div>

        {/* Pool breakdown */}
        <Card style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: 'var(--space-5)' }}>
            Reward breakdown
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <BreakdownRow label="Total pool" value={`${totalPool} MON`} />
            <BreakdownRow label="Original stake" value={`${stake} MON`} />
            <BreakdownRow label={`Share from ${failureCount} failed stake${failureCount !== 1 ? 's' : ''}`} value={`+${failedShare.toFixed(4)} MON`} positive />
            <BreakdownRow label="Reward per winner" value={`${rewardPerWinner.toFixed(4)} MON`} highlight last />
          </div>
        </Card>

        {/* Participants outcome list */}
        <Card style={{ marginBottom: 'var(--space-8)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
            Participants
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {commitment.participants.map((p) => (
              <div
                key={p.address}
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
                <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
                  {p.shortAddress}
                  {p.isCreator && <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--accent)', fontWeight: 600 }}>CREATOR</span>}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  {p.status === 'success' && (
                    <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 600 }}>
                      +{rewardPerWinner.toFixed(4)} MON
                    </span>
                  )}
                  <Badge variant={p.status === 'success' ? 'success' : 'danger'}>
                    {p.status === 'success' ? 'Success' : 'Failed'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* CTA */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            size="lg"
            onClick={() => onNavigate('claim', commitmentId)}
          >
            Continue to Claim →
          </Button>
          <Button variant="secondary" size="lg" onClick={onBack}>
            Back
          </Button>
        </div>
      </div>
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function BreakdownRow({
  label,
  value,
  highlight = false,
  positive = false,
  last = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  positive?: boolean;
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
      <span style={{
        color: highlight ? 'var(--accent)' : positive ? 'var(--success)' : 'var(--text)',
        fontVariantNumeric: 'tabular-nums',
      }}>
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
