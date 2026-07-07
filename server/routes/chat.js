import { Router } from 'express';
import { AzureOpenAI } from 'openai';
import { getConversationById, upsertConversation } from '../db/cosmos.js';

const router = Router();

const CONTEXT_WINDOW = 20;

// All models (Anthropic, OpenAI, DeepSeek) via Azure OpenAI SDK —
// AIServices resources expose all providers through the OpenAI-compatible path.
const azureClient = new AzureOpenAI({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiKey: process.env.AZURE_AI_KEY,
  apiVersion: '2024-12-01-preview',
});

const ALL_MODELS = new Set([
  'claude-sonnet-4-6',
  'claude-opus-4-6',
  'claude-haiku-4-5',
  'gpt-5.5',
  'gpt-5.4-mini',
  'DeepSeek-V4-Pro',
  'DeepSeek-V3.2',
  'DeepSeek-V4-Flash',
]);

function cleanMessages(messages) {
  return messages.map(({ role, content }) => ({ role, content }));
}

function makeTitle(text) {
  const trimmed = text.trim();
  return trimmed.length > 40 ? trimmed.slice(0, 40) + '…' : trimmed;
}

async function callModel(model, messages) {
  const response = await azureClient.chat.completions.create({
    model,
    messages: cleanMessages(messages),
    max_completion_tokens: 2048,
  });
  return response.choices[0].message.content;
}

router.post('/', async (req, res) => {
  const { alias, conversationId, message, model } = req.body;

  if (!alias || !conversationId || !message || !model) {
    return res.status(400).json({ error: 'alias, conversationId, message, and model are required' });
  }

  if (!ALL_MODELS.has(model)) {
    return res.status(400).json({ error: `Invalid model. Valid options: ${[...ALL_MODELS].join(', ')}` });
  }

  try {
    const conversation = await getConversationById(conversationId);
    const history = conversation?.messages || [];

    const userMessage = { role: 'user', content: message };
    const updatedHistory = [...history, userMessage];
    const contextWindow = updatedHistory.slice(-CONTEXT_WINDOW);

    const reply = await callModel(model, contextWindow);

    const assistantMessage = { role: 'assistant', content: reply, model };
    const finalHistory = [...updatedHistory, assistantMessage];

    // Title: derive from first user message (once) and lock it
    const title = conversation?.title ?? makeTitle(message);
    const now = new Date().toISOString();

    await upsertConversation({
      id: conversationId,
      alias,
      title,
      messages: finalHistory,
      messageCount: finalHistory.length,
      createdAt: conversation?.createdAt ?? now,
      updatedAt: now,
    });

    res.json({ reply, model, title });
  } catch (err) {
    console.error('Chat error:', err?.message || err);
    res.status(500).json({ error: err?.message || 'Failed to process message' });
  }
});

export default router;
