import { useState, useEffect, useRef, useCallback } from 'react';
import ModelPicker from './ModelPicker.jsx';
import MessageInput from './MessageInput.jsx';
import ConversationList from './ConversationList.jsx';
import { sendMessage, listConversations, loadConversation } from '../api/chat.js';

const MODEL_LABELS = {
  'claude-sonnet-4-6': 'Claude Sonnet 4.6',
  'claude-opus-4-6':   'Claude Opus 4.6',
  'claude-haiku-4-5':  'Claude Haiku 4.5',
  'gpt-5.5':           'GPT-5.5',
  'gpt-5.4-mini':      'GPT-5.4 mini',
  'DeepSeek-V4-Pro':   'DeepSeek V4 Pro',
  'DeepSeek-V3.2':     'DeepSeek V3.2',
  'DeepSeek-V4-Flash': 'DeepSeek V4 Flash',
};

function makeId() {
  return crypto.randomUUID();
}

function titleFromMessage(text) {
  return text.trim().slice(0, 48) + (text.trim().length > 48 ? '…' : '');
}

export default function Chat({ alias, onReset }) {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(() => makeId());
  const [messages, setMessages] = useState([]);
  const [model, setModel] = useState('claude-sonnet-4-6');
  const [loading, setLoading] = useState(false);
  const [convsLoading, setConvsLoading] = useState(true);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  // Load conversation list on mount and after each send
  const refreshList = useCallback(() => {
    listConversations(alias)
      .then(({ conversations: list }) => setConversations(list))
      .catch(() => {}) // non-fatal
      .finally(() => setConvsLoading(false));
  }, [alias]);

  useEffect(() => { refreshList(); }, [refreshList]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleNew() {
    setActiveConvId(makeId());
    setMessages([]);
    setError(null);
  }

  function handleSelect(conv) {
    setActiveConvId(conv.id);
    setError(null);
    setMessages([]);
    loadConversation(conv.id)
      .then(({ messages: msgs }) => setMessages(Array.isArray(msgs) ? msgs : []))
      .catch(() => setError('Could not load conversation.'));
  }

  function handleModelChange(next) {
    setModel(next);
    setError(null);
  }

  async function handleSend(text) {
    setLoading(true);
    setError(null);

    // Optimistic user message
    setMessages(prev => [...prev, { role: 'user', content: text }]);

    // If this is the first message, give the conversation a title locally
    if (messages.length === 0) {
      const title = titleFromMessage(text);
      setConversations(prev => {
        const exists = prev.find(c => c.id === activeConvId);
        if (exists) return prev;
        return [{ id: activeConvId, title, updatedAt: new Date().toISOString(), messageCount: 1 }, ...prev];
      });
    }

    try {
      const { reply, model: usedModel } = await sendMessage(alias, activeConvId, text, model);
      setMessages(prev => [...prev, { role: 'assistant', content: reply, model: usedModel }]);
      refreshList(); // sync title + timestamp from server
    } catch (err) {
      setError(err.message || 'Failed to get a response. Please try again.');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="user-alias">{alias}</span>
          <button className="reset-btn" onClick={onReset}>Switch user</button>
        </div>

        <ConversationList
          conversations={conversations}
          activeId={activeConvId}
          onSelect={handleSelect}
          onNew={handleNew}
          loading={convsLoading}
        />

        <ModelPicker model={model} onModelChange={handleModelChange} />
      </aside>

      <main className="chat-main">
        <div className="messages">
          {messages.length === 0 && !loading && (
            <div className="empty-state">
              Start a conversation with {MODEL_LABELS[model] || model}
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              {msg.role === 'assistant' && (
                <span className="model-badge">{MODEL_LABELS[msg.model] || msg.model}</span>
              )}
              <div className="message-content">{msg.content}</div>
            </div>
          ))}
          {loading && (
            <div className="message assistant">
              <span className="model-badge">{MODEL_LABELS[model]}</span>
              <div className="message-content">
                <span className="typing-dots"><span /><span /><span /></span>
              </div>
            </div>
          )}
          {error && (
            <div className="error-banner">
              {error}
              <button className="error-dismiss" onClick={() => setError(null)} aria-label="Dismiss">×</button>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <MessageInput onSend={handleSend} disabled={loading} />
      </main>
    </div>
  );
}
