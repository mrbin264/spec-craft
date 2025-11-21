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
    const revisions = await collection.find({ specId } as Filter<Revision>).toArray();
    
    // Sort in memory (Cosmos DB indexing limitation)
    revisions.sort((a, b) => b.version - a.version);
    
    if (limit) {
      return revisions.slice(0, limit);
    }
    
    return revisions;
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
      .toArray();
    
    // Sort in memory (Cosmos DB indexing limitation)
    if (revisions.length === 0) return null;
    revisions.sort((a, b) => b.version - a.version);
    
    return revisions[0];
  }
  
  /**
   * Get revision count for a spec
   */
  async countBySpecId(specId: string): Promise<number> {
    return this.count({ specId } as Filter<Revision>);
  }
}
