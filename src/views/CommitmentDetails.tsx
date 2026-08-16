import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { TransactionState } from '../components/TransactionState';
import {
  useChallenge,
  useChallengeParticipants,
  useParticipant,
  useSuccessCount,
  useCommitPoolTransaction,
  useIsVerifier,
  explorerTxUrl,
} from '../hooks/useCommitPool';
import { useSessionActivity } from '../utils/sessionActivity';
import { parseChallengeId, buildParticipants, challengeToCommitment, formatTimeRemaining, shortAddress, countResults } from '../utils/challenge';
import { deadlineToDate, formatMon } from '../utils/contract';
import { ChallengeStatus, ParticipantResult } from '../contracts/CommitPool';
import type { Participant } from '../types/commitment';
import type { AppView } from '../App';

interface Props {
  commitmentId: string;
  onNavigate: (view: AppView, commitmentId?: string) => void;
  onBack: () => void;
}

export function CommitmentDetails({ commitmentId, onNavigate, onBack }: Props) {
  const { address, isConnected } = useAccount();

  // commitmentId flows through navigation as a decimal string (on-chain uint256)
  const challengeId = parseChallengeId(commitmentId);

  // ── Real contract reads ────────────────────────────────────────────────────
  const { challenge, isLoading: challengeLoading, isError: challengeError } = useChallenge(challengeId);
  const { data: records } = useChallengeParticipants(challengeId, challenge?.participantList);
  const { participant: myRecord } = useParticipant(challengeId, address);
  // Success count drives claim eligibility exactly like the contract does
  const { data: successCount } = useSuccessCount(challengeId, challenge?.participantList);
  // Real transactions confirmed in this session, filtered to this challenge
  const sessionActivity = useSessionActivity(challengeId);

  // ── Real join transaction ──────────────────────────────────────────────────
  const tx = useCommitPoolTransaction();
  // Separate lifecycle for the creator's resolve transaction
  const resolveTx = useCommitPoolTransaction();
  // Result submission is verifier-authorized by the deployed contract
  const { isVerifier } = useIsVerifier();

  if (!challengeId) {
    return (
      <main style={{ padding: 'var(--space-10) 0' }}>
        <div className="container">
          <BackButton onClick={onBack} />
          <p style={{ color: 'var(--text-muted)' }}>Invalid commitment ID.</p>
        </div>
      </main>
    );
  }

  if (challengeLoading) {
    return (
      <main style={{ padding: 'var(--space-10) 0' }}>
        <div className="container">
          <BackButton onClick={onBack} />
          <p style={{ color: 'var(--text-muted)' }}>◌ Reading commitment from Monad Testnet…</p>
        </div>
      </main>
    );
  }

  if (!challenge || challengeError || challenge.creator === '0x0000000000000000000000000000000000000000') {
    return (
      <main style={{ padding: 'var(--space-10) 0' }}>
        <div className="container">
          <BackButton onClick={onBack} />
          <p style={{ color: 'var(--text-muted)' }}>Commitment not found on-chain.</p>
        </div>
      </main>
    );
  }

  // ── Derived display data ───────────────────────────────────────────────────
  const commitment = challengeToCommitment({ id: challengeId, ...challenge });
  const participants: Participant[] = buildParticipants(
    { id: challengeId, ...challenge },
    records ?? {},
  );

  const fillRatio = Number(challenge.participantCount) / Number(challenge.maxParticipants);
  const isFull = challenge.participantCount >= challenge.maxParticipants;
  const isResolved = challenge.status === ChallengeStatus.Resolved;
  const deadlinePassed = deadlineToDate(challenge.deadline).getTime() <= Date.now();

  // Connected user's participation — authoritative on-chain read
  const isParticipant = !!myRecord?.hasJoined;
  const isCreator = !!address && challenge.creator.toLowerCase() === address.toLowerCase();
  const myResult = myRecord?.result ?? ParticipantResult.Pending;
  const hasClaimed = !!myRecord?.hasClaimed;

  // Claim eligibility mirrors the contract: with winners only SUCCESS results
  // claim; with zero winners everyone reclaims their stake.
  const claimable =
    isResolved && isParticipant && !hasClaimed &&
    successCount !== undefined &&
    (successCount === 0 || myResult === ParticipantResult.Success);

  // Payout display — same integer math the contract performs
  const successCountBig = BigInt(successCount ?? 0);
  const failedPool = challenge.totalPool - challenge.stakeAmount * successCountBig;
  const payout =
    successCountBig > 0n
      ? challenge.stakeAmount + failedPool / successCountBig
      : challenge.stakeAmount;

  // Resolve eligibility — mirrors the contract's requirements: at least 2
  // participants and every participant's result submitted (by the verifier).
  const { pendingCount } = countResults(records ?? {});
  const resultsLoaded = !!records && Object.keys(records).length > 0;
  const canResolve =
    !isResolved &&
    challenge.participantCount >= 2n &&
    resultsLoaded &&
    pendingCount === 0;

  const joinDisabled =
    !isConnected || isFull || isResolved || deadlinePassed || isParticipant ||
    tx.status === 'confirming' || tx.status === 'pending';

  function handleJoin() {
    if (!challengeId) return;
    // msg.value MUST equal the challenge's stakeAmount exactly
    void tx.send({
      functionName: 'joinChallenge',
      args: [challengeId],
      value: challenge!.stakeAmount,
    });
  }

  function handleResolve() {
    if (!challengeId) return;
    void resolveTx.send({
      functionName: 'resolveChallenge',
      args: [challengeId],
    });
  }

  const txDescription =
    tx.status === 'confirming' ? 'Confirm the transaction in your wallet.' :
    tx.status === 'pending' ? 'Transaction pending on Monad Testnet…' :
    tx.status === 'success' ? `${formatMon(challenge!.stakeAmount)} MON staked. Good luck.` :
    tx.status === 'error' ? tx.error : undefined;

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
                <Badge variant="success">Live</Badge>
              </div>
              <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', marginBottom: 'var(--space-3)' }}>
                {commitment.goal}
              </h1>
              <p style={{ fontSize: '14px', lineHeight: 1.7, marginBottom: 'var(--space-5)', color: 'var(--text-secondary)' }}>
                Created by{' '}
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  {commitment.creator.slice(0, 6)}…{commitment.creator.slice(-4)}
                </span>{' '}
                — stake is held by the CommitPool contract until resolution.
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
                <DetailStat label="Stake" value={`${formatMon(challenge.stakeAmount)} MON`} highlight />
                <DetailStat label="Pool" value={`${formatMon(challenge.totalPool)} MON`} highlight />
                <DetailStat label="Participants" value={`${challenge.participantCount} / ${challenge.maxParticipants}`} />
                <DetailStat label="Time Left" value={formatTimeRemaining(commitment.deadline)} />
              </div>
            </Card>

            {/* Invite participants */}
            <InviteParticipants challengeId={challengeId} goal={commitment.goal} />

            {/* Participants card */}
            <Card>
              <div style={{ marginBottom: 'var(--space-5)' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
                  Participants
                </h2>
                {/* Fill bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                  <span>Filled</span>
                  <span>{challenge.participantCount.toString()} / {challenge.maxParticipants.toString()}</span>
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
                {participants.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                    Loading participants…
                  </p>
                ) : (
                  participants.map((p) => (
                    <ParticipantRow key={p.address} participant={p} />
                  ))
                )}
              </div>
            </Card>

            {/* Activity — real transactions confirmed in this session only */}
            <Card>
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                Activity
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 var(--space-4)' }}>
                Transactions confirmed from this app during the current session.
              </p>
              {sessionActivity.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                  No activity recorded in this session.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {[...sessionActivity].reverse().map((entry) => (
                    <div
                      key={entry.hash}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 'var(--space-3) var(--space-4)',
                        background: 'var(--surface-2)',
                        borderRadius: 'var(--radius)',
                        gap: 'var(--space-3)',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>{entry.action}</span>
                      <a
                        href={explorerTxUrl(entry.hash)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}
                      >
                        {shortAddress(entry.hash)} ↗
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Join tx state — real transaction hash & explorer link */}
            {tx.status !== 'idle' && (
              <TransactionState
                status={tx.status}
                title={
                  tx.status === 'success' ? 'You joined the commitment!' :
                  tx.status === 'error' ? 'Failed to join' :
                  'Joining commitment…'
                }
                description={txDescription}
                transactionHash={tx.hash}
                explorerUrl={tx.explorerUrl}
                onDismiss={() => tx.reset()}
                onRetry={tx.status === 'error' ? handleJoin : undefined}
              />
            )}

            {/* Resolve tx state — real transaction hash & explorer link */}
            {resolveTx.status !== 'idle' && (
              <TransactionState
                status={resolveTx.status}
                title={
                  resolveTx.status === 'success' ? 'Commitment resolved!' :
                  resolveTx.status === 'error' ? 'Failed to resolve' :
                  'Resolving commitment…'
                }
                description={
                  resolveTx.status === 'confirming' ? 'Confirm the transaction in your wallet.' :
                  resolveTx.status === 'pending' ? 'Transaction pending on Monad Testnet…' :
                  resolveTx.status === 'success' ? 'Results are now final on-chain.' :
                  resolveTx.status === 'error' ? resolveTx.error : undefined
                }
                transactionHash={resolveTx.hash}
                explorerUrl={resolveTx.explorerUrl}
                onDismiss={() => resolveTx.reset()}
                onRetry={resolveTx.status === 'error' ? handleResolve : undefined}
              />
            )}
          </div>

          {/* ── Right: your participation panel ── */}
          <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Card>
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 'var(--space-5)' }}>
                Your Participation
              </h3>

              {/* Connected wallet's role — derived from on-chain data */}
              {isConnected && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3) var(--space-4)',
                    background: 'var(--surface-2)',
                    borderRadius: 'var(--radius)',
                    marginBottom: 'var(--space-5)',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>
                    Your role
                  </span>
                  <Badge variant={isCreator ? 'accent' : isParticipant ? 'success' : 'default'}>
                    {isCreator ? 'Creator' : isParticipant ? 'Participant' : 'Not participating'}
                  </Badge>
                </div>
              )}

              {/* NOT JOINED */}
              {!isParticipant ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                    You haven't joined this commitment.
                  </p>
                  <ActionRow label="Stake required" value={`${formatMon(challenge.stakeAmount)} MON`} />
                  <ActionRow label="Spots left" value={isFull ? 'Full' : `${challenge.maxParticipants - challenge.participantCount}`} />
                  <Button
                    variant="primary"
                    fullWidth
                    disabled={joinDisabled}
                    onClick={handleJoin}
                  >
                    {!isConnected ? 'Connect wallet to join' :
                     isFull ? 'Full' :
                     isResolved ? 'Resolved' :
                     deadlinePassed ? 'Deadline passed' :
                     tx.status === 'confirming' ? 'Confirm in wallet…' :
                     tx.status === 'pending' ? 'Joining…' :
                     `Join · Stake ${formatMon(challenge.stakeAmount)} MON`}
                  </Button>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
                    Real on-chain transaction — the exact stake is sent with it
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {/* Joined indicator */}
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
                      Joined
                    </span>
                  </div>

                  {hasClaimed ? (
                    /* CLAIMED */
                    <>
                      <ActionRow label="Status" value="Reward claimed" />
                      <ActionRow label="Payout" value={`${formatMon(payout)} MON`} />
                    </>
                  ) : myResult === ParticipantResult.Pending ? (
                    /* JOINED / PENDING */
                    <>
                      <ActionRow label="Result" value="Pending" />
                      {!isResolved && (
                        isVerifier ? (
                          <Button
                            variant="secondary"
                            fullWidth
                            onClick={() => onNavigate('submit-result', commitment.id)}
                          >
                            Submit Result →
                          </Button>
                        ) : (
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                            Result submission is verifier-authorized by the deployed contract —
                            participants can't self-report. The verifier records your result
                            on-chain once your outcome is verified.
                          </p>
                        )
                      )}
                    </>
                  ) : myResult === ParticipantResult.Success ? (
                    /* JOINED / SUCCESS */
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Result:</span>
                        <Badge variant="success">Success</Badge>
                      </div>
                      {isResolved ? (
                        claimable ? (
                          <>
                            <ActionRow label="Claimable" value={`${formatMon(payout)} MON`} />
                            <Button
                              variant="primary"
                              fullWidth
                              onClick={() => onNavigate('claim', commitment.id)}
                            >
                              Claim Reward →
                            </Button>
                          </>
                        ) : (
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                            Reward already claimed.
                          </p>
                        )
                      ) : (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                          Rewards unlock once the commitment is resolved.
                        </p>
                      )}
                    </>
                  ) : (
                    /* JOINED / FAILURE */
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Result:</span>
                        <Badge variant="danger">Failed</Badge>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                        {successCount !== undefined && successCount === 0
                          ? 'No participants succeeded, so everyone can reclaim their stake.'
                          : 'Failed participants cannot claim when successful participants exist — your stake is shared with the winners.'}
                      </p>
                      {isResolved && claimable && (
                        <Button
                          variant="primary"
                          fullWidth
                          onClick={() => onNavigate('claim', commitment.id)}
                        >
                          Reclaim Stake →
                        </Button>
                      )}
                    </>
                  )}

                  {/* Creator finalize action — real resolveChallenge transaction */}
                  {isCreator && !isResolved && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-3)',
                        borderTop: '1px solid var(--border)',
                        paddingTop: 'var(--space-4)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: 'var(--text-muted)',
                        }}
                      >
                        Finalize
                      </div>
                      <Button
                        variant="primary"
                        fullWidth
                        disabled={
                          !canResolve ||
                          resolveTx.status === 'confirming' ||
                          resolveTx.status === 'pending'
                        }
                        onClick={handleResolve}
                      >
                        {resolveTx.status === 'confirming' ? 'Confirm in wallet…' :
                         resolveTx.status === 'pending' ? 'Resolving…' :
                         'Finalize · Resolve on-chain'}
                      </Button>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6, textAlign: 'center' }}>
                        {!resultsLoaded
                          ? 'Loading participant results…'
                          : challenge.participantCount < 2n
                          ? 'The contract requires at least 2 participants to resolve.'
                          : pendingCount > 0
                          ? `Waiting on results — ${pendingCount} participant${pendingCount === 1 ? '' : 's'} still pending (submitted by the verifier).`
                          : 'All results are in — the contract permits resolution.'}
                      </p>
                    </div>
                  )}

                  {isResolved && (
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={() => onNavigate('resolution', commitment.id)}
                    >
                      View Results →
                    </Button>
                  )}
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

/** Deployed frontend base URL used for shareable invite deep-links. */
const INVITE_BASE_URL = 'https://commit-monad.vercel.app/';

function InviteParticipants({ challengeId, goal }: { challengeId: bigint; goal: string }) {
  const inviteUrl = `${INVITE_BASE_URL}?challenge=${challengeId.toString()}`;
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>();

  async function copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setError(undefined);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy automatically — please copy the link above manually.');
    }
  }

  async function handleShare() {
    // Native share sheet when available; clipboard fallback everywhere else
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'Join my commitment on Commit',
          text: goal,
          url: inviteUrl,
        });
        return;
      } catch (e) {
        // User dismissed the share sheet — don't force a copy in that case
        if (e instanceof DOMException && e.name === 'AbortError') return;
      }
    }
    await copyLink();
  }

  return (
    <Card>
      <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
        Invite Participants
      </h2>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 var(--space-4)' }}>
        Share this link — anyone who opens it lands directly on this commitment.
      </p>

      {/* Invite link display */}
      <div
        style={{
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--surface-2)',
          borderRadius: 'var(--radius)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <code
          style={{
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            overflowWrap: 'anywhere',
          }}
        >
          {inviteUrl}
        </code>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <Button variant="secondary" onClick={() => void copyLink()}>
          {copied ? 'Copied ✓' : 'Copy Invite Link'}
        </Button>
        <Button variant="primary" onClick={() => void handleShare()}>
          Share
        </Button>
      </div>

      {error && (
        <p style={{ fontSize: '12px', color: 'var(--danger)', margin: 'var(--space-3) 0 0' }}>
          {error}
        </p>
      )}
    </Card>
  );
}

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
