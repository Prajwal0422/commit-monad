import { useState } from 'react';
import { getCommitmentById } from '../data/mockCommitments';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { TransactionState } from '../components/TransactionState';
import type { TxStatus } from '../components/TransactionState';
import type { ParticipantStatus } from '../types/commitment';
import type { AppView } from '../App';

interface Props {
  commitmentId: string;
  onNavigate: (view: AppView, commitmentId?: string) => void;
  onBack: () => void;
}

export function SubmitResult({ commitmentId, onNavigate, onBack }: Props) {
  const commitment = getCommitmentById(commitmentId);

  // Local result state keyed by address
  // MOCK ONLY — replace with contract write when live
  const [results, setResults] = useState<Record<string, ParticipantStatus>>(() => {
    const init: Record<string, ParticipantStatus> = {};
    commitment?.participants.forEach((p) => { init[p.address] = p.status; });
    return init;
  });

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

  const submittedCount = Object.values(results).filter((r) => r !== 'pending').length;
  const total = commitment.participants.length;
  const allSet = submittedCount === total;

  function setResult(address: string, status: ParticipantStatus) {
    setResults((prev) => ({ ...prev, [address]: status }));
  }

  // MOCK submit — replace with useWriteContract
  function handleSubmit() {
    setTxStatus('preparing');
    setTimeout(() => setTxStatus('confirming'), 800);
    setTimeout(() => setTxStatus('pending'), 1600);
    setTimeout(() => {
      setTxStatus('success');
    }, 2800);
  }

  return (
    <main style={{ padding: 'var(--space-10) 0 var(--space-20)' }}>
      <div className="container" style={{ maxWidth: '720px' }}>
        <BackButton onClick={onBack} />

        {/* Header */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <Badge variant="warning" style={{ marginBottom: 'var(--space-3)' }}>
            Verification · Mock
          </Badge>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: 'var(--space-2)' }}>
            Submit Results
          </h1>
          <p style={{ fontSize: '14px' }}>
            Mark each participant as successful or failed.
          </p>
        </div>

        {/* Commitment info */}
        <Card style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500, marginBottom: '4px' }}>Goal</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{commitment.goal}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500, marginBottom: '4px' }}>Progress</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: submittedCount === total ? 'var(--success)' : 'var(--text)' }}>
                {submittedCount} / {total} submitted
              </div>
            </div>
          </div>
        </Card>

        {/* Participant result rows */}
        {txStatus === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
            {commitment.participants.map((p) => (
              <ResultRow
                key={p.address}
                shortAddress={p.shortAddress}
                isCreator={p.isCreator}
                status={results[p.address] ?? 'pending'}
                onSet={(s) => setResult(p.address, s)}
              />
            ))}
          </div>
        )}

        {/* Tx state */}
        {txStatus !== 'idle' ? (
          <TransactionState
            status={txStatus}
            title={
              txStatus === 'success' ? 'Results submitted ✓' :
              txStatus === 'error' ? 'Submission failed' :
              'Submitting results…'
            }
            description={
              txStatus === 'preparing' ? 'Preparing transaction…' :
              txStatus === 'confirming' ? 'Waiting for wallet confirmation…' :
              txStatus === 'pending' ? 'Transaction pending on Monad…' :
              txStatus === 'success' ? 'Results have been recorded locally. Contract submission coming soon.' :
              'Something went wrong.'
            }
            isMock
            onDismiss={
              txStatus === 'success'
                ? () => onNavigate('resolution', commitmentId)
                : () => setTxStatus('idle')
            }
            onRetry={handleSubmit}
          />
        ) : (
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              size="lg"
              disabled={!allSet}
              onClick={handleSubmit}
            >
              Submit Results →
            </Button>
            {!allSet && (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', alignSelf: 'center', margin: 0 }}>
                Set all {total} results to continue.
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

// ── Result row ────────────────────────────────────────────────────────────────
function ResultRow({
  shortAddress,
  isCreator,
  status,
  onSet,
}: {
  shortAddress: string;
  isCreator: boolean;
  status: ParticipantStatus;
  onSet: (s: ParticipantStatus) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        padding: 'var(--space-4)',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        flexWrap: 'wrap',
      }}
    >
      {/* Address */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div
          style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'var(--border)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '11px', color: 'var(--text-muted)',
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          {shortAddress.slice(2, 4).toUpperCase()}
        </div>
        <div>
          <span style={{ fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
            {shortAddress}
          </span>
          {isCreator && (
            <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--accent)', fontWeight: 600 }}>CREATOR</span>
          )}
        </div>
      </div>

      {/* Toggle buttons */}
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <ResultToggle
          label="Success"
          active={status === 'success'}
          activeColor="var(--success)"
          activeBg="var(--success-dim)"
          onClick={() => onSet('success')}
        />
        <ResultToggle
          label="Failure"
          active={status === 'failure'}
          activeColor="var(--danger)"
          activeBg="var(--danger-dim)"
          onClick={() => onSet('failure')}
        />
      </div>
    </div>
  );
}

function ResultToggle({
  label,
  active,
  activeColor,
  activeBg,
  onClick,
}: {
  label: string;
  active: boolean;
  activeColor: string;
  activeBg: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        height: '34px',
        padding: '0 14px',
        fontSize: '12px',
        fontWeight: 600,
        fontFamily: 'var(--font-sans)',
        borderRadius: 'var(--radius-sm)',
        border: `1px solid ${active ? activeColor : 'var(--border)'}`,
        background: active ? activeBg : 'transparent',
        color: active ? activeColor : 'var(--text-muted)',
        cursor: 'pointer',
        transition: 'all var(--transition)',
      }}
    >
      {label}
    </button>
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
