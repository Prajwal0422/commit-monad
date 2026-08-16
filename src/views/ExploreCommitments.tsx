import { useState, useMemo } from 'react';
import { useAllChallenges } from '../hooks/useCommitPool';
import { challengeToCommitment } from '../utils/challenge';
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

  // LIVE DATA — every commitment is read from the deployed CommitPool contract
  const { data: chainChallenges, isLoading, isError, error, refetch } = useAllChallenges();

  const commitments = useMemo(
    () => (chainChallenges ?? []).map(challengeToCommitment).reverse(),
    [chainChallenges],
  );

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
          <Badge variant="success" style={{ marginBottom: 'var(--space-3)' }}>
            Live · Monad Testnet
          </Badge>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: 'var(--space-2)' }}>
            Explore Commitments
          </h1>
          <p style={{ fontSize: '15px' }}>
            {isLoading
              ? 'Reading commitments from the CommitPool contract…'
              : isError
              ? 'Failed to read commitments from the contract.'
              : `${activeCount} active commitment${activeCount !== 1 ? 's' : ''} on Monad Testnet.`}
          </p>
        </div>

        {/* Loading / error states */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: 'var(--space-20) 0', color: 'var(--text-muted)', fontSize: '14px' }}>
            ◌ Loading from chain…
          </div>
        )}
        {isError && (
          <div style={{ textAlign: 'center', padding: 'var(--space-20) 0' }}>
            <p style={{ fontSize: '14px', color: 'var(--danger)', marginBottom: 'var(--space-4)' }}>
              {error instanceof Error ? error.message : 'Could not reach Monad Testnet.'}
            </p>
            <button
              onClick={() => refetch()}
              style={{
                fontSize: '14px', color: 'var(--accent)', background: 'none',
                border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', padding: 0,
              }}
            >
              Retry
            </button>
          </div>
        )}

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
        {!isLoading && !isError && filtered.length > 0 && (
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
        )}
        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyState query={search} isEmptyOnChain={commitments.length === 0} onClear={() => { setSearch(''); setFilter('all'); }} />
        )}
      </div>
    </main>
  );
}

function EmptyState({
  query,
  isEmptyOnChain,
  onClear,
}: {
  query: string;
  isEmptyOnChain: boolean;
  onClear: () => void;
}) {
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
        {query ? `No results for "${query}"` : isEmptyOnChain ? 'No commitments on-chain yet' : 'No commitments found'}
      </h3>
      <p style={{ fontSize: '14px', maxWidth: '320px', color: 'var(--text-secondary)' }}>
        {query
          ? 'Try a different search term or clear the filter.'
          : isEmptyOnChain
          ? 'The CommitPool contract has no challenges yet — create the first one.'
          : 'Check back soon.'}
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
