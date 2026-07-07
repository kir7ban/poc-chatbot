export async function sendMessage(alias, conversationId, message, model) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alias, conversationId, message, model }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to send message');
  }
  return res.json();
}

export async function listConversations(alias) {
  const res = await fetch(`/api/conversations/${encodeURIComponent(alias)}`);
  if (!res.ok) throw new Error('Failed to load conversations');
  return res.json(); // { conversations: [{ id, title, updatedAt, messageCount }] }
}

export async function loadConversation(conversationId) {
  const res = await fetch(`/api/conversation/${encodeURIComponent(conversationId)}`);
  if (!res.ok) throw new Error('Failed to load conversation');
  return res.json(); // { messages: [] }
}
