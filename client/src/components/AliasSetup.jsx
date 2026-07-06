import { useState } from 'react';

export default function AliasSetup({ onAliasSet }) {
  const [name, setName] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onAliasSet(trimmed);
  }

  return (
    <div className="alias-setup">
      <div className="alias-card">
        <h1>AI Chatbot</h1>
        <p>Enter your name to get started. Your conversations will be saved.</p>
        <form onSubmit={handleSubmit}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            autoFocus
            maxLength={50}
          />
          <button type="submit" disabled={!name.trim()}>
            Start chatting
          </button>
        </form>
      </div>
    </div>
  );
}
