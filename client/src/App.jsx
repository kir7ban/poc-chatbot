import { useState } from 'react';
import AliasSetup from './components/AliasSetup.jsx';
import Chat from './components/Chat.jsx';
import BoschHeader from './components/BoschHeader.jsx';

export default function App() {
  const [alias, setAlias] = useState(localStorage.getItem('chatAlias') || '');

  function handleAliasSet(name) {
    localStorage.setItem('chatAlias', name);
    setAlias(name);
  }

  function handleReset() {
    localStorage.removeItem('chatAlias');
    setAlias('');
  }

  return (
    <div className="app-shell -dark-mode">
      <BoschHeader />
      <div className="app-content">
        {!alias
          ? <AliasSetup onAliasSet={handleAliasSet} />
          : <Chat alias={alias} onReset={handleReset} />
        }
      </div>
    </div>
  );
}
