import { useState } from 'react';
import './App.css';
import { Navbar } from './components/Navbar';
import { Landing } from './views/Landing';
import { CreateCommitment } from './views/CreateCommitment';
import { ExploreCommitments } from './views/ExploreCommitments';
import { CommitmentDetails } from './views/CommitmentDetails';
import { SubmitResult } from './views/SubmitResult';
import { Resolution } from './views/Resolution';
import { ClaimReward } from './views/ClaimReward';

// ─── App-level navigation ─────────────────────────────────────────────────────
// Simple local-state router — no react-router needed for this MVP.
// To add a new screen: extend AppView, import the component, add a case below.
export type AppView =
  | 'landing'
  | 'create'
  | 'explore'
  | 'details'
  | 'submit-result'
  | 'resolution'
  | 'claim';

function App() {
  const [view, setView] = useState<AppView>('landing');
  // Selected commitment ID — passed through navigation for detail/flow screens
  const [selectedId, setSelectedId] = useState<string>('');

  function navigate(nextView: AppView, commitmentId?: string) {
    if (commitmentId !== undefined) setSelectedId(commitmentId);
    setView(nextView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() {
    const backMap: Partial<Record<AppView, AppView>> = {
      create:         'landing',
      explore:        'landing',
      details:        'explore',
      'submit-result': 'details',
      resolution:     'details',
      claim:          'resolution',
    };
    navigate(backMap[view] ?? 'landing', selectedId);
  }

  return (
    <div className="app">
      <Navbar onNavigate={navigate} currentView={view} />
      <div className="main-content">
        {view === 'landing' && (
          <Landing onNavigate={navigate} />
        )}
        {view === 'create' && (
          <CreateCommitment onBack={goBack} />
        )}
        {view === 'explore' && (
          <ExploreCommitments onNavigate={navigate} />
        )}
        {view === 'details' && (
          <CommitmentDetails
            commitmentId={selectedId}
            onNavigate={navigate}
            onBack={goBack}
          />
        )}
        {view === 'submit-result' && (
          <SubmitResult
            commitmentId={selectedId}
            onNavigate={navigate}
            onBack={goBack}
          />
        )}
        {view === 'resolution' && (
          <Resolution
            commitmentId={selectedId}
            onNavigate={navigate}
            onBack={goBack}
          />
        )}
        {view === 'claim' && (
          <ClaimReward
            commitmentId={selectedId}
            onNavigate={navigate}
            onBack={goBack}
          />
        )}
      </div>
    </div>
  );
}

export default App;
