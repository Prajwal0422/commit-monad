import { WalletInfo } from './WalletInfo';

export function Navbar() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid var(--border)',
        background: 'rgba(10, 10, 15, 0.85)',
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
        }}
      >
        {/* Wordmark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <span
            style={{
              fontSize: '18px',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: 'var(--text)',
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
        </div>

        {/* Nav links — shown on desktop */}
        <nav
          aria-label="Main navigation"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-6)',
          }}
        >
          <NavLink href="#commitments">Explore</NavLink>
          <NavLink href="#how-it-works">How it works</NavLink>
        </nav>

        {/* Wallet */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <WalletInfo />
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      style={{
        fontSize: '14px',
        fontWeight: 500,
        color: 'var(--text-secondary)',
        textDecoration: 'none',
        transition: 'color var(--transition)',
      }}
      onMouseEnter={(e) =>
        ((e.target as HTMLAnchorElement).style.color = 'var(--text)')
      }
      onMouseLeave={(e) =>
        ((e.target as HTMLAnchorElement).style.color = 'var(--text-secondary)')
      }
    >
      {children}
    </a>
  );
}
