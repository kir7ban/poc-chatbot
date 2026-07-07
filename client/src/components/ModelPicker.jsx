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

export default function ModelPicker({ model, onModelChange }) {
  return (
    <div className="model-picker">
      {MODEL_GROUPS.map(group => (
        <div key={group.provider} className="model-group">
          <p className="section-label">{group.provider}</p>
          {group.models.map(m => (
            <button
              key={m.id}
              className={`model-option ${model === m.id ? 'active' : ''}`}
              onClick={() => onModelChange(m.id)}
            >
              <span className="model-name">{m.label}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
