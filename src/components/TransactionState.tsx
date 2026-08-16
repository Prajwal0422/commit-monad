import React from 'react';
import { Badge } from './Badge';
import { Button } from './Button';

export type TxStatus = 'idle' | 'preparing' | 'confirming' | 'pending' | 'success' | 'error';

interface TransactionStateProps {
  status: TxStatus;
  title?: string;
  description?: string;
  // Will be wired to a real tx hash when contract integration lands
  transactionHash?: string;
  explorerUrl?: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  isMock?: boolean;   // shows "Demo Mode" label — remove when contract is live
}

const STATUS_CONFIG: Record<TxStatus, { label: string; icon: string; color: string }> = {
  idle:       { label: 'Ready',       icon: '○',  color: 'var(--text-muted)' },
  preparing:  { label: 'Preparing',   icon: '◌',  color: 'var(--accent)' },
  confirming: { label: 'Confirming',  icon: '◌',  color: 'var(--accent)' },
  pending:    { label: 'Pending',     icon: '◌',  color: 'var(--warning)' },
  success:    { label: 'Confirmed',   icon: '✓',  color: 'var(--success)' },
  error:      { label: 'Failed',      icon: '✕',  color: 'var(--danger)' },
};

export function TransactionState({
  status,
  title,
  description,
  transactionHash,
  explorerUrl,
  onDismiss,
  onRetry,
  isMock = false,
}: TransactionStateProps) {
  if (status === 'idle') return null;

  const cfg = STATUS_CONFIG[status];
  const isSpinning = status === 'preparing' || status === 'confirming' || status === 'pending';

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-4)',
        padding: 'var(--space-8)',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          border: `2px solid ${cfg.color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          color: cfg.color,
          animation: isSpinning ? 'pulse 1.2s ease-in-out infinite' : 'none',
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        {cfg.icon}
      </div>

      {/* Status badge */}
      <Badge
        variant={
          status === 'success' ? 'success'
          : status === 'error' ? 'danger'
          : status === 'pending' ? 'warning'
          : 'accent'
        }
      >
        {cfg.label}
      </Badge>

      {/* Title */}
      {title && (
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
          {title}
        </h3>
      )}

      {/* Description */}
      {description && (
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '320px' }}>
          {description}
        </p>
      )}

      {/* Mock disclaimer */}
      {isMock && (
        <div
          style={{
            padding: '6px 12px',
            background: 'var(--warning-dim)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--warning)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          Demo Mode — No real transaction
        </div>
      )}

      {/* Transaction hash — shown when real hash is available */}
      {transactionHash && (
        <div
          style={{
            padding: '8px 14px',
            background: 'var(--surface-2)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            wordBreak: 'break-all',
          }}
        >
          {explorerUrl ? (
            <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
              {transactionHash}
            </a>
          ) : (
            transactionHash
          )}
        </div>
      )}

      {/* Actions */}
      {(onDismiss || onRetry) && (
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
          {onRetry && status === 'error' && (
            <Button variant="primary" size="sm" onClick={onRetry}>
              Try again
            </Button>
          )}
          {onDismiss && (
            <Button variant="secondary" size="sm" onClick={onDismiss}>
              {status === 'success' ? 'Done' : 'Dismiss'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
