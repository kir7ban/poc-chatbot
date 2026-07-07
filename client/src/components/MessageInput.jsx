import { useState, useRef, useEffect } from 'react';

const MODEL_GROUPS = [
  {
    provider: 'Anthropic',
    models: [
      { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
      { id: 'claude-opus-4-6',   label: 'Claude Opus 4.6' },
      { id: 'claude-haiku-4-5',  label: 'Claude Haiku 4.5' },
    ],
  },
  {
    provider: 'OpenAI',
    models: [
      { id: 'gpt-5.5',      label: 'GPT-5.5' },
      { id: 'gpt-5.4-mini', label: 'GPT-5.4 mini' },
    ],
  },
  {
    provider: 'DeepSeek',
    models: [
      { id: 'DeepSeek-V4-Pro',   label: 'DeepSeek V4 Pro' },
      { id: 'DeepSeek-V3.2',     label: 'DeepSeek V3.2' },
      { id: 'DeepSeek-V4-Flash', label: 'DeepSeek V4 Flash' },
    ],
  },
];

const MODEL_LABELS = Object.fromEntries(
  MODEL_GROUPS.flatMap(g => g.models.map(m => [m.id, m.label]))
);

export default function MessageInput({ onSend, disabled, model, onModelChange }) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function onOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  function resetHeight() {
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    resetHeight();
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function handleInput(e) {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
  }

  const canSend = !disabled && text.trim().length > 0;

  return (
    <div className="message-input-wrap" ref={dropdownRef}>
      {open && (
        <div className="model-dropdown">
          {MODEL_GROUPS.map(group => (
            <div key={group.provider} className="model-dropdown-group">
              <p className="model-dropdown-label">{group.provider}</p>
              {group.models.map(m => (
                <button
                  key={m.id}
                  type="button"
                  className={`model-dropdown-item ${m.id === model ? 'active' : ''}`}
                  onClick={() => { onModelChange(m.id); setOpen(false); }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      <form className="message-input" onSubmit={handleSubmit}>
        <button
          type="button"
          className="model-selector-btn"
          onClick={() => setOpen(o => !o)}
          aria-label="Select model"
          aria-expanded={open}
        >
          <span>{MODEL_LABELS[model] || model}</span>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"
               style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Message… (Enter to send, Shift+Enter for new line)"
          disabled={disabled}
          rows={1}
        />

        <button type="submit" disabled={!canSend} aria-label="Send message">
          Send
        </button>
      </form>
    </div>
  );
}
