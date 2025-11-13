// Base repository with common CRUD operations
import { Collection, Db, Filter, ObjectId, OptionalId, UpdateFilter } from 'mongodb';
import { connectToDatabase } from '../db';
import { trackDatabaseQuery, PerformanceMonitor } from '../monitoring';

export abstract class BaseRepository<T extends { _id: string }> {
  protected abstract collectionName: string;
  
  protected async getCollection(): Promise<Collection<T>> {
    const db: Db = await connectToDatabase();
    return db.collection<T>(this.collectionName);
  }
  
  /**
   * Create a new document
   */
  async create(data: OptionalId<T>): Promise<T> {
    const monitor = new PerformanceMonitor(`${this.collectionName}.create`);
    const collection = await this.getCollection();
    const doc = {
      ...data,
      _id: data._id || new ObjectId().toString(),
    } as T;
    
    // Cast to any to bypass MongoDB's strict typing
    await collection.insertOne(doc as any);
    const metric = monitor.end();
    trackDatabaseQuery(this.collectionName, 'create', metric.duration, 1);
    return doc;
  }
  
  /**
   * Find document by ID
   */
  async findById(id: string): Promise<T | null> {
    const monitor = new PerformanceMonitor(`${this.collectionName}.findById`);
    const collection = await this.getCollection();
    const result = await collection.findOne({ _id: id } as Filter<T>);
    const metric = monitor.end();
    trackDatabaseQuery(this.collectionName, 'findById', metric.duration, result ? 1 : 0);
    return result as T | null;
  }
  
  /**
   * Find documents by filter
   */
  async find(filter: Filter<T>, limit?: number, skip?: number): Promise<T[]> {
    const monitor = new PerformanceMonitor(`${this.collectionName}.find`);
    const collection = await this.getCollection();
    let query = collection.find(filter);
    
    if (skip) {
      query = query.skip(skip);
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const results = await query.toArray();
    const metric = monitor.end();
    trackDatabaseQuery(this.collectionName, 'find', metric.duration, results.length);
    return results as T[];
  }
  
  /**
   * Find one document by filter
   */
  async findOne(filter: Filter<T>): Promise<T | null> {
    const collection = await this.getCollection();
    const result = await collection.findOne(filter);
    return result as T | null;
  }
  
  /**
   * Update document by ID
   */
  async updateById(id: string, update: UpdateFilter<T> | Partial<T>): Promise<T | null> {
    const monitor = new PerformanceMonitor(`${this.collectionName}.updateById`);
    const collection = await this.getCollection();
    
    const updateDoc = '$set' in update ? update : { $set: update };
    
    const result = await collection.findOneAndUpdate(
      { _id: id } as Filter<T>,
      updateDoc as UpdateFilter<T>,
      { returnDocument: 'after' }
    );
    
    const metric = monitor.end();
    trackDatabaseQuery(this.collectionName, 'updateById', metric.duration, result ? 1 : 0);
    return result as T | null;
  }
  
  /**
   * Delete document by ID
   */
  async deleteById(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ _id: id } as Filter<T>);
    return result.deletedCount > 0;
  }
  
  /**
   * Count documents matching filter
   */
  async count(filter: Filter<T> = {}): Promise<number> {
    const collection = await this.getCollection();
    return collection.countDocuments(filter);
  }
  
  /**
   * Check if document exists
   */
  async exists(filter: Filter<T>): Promise<boolean> {
    const count = await this.count(filter);
    return count > 0;
  }

  /**
   * Find documents with pagination support
   */
  async findPaginated(
    filter: Filter<T>,
    page: number = 1,
    limit: number = 20,
    sortField: keyof T = '_id' as keyof T,
    sortOrder: 1 | -1 = -1
  ): Promise<{ data: T[]; total: number; page: number; limit: number }> {
    const monitor = new PerformanceMonitor(`${this.collectionName}.findPaginated`);
    const collection = await this.getCollection();
    
    const skip = (page - 1) * limit;
    
    // Execute count and find in parallel for better performance
    const [total, data] = await Promise.all([
      collection.countDocuments(filter),
      collection
        .find(filter)
        .sort({ [sortField]: sortOrder } as any)
        .skip(skip)
        .limit(limit)
        .toArray(),
    ]);
    
    const metric = monitor.end();
    trackDatabaseQuery(this.collectionName, 'findPaginated', metric.duration, data.length);
    
    return {
      data: data as T[],
      total,
      page,
      limit,
    };
  }

  /**
   * Find documents with cursor-based pagination (more efficient for large datasets)
   */
  async findCursorPaginated(
    filter: Filter<T>,
    limit: number = 20,
    cursor?: string,
    sortField: keyof T = '_id' as keyof T,
    sortOrder: 1 | -1 = -1
  ): Promise<{ data: T[]; hasNext: boolean; nextCursor?: string }> {
    const monitor = new PerformanceMonitor(`${this.collectionName}.findCursorPaginated`);
    const collection = await this.getCollection();
    
    // Build filter with cursor
    let cursorFilter = { ...filter };
    if (cursor) {
      // Decode cursor to get the last ID
      try {
        const decoded = Buffer.from(cursor, 'base64url').toString('utf-8');
        const { id } = JSON.parse(decoded);
        
        // Add cursor condition based on sort order
        if (sortOrder === -1) {
          cursorFilter = { ...filter, [sortField]: { $lt: id } } as Filter<T>;
        } else {
          cursorFilter = { ...filter, [sortField]: { $gt: id } } as Filter<T>;
        }
      } catch {
        // Invalid cursor, ignore it
      }
    }
    
    // Fetch one extra to check if there are more results
    const data = await collection
      .find(cursorFilter)
      .sort({ [sortField]: sortOrder } as any)
      .limit(limit + 1)
      .toArray();
    
    const hasNext = data.length > limit;
    const items = hasNext ? data.slice(0, limit) : data;
    
    let nextCursor: string | undefined;
    if (hasNext && items.length > 0) {
      const lastItem = items[items.length - 1];
      const cursorData = { id: (lastItem as any)[sortField] };
      nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64url');
    }
    
    const metric = monitor.end();
    trackDatabaseQuery(this.collectionName, 'findCursorPaginated', metric.duration, items.length);
    
    return {
      data: items as T[],
      hasNext,
      nextCursor,
    };
  }
}
