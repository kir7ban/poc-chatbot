import { Router } from 'express';
import { getConversationById } from '../db/cosmos.js';

const router = Router();

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
