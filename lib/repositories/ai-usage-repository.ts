// AI Usage repository for tracking token consumption
import { Filter } from 'mongodb';
import { BaseRepository } from './base-repository';
import { AIUsageLog } from '../../types';
import { trackAiUsage } from '../monitoring';

export class AIUsageRepository extends BaseRepository<AIUsageLog> {
  protected collectionName = 'aiUsageLogs';
  
  /**
   * Log AI usage
   */
  async logUsage(
    userId: string,
    specId: string,
    action: string,
    model: string,
    tokensUsed: number
  ): Promise<AIUsageLog> {
    // Calculate approximate cost based on model
    const costPerToken = model.includes('gpt-4o-mini') ? 0.00000015 : 0.0000015;
    const cost = tokensUsed * costPerToken;

    // Track AI usage for monitoring
    trackAiUsage(action, model, tokensUsed, cost, userId, specId);

    return this.create({
      userId,
      specId,
      action,
      model,
      tokensUsed,
      timestamp: new Date(),
    } as AIUsageLog);
  }
  
  /**
   * Get total tokens used by user in a date range
   */
  async getTotalTokensByUser(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const collection = await this.getCollection();
    const result = await collection.aggregate([
      {
        $match: {
          userId,
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$tokensUsed' }
        }
      }
    ]).toArray();
    
    return result[0]?.total || 0;
  }
  
  /**
   * Get total tokens used today by user
   */
  async getTodayTokensByUser(userId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    return this.getTotalTokensByUser(userId, startOfDay, endOfDay);
  }
  
  /**
   * Get usage logs for a spec
   */
  async findBySpecId(specId: string, limit?: number): Promise<AIUsageLog[]> {
    const collection = await this.getCollection();
    let query = collection.find({ specId } as Filter<AIUsageLog>).sort({ timestamp: -1 });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return query.toArray();
  }
  
  /**
   * Get usage logs for a user
   */
  async findByUserId(userId: string, limit?: number): Promise<AIUsageLog[]> {
    const collection = await this.getCollection();
    let query = collection.find({ userId } as Filter<AIUsageLog>).sort({ timestamp: -1 });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return query.toArray();
  }
  
  /**
   * Get usage statistics by model
   */
  async getUsageByModel(startDate: Date, endDate: Date): Promise<Map<string, number>> {
    const collection = await this.getCollection();
    const result = await collection.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$model',
          total: { $sum: '$tokensUsed' }
        }
      }
    ]).toArray();
    
    const stats = new Map<string, number>();
    for (const item of result) {
      stats.set(item._id, item.total);
    }
    
    return stats;
  }
}
