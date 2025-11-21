// Database connection utility for CosmosDB (MongoDB API)
import { MongoClient, Db, MongoClientOptions } from 'mongodb';
import { env } from './env';

let client: MongoClient | null = null;
let db: Db | null = null;
let connectionPromise: Promise<Db> | null = null;

// Connection pool configuration
const clientOptions: MongoClientOptions = {
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: false, // CosmosDB MongoDB API doesn't support retryable writes
  retryReads: true,
};

/**
 * Connect to CosmosDB with connection pooling and error handling
 * Uses singleton pattern to reuse connections across requests
 */
export async function connectToDatabase(): Promise<Db> {
  // Return existing connection if available
  if (db) {
    return db;
  }

  // Return in-progress connection attempt
  if (connectionPromise) {
    return connectionPromise;
  }

  // Validate connection string
  if (!env.cosmosdb.connectionString) {
    throw new Error('COSMOSDB_CONNECTION_STRING is not defined in environment variables');
  }

  // Create new connection
  connectionPromise = (async () => {
    try {
      client = new MongoClient(env.cosmosdb.connectionString, clientOptions);
      await client.connect();
      
      // Verify connection
      await client.db('admin').command({ ping: 1 });
      
      db = client.db(env.cosmosdb.databaseName);
      console.log(`Connected to CosmosDB database: ${env.cosmosdb.databaseName}`);
      
      return db;
    } catch (error) {
      // Reset state on connection failure
      client = null;
      db = null;
      connectionPromise = null;
      
      console.error('Failed to connect to CosmosDB:', error);
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  })();

  return connectionPromise;
}

/**
 * Close database connection and cleanup resources
 */
export async function closeDatabase(): Promise<void> {
  if (client) {
    try {
      await client.close();
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database connection:', error);
    } finally {
      client = null;
      db = null;
      connectionPromise = null;
    }
  }
}

/**
 * Get database instance (throws if not connected)
 */
export function getDatabase(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectToDatabase() first.');
  }
  return db;
}

/**
 * Initialize database with collections and indexes
 * Should be called during application startup
 */
export async function initializeDatabase(): Promise<void> {
  const database = await connectToDatabase();
  
  try {
    console.log('Initializing database collections and indexes...');
    
    // Create collections if they don't exist
    const collections = await database.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    const requiredCollections = [
      'specs',
      'revisions',
      'comments',
      'users',
      'traceability',
      'aiUsageLogs',
      'fileAttachments'
    ];
    
    for (const collectionName of requiredCollections) {
      if (!collectionNames.includes(collectionName)) {
        await database.createCollection(collectionName);
        console.log(`Created collection: ${collectionName}`);
      }
    }
    
    // Create indexes for specs collection
    await database.collection('specs').createIndexes([
      { key: { createdBy: 1 } },
      { key: { 'metadata.status': 1 } },
      { key: { 'metadata.type': 1 } },
      { key: { 'metadata.parentId': 1 } },
      { key: { createdAt: -1 } },
      { key: { updatedAt: -1 } },
      { key: { title: 'text', content: 'text' } }
    ]);
    
    // Create indexes for revisions collection
    await database.collection('revisions').createIndexes([
      { key: { specId: 1, version: -1 } },
      { key: { timestamp: -1 } }
    ]);
    
    // Create indexes for comments collection
    await database.collection('comments').createIndexes([
      { key: { specId: 1 } },
      { key: { parentCommentId: 1 } },
      { key: { timestamp: -1 } }
    ]);
    
    // Create indexes for users collection
    await database.collection('users').createIndexes([
      { key: { email: 1 }, unique: true },
      { key: { role: 1 } }
    ]);
    
    // Create indexes for traceability collection
    await database.collection('traceability').createIndexes([
      { key: { parentId: 1 } },
      { key: { childId: 1 } },
      { key: { parentId: 1, childId: 1 }, unique: true }
    ]);
    
    // Create indexes for AI usage logs
    await database.collection('aiUsageLogs').createIndexes([
      { key: { userId: 1, timestamp: -1 } },
      { key: { specId: 1 } },
      { key: { timestamp: -1 } }
    ]);
    
    // Create indexes for file attachments
    await database.collection('fileAttachments').createIndexes([
      { key: { specId: 1 } },
      { key: { uploadedAt: -1 } }
    ]);
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw new Error(`Failed to initialize database: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
