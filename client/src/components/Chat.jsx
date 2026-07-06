import { useState, useEffect, useRef } from 'react';
import ModelPicker from './ModelPicker.jsx';
import MessageInput from './MessageInput.jsx';
import { sendMessage, loadHistory } from '../api/chat.js';

const MODEL_LABELS = {
  claude: 'Claude Sonnet 4.6',
  openai: 'GPT-4o',
  llama: 'Llama 3.3 70B',
};

export default function Chat({ alias, onReset }) {
  const [messages, setMessages] = useState([]);
  const [model, setModel] = useState('claude');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    loadHistory(alias)
      .then(({ messages: msgs }) => setMessages(msgs))
      .catch(() => setError('Could not load conversation history.'));
  }, [alias]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSend(text) {
    setLoading(true);
    setError(null);
    setMessages(prev => [...prev, { role: 'user', content: text }]);

    try {
      const { reply, model: usedModel } = await sendMessage(alias, text, model);
      setMessages(prev => [...prev, { role: 'assistant', content: reply, model: usedModel }]);
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
        <ModelPicker model={model} onModelChange={setModel} />
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
              <div className="message-content typing">Thinking...</div>
            </div>
          )}
          {error && <div className="error-banner">{error}</div>}
          <div ref={bottomRef} />
        </div>
        <MessageInput onSend={handleSend} disabled={loading} />
      </main>
    </div>
  );
}
