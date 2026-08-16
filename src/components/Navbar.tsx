import React from 'react';
import { WalletInfo } from './WalletInfo';
import type { AppView } from '../App';

interface NavbarProps {
  onNavigate: (view: AppView) => void;
  currentView: AppView;
}

export function Navbar({ onNavigate, currentView }: NavbarProps) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid var(--border)',
        background: 'rgba(10, 10, 15, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
          gap: 'var(--space-4)',
        }}
      >
        {/* Wordmark — always goes home */}
        <button
          onClick={() => onNavigate('landing')}
          aria-label="COMMIT home"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: '18px',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: 'var(--text)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            COMMIT
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: 'var(--accent)',
              background: 'var(--accent-dim)',
              padding: '2px 6px',
              borderRadius: '4px',
              textTransform: 'uppercase',
            }}
          >
            Testnet
          </span>
        </button>

        {/* Nav links */}
        <nav
          aria-label="Main navigation"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
          }}
        >
          <NavButton
            active={currentView === 'explore'}
            onClick={() => onNavigate('explore')}
          >
            Explore
          </NavButton>
          <NavButton
            active={currentView === 'my'}
            onClick={() => onNavigate('my')}
          >
            My Commitments
          </NavButton>
          <NavButton
            active={currentView === 'landing'}
            onClick={() => onNavigate('landing')}
          >
            How it works
          </NavButton>
        </nav>

        {/* Wallet */}
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <WalletInfo />
        </div>
      </div>
    </header>
  );
}

function NavButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: '14px',
        fontWeight: 500,
        color: active ? 'var(--text)' : 'var(--text-secondary)',
        background: active ? 'var(--surface-2)' : 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '6px 12px',
        borderRadius: 'var(--radius-sm)',
        fontFamily: 'var(--font-sans)',
        transition: 'color var(--transition), background var(--transition)',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.color = 'var(--text)';
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.color = 'var(--text-secondary)';
      }}
    >
      {children}
    </button>
  );
}
