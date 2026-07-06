import { Router } from 'express';
import { getConversation } from '../db/cosmos.js';

const router = Router();

router.get('/:alias', async (req, res) => {
  try {
    const conversation = await getConversation(req.params.alias);
    res.json({ messages: conversation?.messages || [] });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Failed to load history' });
  }
});

export default router;
