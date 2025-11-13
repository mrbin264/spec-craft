// Environment variable configuration and validation

export const env = {
  // CosmosDB
  cosmosdb: {
    connectionString: process.env.COSMOSDB_CONNECTION_STRING || '',
    databaseName: process.env.COSMOSDB_DATABASE_NAME || 'speccraft',
  },
  
  // Azure Blob Storage
  storage: {
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
    containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'attachments',
  },
  
  // Azure OpenAI
  openai: {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
    apiKey: process.env.AZURE_OPENAI_API_KEY || '',
    deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o-mini',
  },
  
  // Azure AD
  azureAd: {
    clientId: process.env.AZURE_AD_CLIENT_ID || '',
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
    tenantId: process.env.AZURE_AD_TENANT_ID || '',
  },
  
  // NextAuth
  nextAuth: {
    secret: process.env.NEXTAUTH_SECRET || '',
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
  
  // Application
  app: {
    aiDailyTokenQuota: parseInt(process.env.AI_DAILY_TOKEN_QUOTA || '100000', 10),
  },
} as const;
