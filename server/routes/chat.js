import { Router } from 'express';
import ModelClient, { isUnexpected } from '@azure-rest/ai-inference';
import { AzureKeyCredential } from '@azure/core-auth';
import { getConversation, saveConversation } from '../db/cosmos.js';

const router = Router();

const CONTEXT_WINDOW = 20;

const MODEL_CONFIG = {
  claude: {
    endpoint: process.env.AZURE_AI_ENDPOINT,
    key: process.env.AZURE_AI_KEY,
    deployment: process.env.CLAUDE_DEPLOYMENT || 'claude-3-5-sonnet',
  },
  openai: {
    endpoint: process.env.AZURE_AI_ENDPOINT,
    key: process.env.AZURE_AI_KEY,
    deployment: process.env.OPENAI_DEPLOYMENT || 'gpt-4o',
  },
  gemini: {
    endpoint: process.env.AZURE_AI_ENDPOINT,
    key: process.env.AZURE_AI_KEY,
    deployment: process.env.GEMINI_DEPLOYMENT || 'gemini-1-5-flash',
  },
};

async function callModel(modelKey, messages) {
  const { endpoint, key, deployment } = MODEL_CONFIG[modelKey];
  const client = ModelClient(endpoint, new AzureKeyCredential(key));

  const response = await client.path('/chat/completions').post({
    body: {
      model: deployment,
      messages,
      max_tokens: 2048,
    },
  });

  if (isUnexpected(response)) {
    throw new Error(`AI Foundry error: ${response.body.error?.message || response.status}`);
  }

  return response.body.choices[0].message.content;
}

router.post('/', async (req, res) => {
  const { alias, message, model } = req.body;

  if (!alias || !message || !model) {
    return res.status(400).json({ error: 'alias, message, and model are required' });
  }

  if (!MODEL_CONFIG[model]) {
    return res.status(400).json({ error: `Invalid model. Use: ${Object.keys(MODEL_CONFIG).join(', ')}` });
  }

  try {
    const conversation = await getConversation(alias);
    const history = conversation?.messages || [];

    const userMessage = { role: 'user', content: message };
    const updatedHistory = [...history, userMessage];

    const contextWindow = updatedHistory.slice(-CONTEXT_WINDOW);
    const reply = await callModel(model, contextWindow);

    const assistantMessage = { role: 'assistant', content: reply, model };
    await saveConversation(alias, [...updatedHistory, assistantMessage]);

    res.json({ reply, model });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message || 'Failed to process message' });
  }
});

export default router;
