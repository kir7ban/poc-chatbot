import { Router } from 'express';
import AnthropicFoundry from '@anthropic-ai/foundry-sdk';
import { AzureOpenAI } from 'openai';
import { getConversation, saveConversation } from '../db/cosmos.js';

const router = Router();

const CONTEXT_WINDOW = 20;

// Claude via Anthropic Foundry SDK (services.ai.azure.com/anthropic)
const claudeClient = new AnthropicFoundry({
  apiKey: process.env.AZURE_AI_KEY,
  baseURL: process.env.AZURE_CLAUDE_ENDPOINT,
  apiVersion: '2023-06-01',
});

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

// Strip any extra fields (e.g. 'model') stored in Cosmos history — APIs only accept role + content
function cleanMessages(messages) {
  return messages.map(({ role, content }) => ({ role, content }));
}

async function callClaude(model, messages) {
  const response = await claudeClient.messages.create({
    model,
    messages: cleanMessages(messages),
    max_tokens: 2048,
  });
  return response.content[0].text;
}

async function callAzure(model, messages) {
  const response = await azureClient.chat.completions.create({
    model,
    messages: cleanMessages(messages),
    max_tokens: 2048,
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
