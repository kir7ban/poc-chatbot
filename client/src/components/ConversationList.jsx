function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ConversationList({ conversations, activeId, onSelect, onNew, loading }) {
  return (
    <div className="conv-list-section">
      <div className="conv-list-header">
        <p className="section-label">Conversations</p>
        <button className="new-conv-btn" onClick={onNew} title="New conversation">+</button>
      </div>

      {loading && <p className="conv-loading">Loading…</p>}

      {!loading && conversations.length === 0 && (
        <p className="conv-empty">No conversations yet</p>
      )}

      <ul className="conv-list">
        {conversations.map(c => (
          <li key={c.id}>
            <button
              className={`conv-item ${c.id === activeId ? 'active' : ''}`}
              onClick={() => onSelect(c)}
            >
              <span className="conv-title">{c.title || 'New conversation'}</span>
              <span className="conv-meta">{timeAgo(c.updatedAt)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
