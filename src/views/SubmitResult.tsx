import { useState } from 'react';
import { useAccount } from 'wagmi';
import { type Address } from 'viem';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { TransactionState } from '../components/TransactionState';
import {
  useChallenge,
  useChallengeParticipants,
  useIsVerifier,
  useCommitPoolTransaction,
} from '../hooks/useCommitPool';
import { parseChallengeId, shortAddress } from '../utils/challenge';
import { statusToResult } from '../utils/contract';
import { ChallengeStatus, ParticipantResult } from '../contracts/CommitPool';
import type { ParticipantStatus } from '../types/commitment';
import type { AppView } from '../App';

interface Props {
  commitmentId: string;
  onNavigate: (view: AppView, commitmentId?: string) => void;
  onBack: () => void;
}

export function SubmitResult({ commitmentId, onNavigate, onBack }: Props) {
  const { isConnected } = useAccount();
  const challengeId = parseChallengeId(commitmentId);

  // ── Verifier gating — submitResult is verifier-only on-chain ──────────────
  const { isVerifier, verifier } = useIsVerifier();

  // ── Real contract reads ────────────────────────────────────────────────────
  const { challenge, isLoading } = useChallenge(challengeId);
  const { data: records } = useChallengeParticipants(challengeId, challenge?.participantList);

  // Local choices for participants whose on-chain result is still PENDING
  const [choices, setChoices] = useState<Record<string, 'success' | 'failure'>>({});
  // Which address is currently being submitted (one tx at a time)
  const [submitting, setSubmitting] = useState<Address | null>(null);

  const tx = useCommitPoolTransaction();

  if (!challengeId || (!isLoading && !challenge)) {
    return (
      <main style={{ padding: 'var(--space-10) 0' }}>
        <div className="container">
          <BackButton onClick={onBack} />
          <p style={{ color: 'var(--text-muted)' }}>Commitment not found on-chain.</p>
        </div>
      </main>
    );
  }

  if (isLoading || !challenge) {
    return (
      <main style={{ padding: 'var(--space-10) 0' }}>
        <div className="container">
          <BackButton onClick={onBack} />
          <p style={{ color: 'var(--text-muted)' }}>◌ Reading commitment from Monad Testnet…</p>
        </div>
      </main>
    );
  }

  const participantList = challenge.participantList;
  const isResolved = challenge.status === ChallengeStatus.Resolved;

  // On-chain submitted count (result != PENDING)
  const submittedCount = participantList.filter(
    (addr) => (records?.[addr.toLowerCase()]?.result ?? 0) !== ParticipantResult.Pending,
  ).length;
  const total = participantList.length;
  const allSet = submittedCount === total;

  function handleSetResult(addr: Address, status: 'success' | 'failure') {
    setChoices((prev) => ({ ...prev, [addr.toLowerCase()]: status }));
  }

  // Real submitResult() transaction — one participant per tx
  function handleSubmit(addr: Address) {
    const choice = choices[addr.toLowerCase()];
    if (!choice || !challengeId) return;
    setSubmitting(addr);
    void tx.send({
      functionName: 'submitResult',
      args: [challengeId, addr, statusToResult(choice as ParticipantStatus)],
    }).then(() => setSubmitting(null));
  }

  return (
    <main style={{ padding: 'var(--space-10) 0 var(--space-20)' }}>
      <div className="container" style={{ maxWidth: '720px' }}>
        <BackButton onClick={onBack} />

        {/* Header */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <Badge variant="warning" style={{ marginBottom: 'var(--space-3)' }}>
            Verification · Verifier only
          </Badge>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: 'var(--space-2)' }}>
            Submit Results
          </h1>
          <p style={{ fontSize: '14px' }}>
            Mark each participant as successful or failed. Each result is a real
            on-chain transaction signed by the verifier wallet.
          </p>
        </div>

        {/* Verifier gate */}
        {!isConnected ? (
          <Card style={{ marginBottom: 'var(--space-6)', borderColor: 'var(--warning)' }}>
            <p style={{ fontSize: '14px', color: 'var(--warning)', margin: 0 }}>
              Connect the verifier wallet to submit results.
            </p>
          </Card>
        ) : !isVerifier ? (
          <Card style={{ marginBottom: 'var(--space-6)', borderColor: 'var(--danger)' }}>
            <p style={{ fontSize: '14px', color: 'var(--danger)', margin: 0 }}>
              The connected wallet is not the contract verifier. Results can only
              be submitted by{' '}
              <span style={{ fontFamily: 'var(--font-mono)' }}>{shortAddress(verifier)}</span>.
            </p>
          </Card>
        ) : null}

        {isResolved && (
          <Card style={{ marginBottom: 'var(--space-6)' }}>
            <p style={{ fontSize: '14px', margin: 0 }}>
              This commitment is already resolved — no more results can be submitted.
            </p>
          </Card>
        )}

        {/* Commitment info */}
        <Card style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500, marginBottom: '4px' }}>Goal</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{challenge.goal}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500, marginBottom: '4px' }}>Progress</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: allSet ? 'var(--success)' : 'var(--text)' }}>
                {submittedCount} / {total} submitted
              </div>
            </div>
          </div>
        </Card>

        {/* Participant result rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
          {participantList.map((addr) => {
            const record = records?.[addr.toLowerCase()];
            const onChainResult = record?.result;
            const isCreator = addr.toLowerCase() === challenge.creator.toLowerCase();
            const isSet = onChainResult === ParticipantResult.Success || onChainResult === ParticipantResult.Failure;
            const isSubmittingThis = submitting?.toLowerCase() === addr.toLowerCase();
            return (
              <ResultRow
                key={addr}
                shortAddress={shortAddress(addr)}
                isCreator={isCreator}
                status={
                  isSet
                    ? onChainResult === ParticipantResult.Success ? 'success' : 'failure'
                    : choices[addr.toLowerCase()] ?? 'pending'
                }
                locked={isSet || !isVerifier || isResolved || (tx.status === 'confirming' || tx.status === 'pending')}
                submitting={isSubmittingThis && (tx.status === 'confirming' || tx.status === 'pending')}
                onSet={(s) => handleSetResult(addr, s)}
                onSubmit={() => handleSubmit(addr)}
              />
            );
          })}
        </div>

        {/* Tx state for the active submission */}
        {tx.status !== 'idle' && (
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <TransactionState
              status={tx.status}
              title={
                tx.status === 'success' ? 'Result submitted ✓' :
                tx.status === 'error' ? 'Submission failed' :
                'Submitting result…'
              }
              description={
                tx.status === 'confirming' ? 'Confirm the transaction in your wallet.' :
                tx.status === 'pending' ? 'Transaction pending on Monad Testnet…' :
                tx.status === 'success' ? 'The result has been recorded on-chain.' :
                tx.error
              }
              transactionHash={tx.hash}
              explorerUrl={tx.explorerUrl}
              onDismiss={() => tx.reset()}
            />
          </div>
        )}

        {/* Bottom action */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          {allSet ? (
            <Button variant="primary" size="lg" onClick={() => onNavigate('resolution', commitmentId)}>
              All results submitted — Resolve →
            </Button>
          ) : (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Submit a result for every participant to enable resolution.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

// ── Result row ────────────────────────────────────────────────────────────────
function ResultRow({
  shortAddress: short,
  isCreator,
  status,
  locked,
  submitting,
  onSet,
  onSubmit,
}: {
  shortAddress: string;
  isCreator: boolean;
  status: ParticipantStatus;
  locked: boolean;
  submitting: boolean;
  onSet: (s: 'success' | 'failure') => void;
  onSubmit: () => void;
}) {
  const hasChoice = status === 'success' || status === 'failure';
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
          {short.slice(2, 4).toUpperCase()}
        </div>
        <div>
          <span style={{ fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
            {short}
          </span>
          {isCreator && (
            <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--accent)', fontWeight: 600 }}>CREATOR</span>
          )}
        </div>
      </div>

      {/* Toggle buttons + submit */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
        <ResultToggle
          label="Success"
          active={status === 'success'}
          activeColor="var(--success)"
          activeBg="var(--success-dim)"
          disabled={locked}
          onClick={() => onSet('success')}
        />
        <ResultToggle
          label="Failure"
          active={status === 'failure'}
          activeColor="var(--danger)"
          activeBg="var(--danger-dim)"
          disabled={locked}
          onClick={() => onSet('failure')}
        />
        {locked && hasChoice ? (
          <Badge variant={status === 'success' ? 'success' : 'danger'}>
            {status === 'success' ? 'On-chain' : 'On-chain'}
          </Badge>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            disabled={!hasChoice || locked || submitting}
            onClick={onSubmit}
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </Button>
        )}
      </div>
    </div>
  );
}

function ResultToggle({
  label,
  active,
  activeColor,
  activeBg,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  activeColor: string;
  activeBg: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      disabled={disabled}
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
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled && !active ? 0.5 : 1,
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
