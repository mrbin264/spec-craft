// File Attachment repository for managing uploaded files
import { Filter } from 'mongodb';
import { BaseRepository } from './base-repository';
import { FileAttachment } from '../../types';

export class FileAttachmentRepository extends BaseRepository<FileAttachment> {
  protected collectionName = 'fileAttachments';
  
  /**
   * Create a new file attachment record
   */
  async createAttachment(
    specId: string,
    fileName: string,
    blobPath: string,
    contentType: string,
    size: number,
    uploadedBy: string
  ): Promise<FileAttachment> {
    return this.create({
      specId,
      fileName,
      blobPath,
      contentType,
      size,
      uploadedBy,
      uploadedAt: new Date(),
    } as FileAttachment);
  }
  
  /**
   * Find all attachments for a spec
   */
  async findBySpecId(specId: string): Promise<FileAttachment[]> {
    const collection = await this.getCollection();
    return collection
      .find({ specId } as Filter<FileAttachment>)
      .sort({ uploadedAt: -1 })
      .toArray();
  }
  
  /**
   * Find attachments by uploader
   */
  async findByUploader(uploadedBy: string, limit?: number): Promise<FileAttachment[]> {
    const collection = await this.getCollection();
    let query = collection.find({ uploadedBy } as Filter<FileAttachment>).sort({ uploadedAt: -1 });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return query.toArray();
  }
  
  /**
   * Get total storage used by a spec
   */
  async getTotalSizeBySpec(specId: string): Promise<number> {
    const collection = await this.getCollection();
    const result = await collection.aggregate([
      { $match: { specId } },
      { $group: { _id: null, total: { $sum: '$size' } } }
    ]).toArray();
    
    return result[0]?.total || 0;
  }
  
  /**
   * Get total storage used by a user
   */
  async getTotalSizeByUser(uploadedBy: string): Promise<number> {
    const collection = await this.getCollection();
    const result = await collection.aggregate([
      { $match: { uploadedBy } },
      { $group: { _id: null, total: { $sum: '$size' } } }
    ]).toArray();
    
    return result[0]?.total || 0;
  }
  
  /**
   * Delete all attachments for a spec
   */
  async deleteBySpecId(specId: string): Promise<number> {
    const collection = await this.getCollection();
    const result = await collection.deleteMany({ specId } as Filter<FileAttachment>);
    return result.deletedCount;
  }
}
