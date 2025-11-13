// Spec repository for managing specification documents
import { Filter } from 'mongodb';
import { BaseRepository } from './base-repository';
import { Spec, SpecMetadata, WorkflowStage, SpecType } from '../../types';
import { queryCache, generateQueryKey } from '../query-cache';
import { PaginatedResult, normalizePaginationParams, createPaginatedResult } from '../pagination';

export class SpecRepository extends BaseRepository<Spec> {
  protected collectionName = 'specs';
  
  /**
   * Create a new spec with initial metadata
   * Invalidates list caches
   */
  async createSpec(
    title: string,
    content: string,
    metadata: SpecMetadata,
    createdBy: string
  ): Promise<Spec> {
    // Invalidate list caches
    queryCache.deletePattern(`specs:findPaginated:.*`);
    
    const now = new Date();
    
    return this.create({
      title,
      content,
      metadata,
      createdBy,
      createdAt: now,
      updatedBy: createdBy,
      updatedAt: now,
      currentVersion: 1,
    } as Spec);
  }
  
  /**
   * Update spec content and metadata
   * Invalidates caches
   */
  async updateSpec(
    id: string,
    content: string,
    metadata: SpecMetadata,
    updatedBy: string
  ): Promise<Spec | null> {
    // Invalidate caches
    queryCache.deletePattern(`specs:.*`);
    queryCache.delete(`spec:${id}`);
    
    const spec = await this.findById(id);
    if (!spec) return null;
    
    return this.updateById(id, {
      content,
      metadata,
      title: metadata.title,
      updatedBy,
      updatedAt: new Date(),
      currentVersion: spec.currentVersion + 1,
    });
  }
  
  /**
   * Find specs by creator
   */
  async findByCreator(userId: string, limit?: number): Promise<Spec[]> {
    return this.find({ createdBy: userId } as Filter<Spec>, limit);
  }
  
  /**
   * Find specs by status
   */
  async findByStatus(status: WorkflowStage, limit?: number): Promise<Spec[]> {
    return this.find({ 'metadata.status': status } as Filter<Spec>, limit);
  }
  
  /**
   * Find specs by type
   */
  async findByType(type: SpecType, limit?: number): Promise<Spec[]> {
    return this.find({ 'metadata.type': type } as Filter<Spec>, limit);
  }
  
  /**
   * Find child specs (specs with a specific parent)
   */
  async findChildren(parentId: string): Promise<Spec[]> {
    return this.find({ 'metadata.parentId': parentId } as Filter<Spec>);
  }
  
  /**
   * Search specs by text
   */
  async search(searchText: string, limit: number = 20): Promise<Spec[]> {
    return this.find(
      { $text: { $search: searchText } } as Filter<Spec>,
      limit
    );
  }
  
  /**
   * Transition spec to new workflow stage
   */
  async transitionStage(id: string, newStage: WorkflowStage, updatedBy: string): Promise<Spec | null> {
    const spec = await this.findById(id);
    if (!spec) return null;
    
    // Invalidate caches when updating
    queryCache.deletePattern(`specs:.*`);
    
    return this.updateById(id, {
      'metadata.status': newStage,
      updatedBy,
      updatedAt: new Date(),
    });
  }

  /**
   * Find specs with pagination and caching
   */
  async findSpecsPaginated(
    filters: {
      status?: WorkflowStage;
      type?: SpecType;
      createdBy?: string;
    },
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<Spec>> {
    const { page: normalizedPage, limit: normalizedLimit, skip } = normalizePaginationParams({ page, limit });
    
    // Generate cache key
    const cacheKey = generateQueryKey('specs', 'findPaginated', {
      ...filters,
      page: normalizedPage,
      limit: normalizedLimit,
    });
    
    // Try to get from cache
    return queryCache.cached(
      cacheKey,
      async () => {
        // Build filter
        const filter: Filter<Spec> = {};
        if (filters.status) {
          filter['metadata.status'] = filters.status;
        }
        if (filters.type) {
          filter['metadata.type'] = filters.type;
        }
        if (filters.createdBy) {
          filter.createdBy = filters.createdBy;
        }
        
        // Execute query with pagination
        const result = await this.findPaginated(
          filter,
          normalizedPage,
          normalizedLimit,
          'updatedAt' as keyof Spec,
          -1
        );
        
        return createPaginatedResult(
          result.data,
          result.total,
          normalizedPage,
          normalizedLimit
        );
      },
      120 // Cache for 2 minutes
    );
  }
}
