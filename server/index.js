import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import chatRouter from './routes/chat.js';
import conversationsRouter from './routes/conversations.js';
import conversationRouter from './routes/conversation.js';
import { initDB } from './db/cosmos.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

app.use('/api/chat', chatRouter);
app.use('/api/conversations', conversationsRouter);  // GET /api/conversations/:alias  (list)
app.use('/api/conversation', conversationRouter);    // GET /api/conversation/:convId  (single)

const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));

const PORT = process.env.PORT || 3000;

async function start() {
  await initDB();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
