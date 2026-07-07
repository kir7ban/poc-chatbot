import { Router } from 'express';
import { AzureOpenAI } from 'openai';
import { getConversation, saveConversation } from '../db/cosmos.js';

const router = Router();

const CONTEXT_WINDOW = 20;

// Single client for all models — they all live on the same AIServices resource
const client = new AzureOpenAI({
  endpoint: process.env.AZURE_AI_ENDPOINT,
  apiKey: process.env.AZURE_AI_KEY,
  apiVersion: process.env.AZURE_AI_API_VERSION || '2025-01-01-preview',
});

// Deployment name IS the model key — no mapping needed
const VALID_MODELS = new Set([
  'claude-sonnet-4-6',
  'claude-opus-4-6',
  'claude-haiku-4-5',
  'gpt-5.5',
  'gpt-5.4-mini',
  'DeepSeek-V4-Pro',
  'DeepSeek-V3.2',
  'DeepSeek-V4-Flash',
]);

router.post('/', async (req, res) => {
  const { alias, message, model } = req.body;

  if (!alias || !message || !model) {
    return res.status(400).json({ error: 'alias, message, and model are required' });
  }

  if (!VALID_MODELS.has(model)) {
    return res.status(400).json({ error: `Invalid model. Valid options: ${[...VALID_MODELS].join(', ')}` });
  }

  try {
    const conversation = await getConversation(alias);
    const history = conversation?.messages || [];

    const userMessage = { role: 'user', content: message };
    const updatedHistory = [...history, userMessage];

    const contextWindow = updatedHistory.slice(-CONTEXT_WINDOW);

    const response = await client.chat.completions.create({
      model,
      messages: contextWindow,
      max_tokens: 2048,
    });

    const reply = response.choices[0].message.content;
    const assistantMessage = { role: 'assistant', content: reply, model };
    await saveConversation(alias, [...updatedHistory, assistantMessage]);

    res.json({ reply, model });
  } catch (err) {
    console.error('Chat error:', err?.message || err);
    res.status(500).json({ error: err?.message || 'Failed to process message' });
  }
});

export default router;
