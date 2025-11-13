// AI quota and rate limiting service
import { AIUsageRepository } from './repositories/ai-usage-repository';
import { env } from './env';

export interface QuotaInfo {
  dailyLimit: number;
  used: number;
  remaining: number;
  resetsAt: Date;
}

/**
 * Check if user has exceeded daily quota
 */
export async function checkQuota(userId: string): Promise<QuotaInfo> {
  const aiUsageRepo = new AIUsageRepository();
  const used = await aiUsageRepo.getTodayTokensByUser(userId);
  const dailyLimit = env.app.aiDailyTokenQuota;
  
  // Calculate when quota resets (midnight)
  const resetsAt = new Date();
  resetsAt.setHours(24, 0, 0, 0);
  
  return {
    dailyLimit,
    used,
    remaining: Math.max(0, dailyLimit - used),
    resetsAt,
  };
}

/**
 * Check if user can use specified number of tokens
 */
export async function canUseTokens(userId: string, tokensNeeded: number): Promise<boolean> {
  const quota = await checkQuota(userId);
  return quota.remaining >= tokensNeeded;
}

/**
 * Record AI usage
 */
export async function recordUsage(
  userId: string,
  specId: string,
  action: string,
  model: string,
  tokensUsed: number
): Promise<void> {
  const aiUsageRepo = new AIUsageRepository();
  await aiUsageRepo.logUsage(userId, specId, action, model, tokensUsed);
}

/**
 * Enforce quota before AI request
 */
export async function enforceQuota(userId: string, estimatedTokens: number): Promise<void> {
  const canUse = await canUseTokens(userId, estimatedTokens);
  
  if (!canUse) {
    const quota = await checkQuota(userId);
    throw new Error(
      `Daily token quota exceeded. Used ${quota.used}/${quota.dailyLimit} tokens. ` +
      `Quota resets at ${quota.resetsAt.toLocaleTimeString()}.`
    );
  }
}
