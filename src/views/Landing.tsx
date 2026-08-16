import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import type { AppView } from '../App';

// ─── Static demo data ─────────────────────────────────────────────────────────
// DEMO ONLY — not connected to blockchain. Replace with contract reads in Phase 2.
const DEMO_COMMITMENTS = [
  {
    id: 'demo-1',
    title: '7-Day Coding Challenge',
    description: 'Complete 3 LeetCode problems per day for 7 consecutive days.',
    pool: '24 MON',
    participants: 6,
    maxParticipants: 10,
    progress: 80,
    daysLeft: 2,
    status: 'active' as const,
    category: 'Productivity',
  },
  {
    id: 'demo-2',
    title: '30-Day Fitness Streak',
    description: 'Work out at least 30 minutes every day for a full month.',
    pool: '50 MON',
    participants: 12,
    maxParticipants: 20,
    progress: 45,
    daysLeft: 16,
    status: 'active' as const,
    category: 'Health',
  },
  {
    id: 'demo-3',
    title: 'Ship a Side Project',
    description: 'Launch a working product or feature by the end of the month.',
    pool: '10 MON',
    participants: 4,
    maxParticipants: 8,
    progress: 60,
    daysLeft: 9,
    status: 'active' as const,
    category: 'Build',
  },
] as const;

// ─── How It Works steps ───────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Create a Commitment',
    description: 'Define your goal, set a deadline, and choose a stake amount.',
  },
  {
    step: '02',
    title: 'Stake MON',
    description: 'Lock your funds in the smart contract. Skin in the game.',
  },
  {
    step: '03',
    title: 'Prove Yourself',
    description: 'Complete the goal and submit your result before time is up.',
  },
  {
    step: '04',
    title: 'Claim Your Reward',
    description: 'Winners split the pool. Quitters fund the winners.',
  },
] as const;

// ─── Landing view ─────────────────────────────────────────────────────────────
export function Landing({ onNavigate }: { onNavigate: (view: AppView) => void }) {
  return (
    <main>
      <HeroSection onNavigate={onNavigate} />
      <CommitmentsSection />
      <HowItWorksSection />
    </main>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection({ onNavigate }: { onNavigate: (view: AppView) => void }) {
  return (
    <section
      style={{
        padding: 'var(--space-20) 0 var(--space-16)',
        textAlign: 'center',
      }}
    >
      <div className="container">
        {/* Eyebrow */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            marginBottom: 'var(--space-6)',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--success)',
              boxShadow: '0 0 6px var(--success)',
            }}
          />
          <span
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              letterSpacing: '0.02em',
            }}
          >
            Live on Monad Testnet
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            maxWidth: '680px',
            margin: '0 auto var(--space-6)',
            fontWeight: 700,
          }}
        >
          Put your money behind your goals.
        </h1>

        {/* Supporting text */}
        <p
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            maxWidth: '520px',
            margin: '0 auto var(--space-10)',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
          }}
        >
          Commit to a goal. Stake your funds. Prove yourself. Earn your reward.
        </p>

        {/* CTAs */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-3)',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Button size="lg" variant="primary" onClick={() => onNavigate('create')}>
            Create a Commitment
          </Button>
          <Button size="lg" variant="secondary">
            Explore Commitments
          </Button>
        </div>

        {/* Stats bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'var(--space-10)',
            marginTop: 'var(--space-16)',
            flexWrap: 'wrap',
          }}
        >
          {[
            { label: 'Active Commitments', value: '3' },
            { label: 'Total Staked', value: '84 MON' },
            { label: 'Participants', value: '22' },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: 'var(--text)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  marginBottom: '6px',
                }}
              >
                {value}
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Active Commitments ───────────────────────────────────────────────────────
function CommitmentsSection() {
  return (
    <section
      id="commitments"
      style={{ padding: 'var(--space-16) 0' }}
    >
      <div className="container">
        {/* Section header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-8)',
            gap: 'var(--space-4)',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <Badge variant="accent" style={{ marginBottom: 'var(--space-3)' }}>
              Demo Data
            </Badge>
            <h2 style={{ margin: 0 }}>Active Commitments</h2>
            <p style={{ marginTop: '6px', fontSize: '14px' }}>
              These are static examples. Live data will be fetched from the contract.
            </p>
          </div>
          <Button variant="ghost" size="sm">
            View all →
          </Button>
        </div>

        {/* Cards grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--space-5)',
          }}
        >
          {DEMO_COMMITMENTS.map((commitment) => (
            <CommitmentCard key={commitment.id} commitment={commitment} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Commitment Card ──────────────────────────────────────────────────────────
type DemoCommitment = (typeof DEMO_COMMITMENTS)[number];

function CommitmentCard({ commitment }: { commitment: DemoCommitment }) {
  const spotsLeft = commitment.maxParticipants - commitment.participants;
  const fillRatio = commitment.participants / commitment.maxParticipants;

  return (
    <Card hoverable>
      {/* Card header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 'var(--space-4)',
          gap: 'var(--space-3)',
        }}
      >
        <Badge variant="default">{commitment.category}</Badge>
        <span
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap',
          }}
        >
          {commitment.daysLeft}d left
        </span>
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: '1rem',
          fontWeight: 600,
          marginBottom: 'var(--space-2)',
          color: 'var(--text)',
        }}
      >
        {commitment.title}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: '13px',
          lineHeight: 1.6,
          marginBottom: 'var(--space-5)',
          color: 'var(--text-secondary)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {commitment.description}
      </p>

      {/* Progress bar */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginBottom: 'var(--space-2)',
          }}
        >
          <span>Progress</span>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
            {commitment.progress}%
          </span>
        </div>
        <div
          style={{
            height: '4px',
            background: 'var(--border)',
            borderRadius: '99px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${commitment.progress}%`,
              background: commitment.progress >= 75
                ? 'var(--success)'
                : 'var(--accent)',
              borderRadius: '99px',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-4)',
          paddingTop: 'var(--space-4)',
          borderTop: '1px solid var(--border)',
        }}
      >
        <Stat label="Pool" value={commitment.pool} highlight />
        <Stat
          label="Participants"
          value={`${commitment.participants}/${commitment.maxParticipants}`}
        />
        <Stat
          label="Spots"
          value={spotsLeft > 0 ? `${spotsLeft} open` : 'Full'}
          muted={spotsLeft === 0}
        />
      </div>

      {/* Participant fill indicator */}
      <div style={{ marginTop: 'var(--space-3)' }}>
        <div
          style={{
            height: '2px',
            background: 'var(--border)',
            borderRadius: '99px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${fillRatio * 100}%`,
              background: 'var(--accent-dim)',
              borderRadius: '99px',
            }}
          />
        </div>
      </div>
    </Card>
  );
}

function Stat({
  label,
  value,
  highlight = false,
  muted = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div style={{ flex: 1 }}>
      <div
        style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          marginBottom: '3px',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: highlight
            ? 'var(--accent)'
            : muted
            ? 'var(--text-muted)'
            : 'var(--text)',
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      style={{
        padding: 'var(--space-16) 0 var(--space-20)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
          <h2 style={{ margin: '0 auto var(--space-3)' }}>How it works</h2>
          <p style={{ fontSize: '15px', maxWidth: '400px', margin: '0 auto' }}>
            A four-step loop that turns intentions into results.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--space-5)',
          }}
        >
          {HOW_IT_WORKS.map(({ step, title, description }) => (
            <Card key={step} padding="var(--space-6)">
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: 'var(--accent)',
                  marginBottom: 'var(--space-3)',
                }}
              >
                {step}
              </div>
              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  marginBottom: 'var(--space-2)',
                  color: 'var(--text)',
                }}
              >
                {title}
              </h3>
              <p style={{ fontSize: '13px', lineHeight: 1.65 }}>{description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
