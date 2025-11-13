// Comment repository for managing spec comments and discussions
import { Filter } from 'mongodb';
import { BaseRepository } from './base-repository';
import { Comment, LineRange } from '../../types';

export class CommentRepository extends BaseRepository<Comment> {
  protected collectionName = 'comments';
  
  /**
   * Create a new comment
   */
  async createComment(
    specId: string,
    author: string,
    text: string,
    lineRange: LineRange,
    mentions: string[] = [],
    parentCommentId?: string
  ): Promise<Comment> {
    return this.create({
      specId,
      author,
      text,
      lineRange,
      mentions,
      parentCommentId,
      timestamp: new Date(),
    } as Comment);
  }
  
  /**
   * Find all comments for a spec (top-level only)
   */
  async findBySpecId(specId: string): Promise<Comment[]> {
    const collection = await this.getCollection();
    return collection
      .find({ specId, parentCommentId: { $exists: false } } as Filter<Comment>)
      .sort({ timestamp: -1 })
      .toArray();
  }
  
  /**
   * Find all comments for a spec (including replies)
   */
  async findAllBySpecId(specId: string): Promise<Comment[]> {
    const collection = await this.getCollection();
    return collection
      .find({ specId } as Filter<Comment>)
      .sort({ timestamp: 1 })
      .toArray();
  }
  
  /**
   * Find replies to a comment
   */
  async findReplies(parentCommentId: string): Promise<Comment[]> {
    const collection = await this.getCollection();
    return collection
      .find({ parentCommentId } as Filter<Comment>)
      .sort({ timestamp: 1 })
      .toArray();
  }
  
  /**
   * Find comments by author
   */
  async findByAuthor(author: string, limit?: number): Promise<Comment[]> {
    return this.find({ author } as Filter<Comment>, limit);
  }
  
  /**
   * Find comments mentioning a user
   */
  async findMentioning(userId: string, limit?: number): Promise<Comment[]> {
    return this.find({ mentions: userId } as Filter<Comment>, limit);
  }
  
  /**
   * Get comment count for a spec
   */
  async countBySpecId(specId: string): Promise<number> {
    return this.count({ specId } as Filter<Comment>);
  }
}
