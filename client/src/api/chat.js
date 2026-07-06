export async function sendMessage(alias, message, model) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alias, message, model }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to send message');
  }
  return res.json();
}

export async function loadHistory(alias) {
  const res = await fetch(`/api/history/${encodeURIComponent(alias)}`);
  if (!res.ok) throw new Error('Failed to load history');
  return res.json();
}
