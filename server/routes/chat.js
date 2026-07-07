import { Router } from 'express';
import { AzureOpenAI } from 'openai';
import { getConversation, saveConversation } from '../db/cosmos.js';

const router = Router();

const CONTEXT_WINDOW = 20;

// OpenAI + DeepSeek via Azure OpenAI SDK (cognitiveservices.azure.com)
const azureClient = new AzureOpenAI({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiKey: process.env.AZURE_AI_KEY,
  apiVersion: '2024-12-01-preview',
});

const CLAUDE_MODELS = new Set([
  'claude-sonnet-4-6',
  'claude-opus-4-6',
  'claude-haiku-4-5',
]);

const AZURE_MODELS = new Set([
  'gpt-5.5',
  'gpt-5.4-mini',
  'DeepSeek-V4-Pro',
  'DeepSeek-V3.2',
  'DeepSeek-V4-Flash',
]);

const ALL_MODELS = new Set([...CLAUDE_MODELS, ...AZURE_MODELS]);

// Strip any extra stored fields — APIs only accept role + content
function cleanMessages(messages) {
  return messages.map(({ role, content }) => ({ role, content }));
}

// Claude via raw fetch — bypasses SDK which injects extra fields into messages
async function callClaude(model, messages) {
  const base = (process.env.AZURE_CLAUDE_ENDPOINT || '').replace(/\/?$/, '');
  const res = await fetch(`${base}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.AZURE_AI_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      messages: cleanMessages(messages),
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`${res.status} ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  return data.content[0].text;
}

// GPT-5.x + DeepSeek via Azure OpenAI SDK
// max_completion_tokens replaces max_tokens for newer GPT models
async function callAzure(model, messages) {
  const response = await azureClient.chat.completions.create({
    model,
    messages: cleanMessages(messages),
    max_completion_tokens: 2048,
  });
  return response.choices[0].message.content;
}

router.post('/', async (req, res) => {
  const { alias, message, model } = req.body;

  if (!alias || !message || !model) {
    return res.status(400).json({ error: 'alias, message, and model are required' });
  }

  if (!ALL_MODELS.has(model)) {
    return res.status(400).json({ error: `Invalid model. Valid options: ${[...ALL_MODELS].join(', ')}` });
  }

  try {
    const conversation = await getConversation(alias);
    const history = conversation?.messages || [];

    const userMessage = { role: 'user', content: message };
    const updatedHistory = [...history, userMessage];
    const contextWindow = updatedHistory.slice(-CONTEXT_WINDOW);

    const reply = CLAUDE_MODELS.has(model)
      ? await callClaude(model, contextWindow)
      : await callAzure(model, contextWindow);

    const assistantMessage = { role: 'assistant', content: reply, model };
    await saveConversation(alias, [...updatedHistory, assistantMessage]);

    res.json({ reply, model });
  } catch (err) {
    console.error('Chat error:', err?.message || err);
    res.status(500).json({ error: err?.message || 'Failed to process message' });
  }
});

export default router;
