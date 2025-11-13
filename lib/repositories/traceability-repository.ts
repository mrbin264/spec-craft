// Traceability repository for managing spec relationships
import { Filter } from 'mongodb';
import { BaseRepository } from './base-repository';
import { TraceabilityLink } from '../../types';

export class TraceabilityRepository extends BaseRepository<TraceabilityLink> {
  protected collectionName = 'traceability';
  
  /**
   * Create a new traceability link
   */
  async createLink(
    parentId: string,
    childId: string,
    createdBy: string
  ): Promise<TraceabilityLink> {
    // Check for circular dependency
    if (await this.hasCircularDependency(parentId, childId)) {
      throw new Error('Cannot create link: would create circular dependency');
    }
    
    return this.create({
      parentId,
      childId,
      createdBy,
      createdAt: new Date(),
    } as TraceabilityLink);
  }
  
  /**
   * Find all children of a spec
   */
  async findChildren(parentId: string): Promise<TraceabilityLink[]> {
    return this.find({ parentId } as Filter<TraceabilityLink>);
  }
  
  /**
   * Find all parents of a spec
   */
  async findParents(childId: string): Promise<TraceabilityLink[]> {
    return this.find({ childId } as Filter<TraceabilityLink>);
  }
  
  /**
   * Find link between two specs
   */
  async findLink(parentId: string, childId: string): Promise<TraceabilityLink | null> {
    return this.findOne({ parentId, childId } as Filter<TraceabilityLink>);
  }
  
  /**
   * Delete a traceability link
   */
  async deleteLink(parentId: string, childId: string): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ parentId, childId } as Filter<TraceabilityLink>);
    return result.deletedCount > 0;
  }
  
  /**
   * Get all descendants of a spec (recursive)
   */
  async getDescendants(specId: string): Promise<string[]> {
    const descendants = new Set<string>();
    const queue = [specId];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = await this.findChildren(currentId);
      
      for (const link of children) {
        if (!descendants.has(link.childId)) {
          descendants.add(link.childId);
          queue.push(link.childId);
        }
      }
    }
    
    return Array.from(descendants);
  }
  
  /**
   * Get all ancestors of a spec (recursive)
   */
  async getAncestors(specId: string): Promise<string[]> {
    const ancestors = new Set<string>();
    const queue = [specId];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const parents = await this.findParents(currentId);
      
      for (const link of parents) {
        if (!ancestors.has(link.parentId)) {
          ancestors.add(link.parentId);
          queue.push(link.parentId);
        }
      }
    }
    
    return Array.from(ancestors);
  }
  
  /**
   * Check if creating a link would create a circular dependency
   */
  async hasCircularDependency(parentId: string, childId: string): Promise<boolean> {
    // If child is already an ancestor of parent, adding this link would create a cycle
    const ancestors = await this.getAncestors(parentId);
    return ancestors.includes(childId);
  }
  
  /**
   * Get full traceability tree starting from a spec
   */
  async getTree(rootId: string): Promise<Map<string, string[]>> {
    const tree = new Map<string, string[]>();
    const visited = new Set<string>();
    const queue = [rootId];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      
      const children = await this.findChildren(currentId);
      const childIds = children.map(link => link.childId);
      
      tree.set(currentId, childIds);
      
      for (const childId of childIds) {
        if (!visited.has(childId)) {
          queue.push(childId);
        }
      }
    }
    
    return tree;
  }
}
