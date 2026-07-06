import { Router } from 'express';
import OpenAI, { AzureOpenAI } from 'openai';
import { getConversation, saveConversation } from '../db/cosmos.js';

const router = Router();

const CONTEXT_WINDOW = 20;

function foundryClient(endpoint, key) {
  return new OpenAI({
    baseURL: endpoint.replace(/\/?$/, '/v1'),
    apiKey: key,
    defaultHeaders: { 'api-key': key },
  });
}

const MODELS = {
  claude: {
    getClient: () => foundryClient(process.env.AZURE_CLAUDE_ENDPOINT, process.env.AZURE_CLAUDE_KEY),
    deployment: process.env.CLAUDE_DEPLOYMENT || 'claude-sonnet-4-6',
    label: 'Claude Sonnet 4.6',
  },
  openai: {
    getClient: () => new AzureOpenAI({
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiKey: process.env.AZURE_OPENAI_KEY,
      apiVersion: '2024-10-21',
    }),
    deployment: process.env.OPENAI_DEPLOYMENT || 'gpt-4o',
    label: 'GPT-4o',
  },
  llama: {
    getClient: () => foundryClient(process.env.AZURE_LLAMA_ENDPOINT, process.env.AZURE_LLAMA_KEY),
    deployment: process.env.LLAMA_DEPLOYMENT || 'llama-3-3-70b',
    label: 'Llama 3.3 70B',
  },
};

async function callModel(modelKey, messages) {
  const { getClient, deployment } = MODELS[modelKey];
  const client = getClient();
  const response = await client.chat.completions.create({
    model: deployment,
    messages,
    max_tokens: 2048,
  });
  return response.choices[0].message.content;
}

router.post('/', async (req, res) => {
  const { alias, message, model } = req.body;

  if (!alias || !message || !model) {
    return res.status(400).json({ error: 'alias, message, and model are required' });
  }

  if (!MODELS[model]) {
    return res.status(400).json({ error: `Invalid model. Use: ${Object.keys(MODELS).join(', ')}` });
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
    console.error('Chat error:', err?.message || err);
    res.status(500).json({ error: err?.message || 'Failed to process message' });
  }
});

export default router;
