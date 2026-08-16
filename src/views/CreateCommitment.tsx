import React, { useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { FormField, inputStyle, inputErrorStyle, inputFocusStyle } from '../components/FormField';
import { TransactionState } from '../components/TransactionState';
import { formatChallengeId, daysToDeadline, monToWei } from '../utils/contract';
import {
  useCommitPoolTransaction,
  getCreatedChallengeId,
  formatTxError,
} from '../hooks/useCommitPool';
import type { AppView } from '../App';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormState {
  goal: string;
  stake: string;
  duration: string;
  maxParticipants: string;
}

interface FormErrors {
  goal?: string;
  stake?: string;
  duration?: string;
  maxParticipants?: string;
}

const DURATION_OPTIONS = [
  { value: '1',  label: '24 hours' },
  { value: '3',  label: '3 days' },
  { value: '7',  label: '7 days' },
  { value: '30', label: '30 days' },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatMon(value: bigint, decimals: number, precision = 4): string {
  const divisor = 10n ** BigInt(decimals);
  const whole = value / divisor;
  const remainder = value % divisor;
  const frac = remainder.toString().padStart(decimals, '0').slice(0, precision);
  return `${whole}.${frac}`;
}

function validate(form: FormState, maxBalance: number): FormErrors {
  const errors: FormErrors = {};

  if (!form.goal.trim()) {
    errors.goal = 'Please describe your goal.';
  } else if (form.goal.trim().length < 5) {
    errors.goal = 'Goal must be at least 5 characters.';
  }

  const stakeNum = parseFloat(form.stake);
  if (!form.stake || isNaN(stakeNum)) {
    errors.stake = 'Enter a stake amount.';
  } else if (stakeNum <= 0) {
    errors.stake = 'Stake must be greater than 0.';
  } else if (stakeNum > maxBalance) {
    errors.stake = `Insufficient balance. You have ${maxBalance.toFixed(4)} MON.`;
  }

  if (!form.duration) {
    errors.duration = 'Select a duration.';
  }

  const maxP = parseInt(form.maxParticipants, 10);
  if (!form.maxParticipants || isNaN(maxP)) {
    errors.maxParticipants = 'Enter max participants.';
  } else if (maxP < 2) {
    errors.maxParticipants = 'Minimum 2 participants.';
  } else if (maxP > 20) {
    errors.maxParticipants = 'Maximum 20 participants.';
  }

  return errors;
}

// ─── Create Commitment view ───────────────────────────────────────────────────
export function CreateCommitment({
  onBack,
  onNavigate,
}: {
  onBack: () => void;
  onNavigate: (view: AppView, commitmentId?: string) => void;
}) {
  const { address, isConnected } = useAccount();
  const { data: balanceData, isLoading: balanceLoading } = useBalance({
    address,
    query: { enabled: isConnected && !!address },
  });

  const [form, setForm] = useState<FormState>({
    goal: '',
    stake: '',
    duration: '7',
    maxParticipants: '10',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  // Numeric balance for validation
  const availableBalance = balanceData
    ? parseFloat(formatMon(balanceData.value, balanceData.decimals))
    : 0;

  // Live preview values
  const stakeNum = parseFloat(form.stake) || 0;
  const maxPNum = parseInt(form.maxParticipants, 10) || 0;
  const maxPool = stakeNum > 0 && maxPNum > 0 ? stakeNum * maxPNum : 0;
  const selectedDurationLabel =
    DURATION_OPTIONS.find((d) => d.value === form.duration)?.label ?? '—';

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function handleChange(field: keyof FormState, value: string) {
    const next = { ...form, [field]: value };
    setForm(next);
    // Re-validate touched fields live
    if (touched[field]) {
      setErrors(validate(next, availableBalance));
    }
  }

  function handleBlur(field: keyof FormState) {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validate(form, availableBalance));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Mark all fields touched so errors show
    setTouched({ goal: true, stake: true, duration: true, maxParticipants: true });
    const errs = validate(form, availableBalance);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setSubmitted(true);
    }
  }

  function handleReset() {
    setSubmitted(false);
    setTouched({});
    setErrors({});
  }

  const hasErrors = Object.keys(errors).length > 0;
  const stakeExceedsBalance =
    parseFloat(form.stake) > availableBalance && availableBalance > 0;

  // ── Submitted / ready state ───────────────────────────────────────────────────
  if (submitted) {
    return (
      <ReadyState
        form={form}
        maxPool={maxPool}
        durationLabel={selectedDurationLabel}
        onBack={onBack}
        onReset={handleReset}
        onNavigate={onNavigate}
      />
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <main style={{ padding: 'var(--space-10) 0 var(--space-20)' }}>
      <div className="container">

        {/* Back */}
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0',
            marginBottom: 'var(--space-8)',
            fontFamily: 'var(--font-sans)',
            transition: 'color var(--transition)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          aria-label="Go back to home"
        >
          ← Back
        </button>

        {/* Page header */}
        <div style={{ marginBottom: 'var(--space-10)' }}>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: 'var(--space-2)' }}>
            Create a commitment
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
            Put something real behind your goal.
          </p>
        </div>

        {/* Wallet required warning */}
        {!isConnected && (
          <Card style={{ marginBottom: 'var(--space-8)', borderColor: 'var(--warning)' }}>
            <p style={{ fontSize: '14px', color: 'var(--warning)', margin: 0 }}>
              Connect your wallet to create a commitment.
            </p>
          </Card>
        )}

        {/* Two-column layout on desktop */}
        <form
          onSubmit={handleSubmit}
          noValidate
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 320px',
            gap: 'var(--space-8)',
            alignItems: 'start',
          }}
          className="create-form-grid"
        >
          {/* ── Left column: fields ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

                {/* Goal */}
                <FormField
                  id="goal"
                  label="Your Goal"
                  hint="Be specific — you'll need to prove this later."
                  error={touched.goal ? errors.goal : undefined}
                >
                  <FocusInput
                    id="goal"
                    type="text"
                    placeholder="What do you want to achieve?"
                    value={form.goal}
                    maxLength={120}
                    hasError={!!(touched.goal && errors.goal)}
                    onChange={(v) => handleChange('goal', v)}
                    onBlur={() => handleBlur('goal')}
                    aria-describedby="goal-hint"
                  />
                </FormField>

                {/* Stake */}
                <FormField
                  id="stake"
                  label="Stake"
                  hint={
                    isConnected
                      ? balanceLoading
                        ? 'Loading balance…'
                        : `Available: ${formatMon(balanceData?.value ?? 0n, balanceData?.decimals ?? 18, 4)} MON`
                      : 'Connect wallet to see your balance.'
                  }
                  error={touched.stake ? errors.stake : undefined}
                >
                  <div style={{ position: 'relative' }}>
                    <FocusInput
                      id="stake"
                      type="number"
                      placeholder="0.00"
                      value={form.stake}
                      min="0"
                      step="0.01"
                      hasError={!!(touched.stake && errors.stake) || stakeExceedsBalance}
                      onChange={(v) => handleChange('stake', v)}
                      onBlur={() => handleBlur('stake')}
                      style={{ paddingRight: '52px' }}
                    />
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        right: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        pointerEvents: 'none',
                      }}
                    >
                      MON
                    </span>
                  </div>
                </FormField>

                {/* Duration */}
                <FormField
                  id="duration"
                  label="Duration"
                  error={touched.duration ? errors.duration : undefined}
                >
                  <FocusSelect
                    id="duration"
                    value={form.duration}
                    hasError={!!(touched.duration && errors.duration)}
                    onChange={(v) => handleChange('duration', v)}
                    onBlur={() => handleBlur('duration')}
                  >
                    {DURATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </FocusSelect>
                </FormField>

                {/* Max participants */}
                <FormField
                  id="maxParticipants"
                  label="Max Participants"
                  hint="Between 2 and 20."
                  error={touched.maxParticipants ? errors.maxParticipants : undefined}
                >
                  <FocusInput
                    id="maxParticipants"
                    type="number"
                    placeholder="10"
                    value={form.maxParticipants}
                    min="2"
                    max="20"
                    step="1"
                    hasError={!!(touched.maxParticipants && errors.maxParticipants)}
                    onChange={(v) => handleChange('maxParticipants', v)}
                    onBlur={() => handleBlur('maxParticipants')}
                  />
                </FormField>

              </div>
            </Card>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              fullWidth
              disabled={!isConnected || (Object.keys(touched).length > 0 && hasErrors)}
            >
              Create Commitment →
            </Button>

            {!isConnected && (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
                Connect your wallet to continue.
              </p>
            )}
          </div>

          {/* ── Right column: preview ── */}
          <CommitmentPreview
            stake={stakeNum}
            maxPool={maxPool}
            durationLabel={selectedDurationLabel}
            maxParticipants={maxPNum}
          />
        </form>
      </div>
    </main>
  );
}

// ─── Commitment Preview ───────────────────────────────────────────────────────
function CommitmentPreview({
  stake,
  maxPool,
  durationLabel,
  maxParticipants,
}: {
  stake: number;
  maxPool: number;
  durationLabel: string;
  maxParticipants: number;
}) {
  return (
    <div style={{ position: 'sticky', top: '80px' }}>
      <Card>
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <Badge variant="default" style={{ marginBottom: 'var(--space-3)' }}>
            Preview
          </Badge>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
            Commitment Summary
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Updates as you fill in the form.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0',
            borderTop: '1px solid var(--border)',
          }}
        >
          <PreviewRow
            label="Your Stake"
            value={stake > 0 ? `${stake.toFixed(4)} MON` : '—'}
            highlight={stake > 0}
          />
          <PreviewRow
            label="Max Pool"
            value={maxPool > 0 ? `${maxPool.toFixed(4)} MON` : '—'}
            hint="stake × max participants"
            highlight={maxPool > 0}
          />
          <PreviewRow
            label="Duration"
            value={durationLabel}
          />
          <PreviewRow
            label="Max Participants"
            value={maxParticipants >= 2 ? String(maxParticipants) : '—'}
          />
          <PreviewRow
            label="Network"
            value="Monad Testnet"
            last
          />
        </div>

        {/* No contract disclaimer */}
        <div
          style={{
            marginTop: 'var(--space-5)',
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--accent-dim)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <p style={{ fontSize: '12px', color: 'var(--accent)', margin: 0, lineHeight: 1.5 }}>
            This commitment will be submitted to a Monad smart contract. No funds
            are moved until you confirm on-chain.
          </p>
        </div>
      </Card>
    </div>
  );
}

function PreviewRow({
  label,
  value,
  hint,
  highlight = false,
  last = false,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 'var(--space-4)',
        padding: 'var(--space-4) 0',
        borderBottom: last ? 'none' : '1px solid var(--border)',
      }}
    >
      <div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</div>
        {hint && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {hint}
          </div>
        )}
      </div>
      <div
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: highlight ? 'var(--accent)' : 'var(--text)',
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ─── Ready / submit-to-chain state ───────────────────────────────────────────
function ReadyState({
  form,
  maxPool,
  durationLabel,
  onBack,
  onReset,
  onNavigate,
}: {
  form: FormState;
  maxPool: number;
  durationLabel: string;
  onBack: () => void;
  onReset: () => void;
  onNavigate: (view: AppView, commitmentId?: string) => void;
}) {
  const tx = useCommitPoolTransaction();

  // Decode the new challenge ID from the receipt's ChallengeCreated event
  const createdId = getCreatedChallengeId(tx.receipt);

  function handleSubmitToChain() {
    try {
      const stakeWei = monToWei(form.stake);
      const deadline = daysToDeadline(parseInt(form.duration, 10));
      const maxParticipants = BigInt(parseInt(form.maxParticipants, 10));
      // msg.value MUST equal stakeAmount exactly
      void tx.send({
        functionName: 'createChallenge',
        args: [form.goal.trim(), stakeWei, deadline, maxParticipants],
        value: stakeWei,
      });
    } catch (e) {
      // monToWei throws on malformed input — validation should prevent this
      console.error('Failed to prepare createChallenge:', formatTxError(e));
    }
  }

  const txDescription =
    tx.status === 'confirming' ? 'Confirm the transaction in your wallet.' :
    tx.status === 'pending' ? 'Waiting for Monad Testnet to confirm your transaction…' :
    tx.status === 'success' ? 'Your commitment is live on Monad Testnet.' :
    tx.status === 'error' ? tx.error : undefined;

  return (
    <main style={{ padding: 'var(--space-10) 0 var(--space-20)' }}>
      <div className="container" style={{ maxWidth: '560px' }}>

        <button
          onClick={() => { tx.reset(); onReset(); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0',
            marginBottom: 'var(--space-8)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          ← Edit commitment
        </button>

        <Card>
          {/* Status icon */}
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'var(--accent-dim)',
              border: '1px solid var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-5)',
              fontSize: '20px',
            }}
            aria-hidden="true"
          >
            ✓
          </div>

          <Badge variant="accent" style={{ marginBottom: 'var(--space-4)' }}>
            Ready to submit
          </Badge>

          <h2 style={{ fontSize: '1.4rem', marginBottom: 'var(--space-2)' }}>
            Ready to submit to Monad
          </h2>
          <p style={{ fontSize: '14px', marginBottom: 'var(--space-6)' }}>
            Your commitment has been validated. Confirm the transaction below to
            create it on the CommitPool contract — your stake is sent along
            with the transaction.
          </p>

          {/* Summary */}
          <div
            style={{
              background: 'var(--surface-2)',
              borderRadius: 'var(--radius)',
              padding: 'var(--space-5)',
              marginBottom: 'var(--space-6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <SummaryRow label="Goal" value={form.goal} />
            <SummaryRow label="Stake" value={`${parseFloat(form.stake).toFixed(4)} MON`} />
            <SummaryRow label="Max Pool" value={`${maxPool.toFixed(4)} MON`} />
            <SummaryRow label="Duration" value={durationLabel} />
            <SummaryRow label="Max Participants" value={form.maxParticipants} />
            <SummaryRow label="Network" value="Monad Testnet" />
          </div>

          {/* Real transaction lifecycle */}
          {tx.status !== 'idle' && (
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <TransactionState
                status={tx.status}
                title={
                  tx.status === 'success' ? 'Commitment created on-chain' :
                  tx.status === 'error' ? 'Transaction failed' :
                  'Creating commitment…'
                }
                description={txDescription}
                transactionHash={tx.hash}
                explorerUrl={tx.explorerUrl}
                onRetry={tx.status === 'error' ? handleSubmitToChain : undefined}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            {tx.status === 'success' ? (
              <>
                {createdId !== undefined && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => onNavigate('details', createdId.toString())}
                  >
                    View commitment {formatChallengeId(createdId)} →
                  </Button>
                )}
                <Button variant="secondary" size="md" onClick={() => onNavigate('explore')}>
                  Explore commitments
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="primary"
                  size="md"
                  disabled={tx.status === 'confirming' || tx.status === 'pending'}
                  onClick={handleSubmitToChain}
                >
                  {tx.status === 'confirming' ? 'Confirm in wallet…' :
                   tx.status === 'pending' ? 'Waiting for confirmation…' :
                   'Submit to Monad'}
                </Button>
                <Button variant="secondary" size="md" onClick={onBack}>
                  Back to Home
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', textAlign: 'right' }}>
        {value}
      </span>
    </div>
  );
}

// ─── Focus-managed input ──────────────────────────────────────────────────────
// Handles focus border color without inline onFocus/onBlur style thrash
function FocusInput({
  id,
  hasError,
  onChange,
  onBlur,
  style: extraStyle,
  ...rest
}: {
  id: string;
  hasError: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
  style?: React.CSSProperties;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onBlur' | 'style'>) {
  const [focused, setFocused] = React.useState(false);

  return (
    <input
      id={id}
      {...rest}
      style={{
        ...inputStyle,
        ...(hasError ? inputErrorStyle : {}),
        ...(focused && !hasError ? inputFocusStyle : {}),
        ...extraStyle,
      }}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        onBlur?.();
      }}
    />
  );
}

function FocusSelect({
  id,
  value,
  hasError,
  onChange,
  onBlur,
  children,
}: {
  id: string;
  value: string;
  hasError: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
  children: React.ReactNode;
}) {
  const [focused, setFocused] = React.useState(false);

  return (
    <select
      id={id}
      value={value}
      style={{
        ...inputStyle,
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238888a0' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 14px center',
        paddingRight: '36px',
        cursor: 'pointer',
        ...(hasError ? inputErrorStyle : {}),
        ...(focused && !hasError ? inputFocusStyle : {}),
      }}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        onBlur?.();
      }}
    >
      {children}
    </select>
  );
}
