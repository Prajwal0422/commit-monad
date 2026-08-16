import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { useAllChallenges, type ChallengeWithId } from '../hooks/useCommitPool';
import { formatTimeRemaining } from '../utils/challenge';
import { formatMon, deadlineToDate } from '../utils/contract';
import type { AppView } from '../App';

// ─── Static demo data ─────────────────────────────────────────────────────────
// DEMO ONLY — shown as a clearly-labelled fallback when the deployed contract
// has no challenges yet. Never presented as live data.
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
export function Landing({
  onNavigate,
}: {
  onNavigate: (view: AppView, commitmentId?: string) => void;
}) {
  return (
    <main>
      <HeroSection onNavigate={onNavigate} />
      <CommitmentsSection onNavigate={onNavigate} />
      <HowItWorksSection />
      <FutureIntegrationSection />
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
            fontSize: 'clamp(1rem, 2vw, 1.15rem)',
            maxWidth: '540px',
            margin: '0 auto var(--space-10)',
            color: 'var(--text-secondary)',
            lineHeight: 1.75,
          }}
        >
          Commit to a goal. Stake MON. Prove you did it.{' '}
          Winners reclaim their stake and share the pool of those who didn't.
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
          <Button size="lg" variant="secondary" onClick={() => onNavigate('explore')}>
            Explore Commitments
          </Button>
        </div>

        {/* Stats bar — derived from live contract reads */}
        <StatsBar />
      </div>
    </section>
  );
}

function StatsBar() {
  const { data: challenges } = useAllChallenges();

  const total = challenges?.length ?? 0;
  const activeCount = (challenges ?? []).filter(
    (c) => c.status === 0 && deadlineToDate(c.deadline).getTime() > Date.now(),
  ).length;
  const totalStakedWei = (challenges ?? []).reduce(
    (acc, c) => acc + c.totalPool,
    0n,
  );

  const stats = [
    { label: 'Commitments on-chain', value: String(total) },
    { label: 'Active', value: String(activeCount) },
    { label: 'Total Staked', value: `${formatMon(totalStakedWei, 2)} MON` },
  ];

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 'var(--space-10)',
        marginTop: 'var(--space-16)',
        flexWrap: 'wrap',
      }}
    >
      {stats.map(({ label, value }) => (
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
  );
}

// ─── Latest Commitments ────────────────────────────────────────────────────────
function CommitmentsSection({
  onNavigate,
}: {
  onNavigate: (view: AppView, commitmentId?: string) => void;
}) {
  // Live data from the CommitPool contract; static demo cards shown only when
  // the contract has no challenges yet (clearly labelled).
  const { data: challenges, isLoading } = useAllChallenges();
  const liveChallenges = (challenges ?? []).slice(-3).reverse();
  const showDemoFallback = !isLoading && liveChallenges.length === 0;

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
            <Badge variant={showDemoFallback ? 'warning' : 'success'} style={{ marginBottom: 'var(--space-3)' }}>
              {showDemoFallback ? 'Demo Data' : 'Live · On-chain'}
            </Badge>
            <h2 style={{ margin: 0 }}>Latest Commitments</h2>
            <p style={{ marginTop: '6px', fontSize: '14px' }}>
              {showDemoFallback
                ? 'No challenges on the contract yet — these are static examples.'
                : 'Recently created on the CommitPool contract.'}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('explore')}>
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
          {isLoading ? (
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>◌ Loading from chain…</p>
          ) : showDemoFallback ? (
            DEMO_COMMITMENTS.map((commitment) => (
              <CommitmentCard key={commitment.id} commitment={commitment} />
            ))
          ) : (
            liveChallenges.map((challenge) => (
              <LiveCommitmentCard
                key={challenge.id.toString()}
                challenge={challenge}
                onView={(id) => onNavigate('details', id)}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Live commitment card (on-chain data, same visual design) ───────────────────
function LiveCommitmentCard({
  challenge,
  onView,
}: {
  challenge: ChallengeWithId;
  onView: (id: string) => void;
}) {
  const participantCount = Number(challenge.participantCount);
  const maxParticipants = Number(challenge.maxParticipants);
  const spotsLeft = maxParticipants - participantCount;
  const fillRatio = maxParticipants > 0 ? participantCount / maxParticipants : 0;

  return (
    <Card hoverable onClick={() => onView(challenge.id.toString())}>
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
        <Badge variant="default">#{challenge.id.toString()}</Badge>
        <span
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap',
          }}
        >
          {formatTimeRemaining(deadlineToDate(challenge.deadline))}
        </span>
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: '1rem',
          fontWeight: 600,
          marginBottom: 'var(--space-5)',
          color: 'var(--text)',
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {challenge.goal}
      </h3>

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
          <span>Participants</span>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
            {participantCount}/{maxParticipants}
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
              width: `${fillRatio * 100}%`,
              background: fillRatio >= 0.75 ? 'var(--success)' : 'var(--accent)',
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
        <Stat label="Stake" value={`${formatMon(challenge.stakeAmount)} MON`} highlight />
        <Stat label="Pool" value={`${formatMon(challenge.totalPool)} MON`} />
        <Stat
          label="Spots"
          value={spotsLeft > 0 ? `${spotsLeft} open` : 'Full'}
          muted={spotsLeft === 0}
        />
      </div>
    </Card>
  );
}

// ─── Demo commitment card (fallback only — clearly labelled as Demo Data) ──────────────────────────────────────────────────────────
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

// ─── Future Integration — wearable / real-world verification roadmap ──────────
// Static roadmap content only. No wearable APIs, no device state, and nothing
// here implies the current application is connected to any platform.

const FUTURE_FEATURES = [
  {
    title: 'Wearable Data',
    description:
      'Connect supported wearable and activity platforms to measure real-world progress such as steps, workouts, active minutes, or other commitment-specific metrics.',
  },
  {
    title: 'Automatic Verification',
    description:
      'Future verification services can evaluate activity data against commitment rules and submit verified outcomes on-chain.',
  },
  {
    title: 'Privacy-First Proofs',
    description:
      'Only the information required to prove completion should be exposed. Personal activity data should remain private while the commitment receives a verifiable result.',
  },
] as const;

const PLANNED_INTEGRATIONS = [
  'Apple Watch',
  'Garmin',
  'Fitbit',
  'Other compatible wearable/activity sources',
] as const;

const ROADMAP_TIMELINE = [
  { phase: 'Today', title: 'Wallet commitment', current: true },
  { phase: 'Next', title: 'Trusted activity data', current: false },
  { phase: 'Future', title: 'Automated verification', current: false },
] as const;

function FutureIntegrationSection() {
  return (
    <section
      id="future-integration"
      style={{
        padding: 'var(--space-16) 0 var(--space-20)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="container">
        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
          <Badge variant="default" style={{ marginBottom: 'var(--space-3)' }}>
            Roadmap
          </Badge>
          <h2 style={{ margin: '0 auto var(--space-3)' }}>Proof beyond the wallet</h2>
          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.7,
              maxWidth: '560px',
              margin: '0 auto',
              color: 'var(--text-secondary)',
            }}
          >
            Commit can eventually connect to trusted real-world activity sources, allowing
            commitments to be verified from actual progress instead of manual reporting.
          </p>
        </div>

        {/* Feature cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--space-5)',
            marginBottom: 'var(--space-5)',
          }}
        >
          {FUTURE_FEATURES.map(({ title, description }, index) => (
            <Card key={title} padding="var(--space-6)">
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: 'var(--text-muted)',
                  marginBottom: 'var(--space-3)',
                  textTransform: 'uppercase',
                }}
              >
                Planned · {String(index + 1).padStart(2, '0')}
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
              <p style={{ fontSize: '13px', lineHeight: 1.65, margin: 0 }}>{description}</p>
            </Card>
          ))}
        </div>

        {/* Roadmap card + timeline */}
        <div
          className="roadmap-grid"
          style={{
            display: 'grid',
            gap: 'var(--space-5)',
            alignItems: 'stretch',
          }}
        >
          {/* Wearable verification roadmap card */}
          <Card padding="var(--space-8)">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                flexWrap: 'wrap',
                marginBottom: 'var(--space-5)',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.06em', margin: 0 }}>
                WEARABLE VERIFICATION
              </h3>
              <Badge variant="warning">Coming in a future version</Badge>
            </div>
            <p
              style={{
                fontSize: '13px',
                lineHeight: 1.65,
                color: 'var(--text-secondary)',
                margin: '0 0 var(--space-6)',
              }}
            >
              Conceptual integrations we're exploring. These platforms are not connected to
              Commit today — no wearable data is read or displayed.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {PLANNED_INTEGRATIONS.map((name) => (
                <span
                  key={name}
                  style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: '99px',
                    padding: '6px 12px',
                  }}
                >
                  {name}
                </span>
              ))}
            </div>
          </Card>

          {/* Timeline */}
          <Card padding="var(--space-8)">
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: 'var(--space-6)',
              }}
            >
              Roadmap
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {ROADMAP_TIMELINE.map(({ phase, title, current }, index) => (
                <div key={phase} style={{ display: 'flex', gap: 'var(--space-4)' }}>
                  {/* Node + connector */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        marginTop: '4px',
                        background: current ? 'var(--success)' : 'var(--border)',
                        boxShadow: current ? '0 0 6px var(--success)' : 'none',
                        flexShrink: 0,
                      }}
                    />
                    {index < ROADMAP_TIMELINE.length - 1 && (
                      <span
                        aria-hidden="true"
                        style={{ width: '1px', flex: 1, background: 'var(--border)' }}
                      />
                    )}
                  </div>
                  {/* Label */}
                  <div style={{ paddingBottom: index < ROADMAP_TIMELINE.length - 1 ? 'var(--space-6)' : 0 }}>
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: current ? 'var(--success)' : 'var(--text-muted)',
                        marginBottom: '2px',
                      }}
                    >
                      {phase}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>
                      {title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
