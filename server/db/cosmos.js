import { CosmosClient } from '@azure/cosmos';

const cosmosClient = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);

let container;

export async function initDB() {
  const dbName = process.env.COSMOS_DATABASE || 'chatbot';
  const containerName = process.env.COSMOS_CONTAINER || 'conversations';

  const { database } = await cosmosClient.databases.createIfNotExists({ id: dbName });
  const { container: c } = await database.containers.createIfNotExists({
    id: containerName,
    partitionKey: { paths: ['/id'] },
  });
  container = c;
  console.log(`Connected to Cosmos DB: ${dbName}/${containerName}`);
}

// Get a single conversation by its UUID
export async function getConversationById(convId) {
  try {
    const { resource } = await container.item(convId, convId).read();
    return resource ?? null;
  } catch (err) {
    if (err.code === 404) return null;
    throw err;
  }
}

// Save (create or update) a conversation document
export async function upsertConversation(doc) {
  await container.items.upsert(doc);
}

// List all conversations for a user — metadata only, no messages payload
export async function listConversations(alias) {
  const { resources } = await container.items.query(
    {
      query: `SELECT c.id, c.alias, c.title, c.createdAt, c.updatedAt, c.messageCount
              FROM c WHERE c.alias = @alias ORDER BY c._ts DESC`,
      parameters: [{ name: '@alias', value: alias }],
    },
    { enableCrossPartitionQuery: true }
  ).fetchAll();
  return resources;
}

// One-time migration: wrap old single-blob conversation (id = alias) into new schema
export async function migrateOldConversation(alias) {
  try {
    const { resource: old } = await container.item(alias, alias).read();
    if (!old) return;

    if (old.messages?.length > 0) {
      const firstUserMsg = old.messages.find(m => m.role === 'user');
      const raw = firstUserMsg?.content || 'Previous conversation';
      const title = raw.length > 40 ? raw.slice(0, 40) + '…' : raw;

      await container.items.upsert({
        id: crypto.randomUUID(),
        alias,
        title,
        messages: old.messages,
        messageCount: old.messages.length,
        createdAt: old.updatedAt ?? new Date().toISOString(),
        updatedAt: old.updatedAt ?? new Date().toISOString(),
        migrated: true,
      });
    }

    await container.item(alias, alias).delete();
  } catch (err) {
    if (err.code !== 404) throw err;
    // 404 means no old doc — nothing to migrate
  }
}
