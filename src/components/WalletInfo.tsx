import { useAccount, useBalance } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

// Shorten a checksummed address: 0x1234…5678
function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

// Format a balance value to 3 decimal places, stripping trailing zeros
function formatBalance(value: bigint, decimals: number): string {
  const divisor = 10n ** BigInt(decimals);
  const whole = value / divisor;
  const remainder = value % divisor;
  const fraction = remainder
    .toString()
    .padStart(decimals, '0')
    .slice(0, 3);
  const trimmed = fraction.replace(/0+$/, '') || '0';
  return `${whole}.${trimmed}`;
}

export function WalletInfo() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();

  const {
    data: balanceData,
    isLoading: balanceLoading,
    isError: balanceError,
  } = useBalance({
    address,
    query: {
      enabled: isConnected && !!address,
      // Refresh every 15 seconds while connected
      refetchInterval: 15_000,
    },
  });

  const isPending = isConnecting || isReconnecting;

  // ── Disconnected ────────────────────────────────────────────────────────────
  if (!isConnected && !isPending) {
    return (
      <ConnectButton.Custom>
        {({ openConnectModal }) => (
          <button
            onClick={openConnectModal}
            aria-label="Connect wallet"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              height: '38px',
              padding: '0 16px',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              color: '#fff',
              background: 'var(--accent)',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              transition: 'background var(--transition), opacity var(--transition)',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                'var(--accent-hover)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                'var(--accent)')
            }
          >
            Connect Wallet
          </button>
        )}
      </ConnectButton.Custom>
    );
  }

  // ── Reconnecting / connecting ────────────────────────────────────────────────
  if (isPending) {
    return (
      <div style={pillStyle}>
        <PulsingDot />
        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Connecting…
        </span>
      </div>
    );
  }

  // ── Connected ────────────────────────────────────────────────────────────────
  return (
    <ConnectButton.Custom>
      {({ openAccountModal }) => (
        <button
          onClick={openAccountModal}
          aria-label="Wallet account details"
          style={{
            ...pillStyle,
            cursor: 'pointer',
            background: 'var(--surface)',
            border: '1px solid var(--border-hover)',
            borderRadius: 'var(--radius)',
            padding: '0 14px',
            height: '38px',
            transition: 'border-color var(--transition)',
            fontFamily: 'var(--font-sans)',
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.borderColor =
              'var(--accent)')
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.borderColor =
              'var(--border-hover)')
          }
        >
          {/* Balance section */}
          <BalanceDisplay
            loading={balanceLoading}
            error={balanceError}
            value={balanceData?.value}
            decimals={balanceData?.decimals ?? 18}
            symbol={balanceData?.symbol ?? 'MON'}
          />

          {/* Divider */}
          <div
            aria-hidden="true"
            style={{
              width: '1px',
              height: '16px',
              background: 'var(--border)',
              margin: '0 10px',
            }}
          />

          {/* Address */}
          <span
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {address ? shortenAddress(address) : '—'}
          </span>

          {/* Connected indicator */}
          <span
            aria-label="Connected"
            style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--success)',
              marginLeft: '8px',
              flexShrink: 0,
            }}
          />
        </button>
      )}
    </ConnectButton.Custom>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BalanceDisplay({
  loading,
  error,
  value,
  decimals,
  symbol,
}: {
  loading: boolean;
  error: boolean;
  value?: bigint;
  decimals: number;
  symbol: string;
}) {
  if (loading) {
    return (
      <span
        aria-label="Loading balance"
        style={{
          display: 'inline-block',
          width: '60px',
          height: '10px',
          borderRadius: '4px',
          background: 'var(--border-hover)',
          animation: 'pulse 1.4s ease-in-out infinite',
        }}
      />
    );
  }

  if (error || value === undefined) {
    return (
      <span
        title="Balance unavailable"
        style={{ fontSize: '13px', color: 'var(--text-muted)' }}
      >
        — {symbol}
      </span>
    );
  }

  return (
    <span
      style={{
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--text)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {formatBalance(value, decimals)}{' '}
      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
        {symbol}
      </span>
    </span>
  );
}

function PulsingDot() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: 'var(--accent)',
        animation: 'pulse 1.4s ease-in-out infinite',
        flexShrink: 0,
      }}
    />
  );
}

// Shared base style for the pill container (used as a reference shape)
const pillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  background: 'transparent',
  border: 'none',
  padding: 0,
};
