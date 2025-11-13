// Revision repository for managing spec version history
import { Filter } from 'mongodb';
import { BaseRepository } from './base-repository';
import { Revision, SpecMetadata } from '../../types';

export class RevisionRepository extends BaseRepository<Revision> {
  protected collectionName = 'revisions';
  
  /**
   * Create a new revision
   */
  async createRevision(
    specId: string,
    version: number,
    content: string,
    metadata: SpecMetadata,
    author: string
  ): Promise<Revision> {
    return this.create({
      specId,
      version,
      content,
      metadata,
      author,
      timestamp: new Date(),
    } as Revision);
  }
  
  /**
   * Find all revisions for a spec
   */
  async findBySpecId(specId: string, limit?: number): Promise<Revision[]> {
    const collection = await this.getCollection();
    let query = collection.find({ specId } as Filter<Revision>).sort({ version: -1 });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return query.toArray();
  }
  
  /**
   * Find specific revision by spec ID and version
   */
  async findByVersion(specId: string, version: number): Promise<Revision | null> {
    return this.findOne({ specId, version } as Filter<Revision>);
  }
  
  /**
   * Get latest revision for a spec
   */
  async findLatest(specId: string): Promise<Revision | null> {
    const collection = await this.getCollection();
    const revisions = await collection
      .find({ specId } as Filter<Revision>)
      .sort({ version: -1 })
      .limit(1)
      .toArray();
    
    return revisions[0] || null;
  }
  
  /**
   * Get revision count for a spec
   */
  async countBySpecId(specId: string): Promise<number> {
    return this.count({ specId } as Filter<Revision>);
  }
}
