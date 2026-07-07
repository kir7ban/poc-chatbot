import { Router } from 'express';
import { listConversations, getConversationById, migrateOldConversation } from '../db/cosmos.js';

const router = Router();

// GET /api/conversations/:alias — list all conversations for a user
router.get('/:alias', async (req, res) => {
  const { alias } = req.params;
  try {
    await migrateOldConversation(alias);
    const conversations = await listConversations(alias);
    res.json({ conversations });
  } catch (err) {
    console.error('List conversations error:', err?.message || err);
    res.status(500).json({ error: 'Failed to load conversations' });
  }
});

// GET /api/conversation/:convId — get messages for a specific conversation
router.get('/:convId', async (req, res) => {
  try {
    const conv = await getConversationById(req.params.convId);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    res.json({ messages: conv.messages ?? [] });
  } catch (err) {
    console.error('Get conversation error:', err?.message || err);
    res.status(500).json({ error: 'Failed to load conversation' });
  }
});

export default router;
