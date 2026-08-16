import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { TransactionState } from '../components/TransactionState';
import {
  useChallenge,
  useChallengeParticipants,
  useCommitPoolTransaction,
} from '../hooks/useCommitPool';
import { parseChallengeId, shortAddress, countResults } from '../utils/challenge';
import { formatMon } from '../utils/contract';
import { ChallengeStatus, ParticipantResult } from '../contracts/CommitPool';
import type { AppView } from '../App';

interface Props {
  commitmentId: string;
  onNavigate: (view: AppView, commitmentId?: string) => void;
  onBack: () => void;
}

export function Resolution({ commitmentId, onNavigate, onBack }: Props) {
  const challengeId = parseChallengeId(commitmentId);

  // ── Real contract reads ────────────────────────────────────────────────────
  const { challenge, isLoading } = useChallenge(challengeId);
  const { data: records } = useChallengeParticipants(challengeId, challenge?.participantList);

  // ── Real resolve transaction ───────────────────────────────────────────────
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

  const isResolved = challenge.status === ChallengeStatus.Resolved;
  const participantList = challenge.participantList;
  const { successCount, failureCount, pendingCount } = countResults(records ?? {});

  const stake = challenge.stakeAmount;
  const failedPool = BigInt(failureCount) * stake;
  // Contract payout logic: winners get stake + failedPool/successCount;
  // with zero winners every participant can reclaim their original stake.
  const payoutPerWinner = successCount > 0 ? stake + failedPool / BigInt(successCount) : stake;

  function handleResolve() {
    if (!challengeId) return;
    void tx.send({ functionName: 'resolveChallenge', args: [challengeId] });
  }

  // ── Open challenge: resolve action ─────────────────────────────────────────
  if (!isResolved) {
    const canResolve = participantList.length >= 2 && pendingCount === 0;
    return (
      <main style={{ padding: 'var(--space-10) 0 var(--space-20)' }}>
        <div className="container" style={{ maxWidth: '680px' }}>
          <BackButton onClick={onBack} />

          <div style={{ marginBottom: 'var(--space-8)', textAlign: 'center' }}>
            <div
              style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'var(--accent-dim)', border: '1px solid var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto var(--space-5)', fontSize: '24px', color: 'var(--accent)',
              }}
              aria-hidden="true"
            >
              ◌
            </div>
            <Badge variant="warning" style={{ marginBottom: 'var(--space-4)' }}>
              Awaiting resolution
            </Badge>
            <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: 'var(--space-3)' }}>
              Resolve this commitment
            </h1>
            <p style={{ fontSize: '15px', maxWidth: '460px', margin: '0 auto' }}>
              {challenge.goal}
            </p>
          </div>

          <Card style={{ marginBottom: 'var(--space-6)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              <BreakdownRow label="Results submitted" value={`${successCount + failureCount} / ${participantList.length}`} />
              <BreakdownRow label="Successful" value={String(successCount)} />
              <BreakdownRow label="Failed" value={String(failureCount)} />
              <BreakdownRow label="Pending" value={String(pendingCount)} last />
            </div>
          </Card>

          {/* Resolve tx state */}
          {tx.status !== 'idle' && (
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <TransactionState
                status={tx.status}
                title={
                  tx.status === 'success' ? 'Commitment resolved ✓' :
                  tx.status === 'error' ? 'Resolution failed' :
                  'Resolving commitment…'
                }
                description={
                  tx.status === 'confirming' ? 'Confirm the transaction in your wallet.' :
                  tx.status === 'pending' ? 'Transaction pending on Monad Testnet…' :
                  tx.status === 'success' ? 'Rewards are now claimable by successful participants.' :
                  tx.error
                }
                transactionHash={tx.hash}
                explorerUrl={tx.explorerUrl}
                onDismiss={() => tx.reset()}
                onRetry={tx.status === 'error' ? handleResolve : undefined}
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!canResolve || tx.status === 'confirming' || tx.status === 'pending'}
              onClick={handleResolve}
            >
              {tx.status === 'confirming' ? 'Confirm in wallet…' :
               tx.status === 'pending' ? 'Resolving…' :
               'Resolve Challenge →'}
            </Button>
            {!canResolve && (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
                {participantList.length < 2
                  ? 'At least 2 participants are required to resolve.'
                  : `${pendingCount} result${pendingCount !== 1 ? 's' : ''} still pending — the verifier must submit all results first.`}
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ── Resolved challenge: outcome view ───────────────────────────────────────
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
            Resolved · On-chain
          </Badge>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: 'var(--space-3)' }}>
            Commitment resolved
          </h1>
          <p style={{ fontSize: '15px', maxWidth: '420px', margin: '0 auto' }}>
            {challenge.goal}
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
            <BreakdownRow label="Total pool" value={`${formatMon(challenge.totalPool)} MON`} />
            <BreakdownRow label="Original stake" value={`${formatMon(stake)} MON`} />
            {successCount > 0 ? (
              <>
                <BreakdownRow
                  label={`Share from ${failureCount} failed stake${failureCount !== 1 ? 's' : ''}`}
                  value={`+${formatMon(successCount > 0 ? failedPool / BigInt(successCount) : 0n)} MON`}
                  positive
                />
                <BreakdownRow label="Reward per winner" value={`${formatMon(payoutPerWinner)} MON`} highlight last />
              </>
            ) : (
              <BreakdownRow
                label="Outcome"
                value="No winners — everyone reclaims their stake"
                highlight
                last
              />
            )}
          </div>
        </Card>

        {/* Participants outcome list */}
        <Card style={{ marginBottom: 'var(--space-8)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
            Participants
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {participantList.map((addr) => {
              const record = records?.[addr.toLowerCase()];
              const result = record?.result ?? ParticipantResult.Pending;
              const isCreator = addr.toLowerCase() === challenge.creator.toLowerCase();
              const isSuccess = result === ParticipantResult.Success;
              const isFailure = result === ParticipantResult.Failure;
              return (
                <div
                  key={addr}
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
                    {shortAddress(addr)}
                    {isCreator && <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--accent)', fontWeight: 600 }}>CREATOR</span>}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    {(isSuccess || (successCount === 0 && result !== ParticipantResult.Failure)) && (
                      <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 600 }}>
                        +{formatMon(payoutPerWinner)} MON claimable
                      </span>
                    )}
                    <Badge variant={isSuccess ? 'success' : isFailure ? 'danger' : 'default'}>
                      {isSuccess ? 'Success' : isFailure ? 'Failed' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              );
            })}
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
