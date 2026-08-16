import { useAccount } from 'wagmi';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { TransactionState } from '../components/TransactionState';
import {
  useChallenge,
  useParticipant,
  useChallengeParticipants,
  useCommitPoolTransaction,
} from '../hooks/useCommitPool';
import { parseChallengeId, countResults } from '../utils/challenge';
import { formatMon } from '../utils/contract';
import { ChallengeStatus, ParticipantResult } from '../contracts/CommitPool';
import type { AppView } from '../App';

interface Props {
  commitmentId: string;
  onNavigate: (view: AppView, commitmentId?: string) => void;
  onBack: () => void;
}

export function ClaimReward({ commitmentId, onNavigate, onBack }: Props) {
  const { address, isConnected } = useAccount();
  const challengeId = parseChallengeId(commitmentId);

  // ── Real contract reads ────────────────────────────────────────────────────
  const { challenge, isLoading } = useChallenge(challengeId);
  const { participant: myRecord } = useParticipant(challengeId, address);
  const { data: records } = useChallengeParticipants(challengeId, challenge?.participantList);

  // ── Real claim transaction ─────────────────────────────────────────────────
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
  const { successCount, failureCount } = countResults(records ?? {});
  const stake = challenge.stakeAmount;
  const failedPool = BigInt(failureCount) * stake;
  // Contract payout logic (claimReward):
  //   - with winners:   payout = stake + failedPool / successCount (SUCCESS only)
  //   - without winners: every participant reclaims their original stake
  const hasWinners = successCount > 0;
  const payout = hasWinners ? stake + failedPool / BigInt(successCount) : stake;

  // Eligibility is read straight from the contract — never faked
  const myResult = myRecord?.result ?? ParticipantResult.Pending;
  const hasJoined = !!myRecord?.hasJoined;
  const hasClaimed = !!myRecord?.hasClaimed;
  const isWinner = myResult === ParticipantResult.Success;
  const isEligible = isConnected && hasJoined && !hasClaimed && (hasWinners ? isWinner : true);

  function handleClaim() {
    if (!challengeId) return;
    void tx.send({ functionName: 'claimReward', args: [challengeId] });
  }

  // ── Guard states ───────────────────────────────────────────────────────────
  if (!isResolved) {
    return (
      <main style={{ padding: 'var(--space-10) 0 var(--space-20)' }}>
        <div className="container" style={{ maxWidth: '560px' }}>
          <BackButton onClick={onBack} />
          <Card style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-3)' }}>Not resolved yet</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--space-5)' }}>
              Rewards can only be claimed after the commitment has been resolved on-chain.
            </p>
            <Button variant="secondary" onClick={() => onNavigate('resolution', commitmentId)}>
              Go to Resolution →
            </Button>
          </Card>
        </div>
      </main>
    );
  }

  if (!isConnected) {
    return (
      <main style={{ padding: 'var(--space-10) 0 var(--space-20)' }}>
        <div className="container" style={{ maxWidth: '560px' }}>
          <BackButton onClick={onBack} />
          <Card style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-3)' }}>Connect your wallet</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
              Connect the wallet you participated with to check your claim eligibility.
            </p>
          </Card>
        </div>
      </main>
    );
  }

  if (!hasJoined) {
    return (
      <main style={{ padding: 'var(--space-10) 0 var(--space-20)' }}>
        <div className="container" style={{ maxWidth: '560px' }}>
          <BackButton onClick={onBack} />
          <Card style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-3)' }}>Not a participant</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--space-5)' }}>
              The connected wallet did not join this commitment, so there is nothing to claim.
            </p>
            <Button variant="secondary" onClick={() => onNavigate('details', commitmentId)}>
              Back to commitment
            </Button>
          </Card>
        </div>
      </main>
    );
  }

  const claimable = isEligible && !hasClaimed;

  return (
    <main style={{ padding: 'var(--space-10) 0 var(--space-20)' }}>
      <div className="container" style={{ maxWidth: '560px' }}>
        <BackButton onClick={onBack} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <Badge
            variant={claimable ? 'success' : hasClaimed ? 'default' : 'danger'}
            style={{ marginBottom: 'var(--space-4)' }}
          >
            {hasClaimed ? 'Already claimed' : claimable ? (hasWinners ? 'Winner' : 'Stake return') : 'Failed'}
          </Badge>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: 'var(--space-2)' }}>
            {hasClaimed ? 'Reward already claimed' :
             claimable ? (hasWinners ? 'Claim your reward' : 'Reclaim your stake') :
             'Better luck next time'}
          </h1>
          <p style={{ fontSize: '14px', maxWidth: '380px', margin: '0 auto' }}>
            {hasClaimed
              ? 'This wallet has already claimed its reward for this commitment.'
              : claimable
              ? hasWinners
                ? 'You completed your commitment. Claim your original stake plus a share of the failed pool.'
                : 'No participant succeeded, so the contract returns your original stake.'
              : 'You did not meet the commitment criteria. Your stake is distributed to the winners.'}
          </p>
        </div>

        {/* Payout card — amounts derived from on-chain state */}
        <Card style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <PayoutRow label="Your result" value={isWinner ? '✓ Success' : myResult === ParticipantResult.Failure ? '✕ Failed' : '— Pending'} success={isWinner} />
            <PayoutRow label="Original stake" value={`${formatMon(stake)} MON`} />
            {claimable && hasWinners && (
              <PayoutRow
                label={`Bonus from ${failureCount} failed stake${failureCount !== 1 ? 's' : ''}`}
                value={`+${formatMon(failedPool / BigInt(successCount))} MON`}
                positive
              />
            )}
            <PayoutRow
              label={claimable ? 'Claimable payout' : 'Total payout'}
              value={claimable ? `${formatMon(payout)} MON` : '0 MON'}
              highlight
              last
            />
          </div>
        </Card>

        {/* Tx state or CTA */}
        {tx.status !== 'idle' ? (
          <TransactionState
            status={tx.status}
            title={
              tx.status === 'success' ? `Reward claimed — +${formatMon(payout)} MON` :
              tx.status === 'error' ? 'Claim failed' :
              'Claiming reward…'
            }
            description={
              tx.status === 'confirming' ? 'Confirm the transaction in your wallet.' :
              tx.status === 'pending' ? 'Transaction pending on Monad Testnet…' :
              tx.status === 'success' ? `${formatMon(payout)} MON has been sent to your wallet.` :
              tx.error
            }
            transactionHash={tx.hash}
            explorerUrl={tx.explorerUrl}
            onDismiss={
              tx.status === 'success'
                ? () => onNavigate('landing')
                : () => tx.reset()
            }
            onRetry={tx.status === 'error' ? handleClaim : undefined}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {claimable ? (
              <Button variant="primary" size="lg" fullWidth onClick={handleClaim}>
                Claim {formatMon(payout)} MON →
              </Button>
            ) : (
              <Button variant="secondary" size="lg" fullWidth onClick={() => onNavigate('landing')}>
                Back to Home
              </Button>
            )}
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
              {claimable
                ? 'Real on-chain transaction — the contract pays out directly to your wallet'
                : 'Eligibility is read from the CommitPool contract'}
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
