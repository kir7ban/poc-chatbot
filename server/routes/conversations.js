import { Router } from 'express';
import { listConversations, migrateOldConversation } from '../db/cosmos.js';

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

export default router;
