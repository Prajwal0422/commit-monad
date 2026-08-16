import { useState } from 'react';
import './App.css';
import { Navbar } from './components/Navbar';
import { Landing } from './views/Landing';
import { CreateCommitment } from './views/CreateCommitment.tsx';

// ─── App-level view routing ───────────────────────────────────────────────────
// Lightweight local-state navigation — no React Router needed for this MVP.
// To add a new screen: add its key here, import the component, add a case below.
export type AppView = 'landing' | 'create';

function App() {
  const [view, setView] = useState<AppView>('landing');

  return (
    <div className="app">
      <Navbar />
      <div className="main-content">
        {view === 'landing' && (
          <Landing onNavigate={setView} />
        )}
        {view === 'create' && (
          <CreateCommitment onBack={() => setView('landing')} />
        )}
      </div>
    </div>
  );
}

export default App;
