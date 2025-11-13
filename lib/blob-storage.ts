// Azure Blob Storage client for file attachments
import { BlobServiceClient, ContainerClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } from '@azure/storage-blob';

let blobServiceClient: BlobServiceClient | null = null;
let containerClient: ContainerClient | null = null;

/**
 * Initialize Blob Storage client
 */
function getBlobServiceClient(): BlobServiceClient {
  if (!blobServiceClient) {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    
    if (!connectionString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING is not configured');
    }
    
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  }
  
  return blobServiceClient;
}

/**
 * Get or create container client
 */
export async function getContainerClient(): Promise<ContainerClient> {
  if (!containerClient) {
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'attachments';
    const serviceClient = getBlobServiceClient();
    containerClient = serviceClient.getContainerClient(containerName);
    
    // Create container if it doesn't exist
    await containerClient.createIfNotExists({
      access: 'blob', // Private container
    });
  }
  
  return containerClient;
}

/**
 * Upload a file to Blob Storage
 */
export async function uploadFile(
  fileName: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const container = await getContainerClient();
  
  // Generate unique blob name with timestamp
  const timestamp = Date.now();
  const blobName = `${timestamp}-${fileName}`;
  
  const blockBlobClient = container.getBlockBlobClient(blobName);
  
  await blockBlobClient.upload(buffer, buffer.length, {
    blobHTTPHeaders: {
      blobContentType: contentType,
    },
  });
  
  return blobName;
}

/**
 * Generate SAS token for secure file access
 */
export async function generateSasUrl(blobName: string, expiresInHours: number = 1): Promise<string> {
  const container = await getContainerClient();
  const blockBlobClient = container.getBlockBlobClient(blobName);
  
  // Parse connection string to get account name and key
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING is not configured');
  }
  
  const accountNameMatch = connectionString.match(/AccountName=([^;]+)/);
  const accountKeyMatch = connectionString.match(/AccountKey=([^;]+)/);
  
  if (!accountNameMatch || !accountKeyMatch) {
    throw new Error('Invalid AZURE_STORAGE_CONNECTION_STRING format');
  }
  
  const accountName = accountNameMatch[1];
  const accountKey = accountKeyMatch[1];
  
  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
  
  // Set expiration time
  const expiresOn = new Date();
  expiresOn.setHours(expiresOn.getHours() + expiresInHours);
  
  // Generate SAS token
  const sasToken = generateBlobSASQueryParameters(
    {
      containerName: container.containerName,
      blobName: blobName,
      permissions: BlobSASPermissions.parse('r'), // Read-only
      expiresOn: expiresOn,
    },
    sharedKeyCredential
  ).toString();
  
  return `${blockBlobClient.url}?${sasToken}`;
}

/**
 * Delete a file from Blob Storage
 */
export async function deleteFile(blobName: string): Promise<void> {
  const container = await getContainerClient();
  const blockBlobClient = container.getBlockBlobClient(blobName);
  
  await blockBlobClient.deleteIfExists();
}

/**
 * Check if a file exists
 */
export async function fileExists(blobName: string): Promise<boolean> {
  const container = await getContainerClient();
  const blockBlobClient = container.getBlockBlobClient(blobName);
  
  return blockBlobClient.exists();
}
