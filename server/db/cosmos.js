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

export async function getConversation(alias) {
  try {
    const { resource } = await container.item(alias, alias).read();
    return resource ?? null;
  } catch (err) {
    if (err.code === 404) return null;
    throw err;
  }
}

export async function saveConversation(alias, messages) {
  await container.items.upsert({
    id: alias,
    alias,
    messages,
    updatedAt: new Date().toISOString(),
  });
}
