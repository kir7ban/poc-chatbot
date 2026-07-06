const MODELS = [
  { id: 'claude', label: 'Claude Sonnet 4.6', provider: 'Anthropic' },
  { id: 'openai', label: 'GPT-4o', provider: 'OpenAI' },
  { id: 'gemini', label: 'Gemini 1.5 Flash', provider: 'Google' },
];

export default function ModelPicker({ model, onModelChange }) {
  return (
    <div className="model-picker">
      <p className="section-label">Model</p>
      {MODELS.map(m => (
        <button
          key={m.id}
          className={`model-option ${model === m.id ? 'active' : ''}`}
          onClick={() => onModelChange(m.id)}
        >
          <span className="model-name">{m.label}</span>
          <span className="model-provider">{m.provider}</span>
        </button>
      ))}
    </div>
  );
}
