import { useState, useMemo } from 'react';
import { MOCK_COMMITMENTS } from '../data/mockCommitments';
import { CommitmentCard } from '../components/CommitmentCard';
import { Badge } from '../components/Badge';
import { inputStyle } from '../components/FormField';
import type { CommitmentStatus } from '../types/commitment';
import type { AppView } from '../App';

type FilterStatus = 'all' | CommitmentStatus;

interface Props {
  onNavigate: (view: AppView, commitmentId?: string) => void;
}

export function ExploreCommitments({ onNavigate }: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');

  // MOCK DATA — replace with useReadContract when contract is live
  const commitments = MOCK_COMMITMENTS;

  const filtered = useMemo(() => {
    return commitments.filter((c) => {
      const matchesStatus = filter === 'all' || c.status === filter;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        c.goal.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [commitments, search, filter]);

  const activeCount = commitments.filter((c) => c.status === 'active').length;

  return (
    <main style={{ padding: 'var(--space-10) 0 var(--space-20)' }}>
      <div className="container">

        {/* Page header */}
        <div style={{ marginBottom: 'var(--space-10)' }}>
          <Badge variant="accent" style={{ marginBottom: 'var(--space-3)' }}>
            Mock Data
          </Badge>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: 'var(--space-2)' }}>
            Explore Commitments
          </h1>
          <p style={{ fontSize: '15px' }}>
            {activeCount} active commitment{activeCount !== 1 ? 's' : ''} on Monad Testnet.
          </p>
        </div>

        {/* Search + filter row */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-8)',
            flexWrap: 'wrap',
          }}
        >
          {/* Search */}
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontSize: '14px',
                pointerEvents: 'none',
              }}
            >
              ⌕
            </span>
            <input
              type="search"
              placeholder="Search goals, categories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search commitments"
              style={{ ...inputStyle, paddingLeft: '36px' }}
            />
          </div>

          {/* Status filter pills */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
            {(['all', 'active', 'resolved'] as FilterStatus[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  height: '44px',
                  padding: '0 16px',
                  fontSize: '13px',
                  fontWeight: 500,
                  fontFamily: 'var(--font-sans)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid',
                  cursor: 'pointer',
                  transition: 'background var(--transition), color var(--transition), border-color var(--transition)',
                  background: filter === f ? 'var(--accent)' : 'transparent',
                  color: filter === f ? '#fff' : 'var(--text-secondary)',
                  borderColor: filter === f ? 'var(--accent)' : 'var(--border)',
                  textTransform: 'capitalize',
                }}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 'var(--space-5)',
            }}
          >
            {filtered.map((commitment) => (
              <CommitmentCard
                key={commitment.id}
                commitment={commitment}
                onView={(id) => onNavigate('details', id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState query={search} onClear={() => { setSearch(''); setFilter('all'); }} />
        )}
      </div>
    </main>
  );
}

function EmptyState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: 'var(--space-20) 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-4)',
      }}
    >
      <span style={{ fontSize: '32px' }} aria-hidden="true">◌</span>
      <h3 style={{ fontSize: '18px', fontWeight: 600 }}>
        {query ? `No results for "${query}"` : 'No commitments found'}
      </h3>
      <p style={{ fontSize: '14px', maxWidth: '300px' }}>
        {query ? 'Try a different search term or clear the filter.' : 'Check back soon.'}
      </p>
      {query && (
        <button
          onClick={onClear}
          style={{
            fontSize: '14px',
            color: 'var(--accent)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            padding: 0,
          }}
        >
          Clear search
        </button>
      )}
    </div>
  );
}

// (formatTimeRemaining is used internally via CommitmentCard)
