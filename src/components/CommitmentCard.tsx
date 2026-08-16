import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';
import type { Commitment } from '../types/commitment';
import { formatTimeRemaining } from '../utils/challenge';

const CATEGORY_COLORS: Record<string, string> = {
  Fitness:     'var(--success)',
  Learning:    'var(--accent)',
  Build:       '#a78bfa',
  Mindfulness: 'var(--warning)',
};

interface CommitmentCardProps {
  commitment: Commitment;
  onView: (id: string) => void;
}

export function CommitmentCard({ commitment, onView }: CommitmentCardProps) {
  const fillRatio = commitment.participantCount / commitment.maxParticipants;
  const spotsLeft = commitment.maxParticipants - commitment.participantCount;
  const timeLeft = formatTimeRemaining(commitment.deadline);
  const isAlmostFull = spotsLeft <= 2 && spotsLeft > 0;
  const isFull = spotsLeft === 0;
  const accentColor = CATEGORY_COLORS[commitment.category] ?? 'var(--accent)';

  return (
    <Card hoverable onClick={() => onView(commitment.id)}>
      {/* Header row */}
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
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {timeLeft}
        </span>
      </div>

      {/* Goal */}
      <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--text)', lineHeight: 1.3 }}>
        {commitment.goal}
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

      {/* Participant progress */}
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
          <span style={{ color: isAlmostFull ? 'var(--warning)' : 'var(--text-secondary)', fontWeight: 500 }}>
            {commitment.participantCount} / {commitment.maxParticipants}
            {isFull && ' · Full'}
          </span>
        </div>
        <div style={{ height: '4px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${fillRatio * 100}%`,
              background: accentColor,
              borderRadius: '99px',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-4)',
          paddingTop: 'var(--space-4)',
          borderTop: '1px solid var(--border)',
          marginBottom: 'var(--space-5)',
        }}
      >
        <StatItem label="Stake" value={`${commitment.stakePerParticipant} MON`} highlight />
        <StatItem label="Pool" value={`${commitment.pool} MON`} />
        <StatItem
          label="Spots"
          value={isFull ? 'Full' : `${spotsLeft} left`}
          muted={isFull}
          warn={isAlmostFull}
        />
      </div>

      {/* CTA */}
      <Button
        variant="secondary"
        size="sm"
        fullWidth
        onClick={(e) => { e.stopPropagation(); onView(commitment.id); }}
      >
        View Commitment →
      </Button>
    </Card>
  );
}

function StatItem({
  label,
  value,
  highlight = false,
  muted = false,
  warn = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
  warn?: boolean;
}) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div style={{
        fontSize: '14px',
        fontWeight: 600,
        color: highlight ? 'var(--accent)'
          : warn ? 'var(--warning)'
          : muted ? 'var(--text-muted)'
          : 'var(--text)',
      }}>
        {value}
      </div>
    </div>
  );
}
