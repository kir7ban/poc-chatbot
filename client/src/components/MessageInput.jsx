import { useState, useRef } from 'react';

export default function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

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
    <form className="message-input" onSubmit={handleSubmit}>
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
  );
}
