import { useState } from 'react';
import AliasSetup from './components/AliasSetup.jsx';
import Chat from './components/Chat.jsx';

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

  if (!alias) return <AliasSetup onAliasSet={handleAliasSet} />;
  return <Chat alias={alias} onReset={handleReset} />;
}
