import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.ts';
import type { UserProfile, SubscriptionPlan } from '../types/index.ts';
import { FREE_TIER_MONTHLY_LIMIT } from '../types/index.ts';

export { FREE_TIER_MONTHLY_LIMIT };
export type { SubscriptionPlan };

export interface ExtractionUsage {
  plan: SubscriptionPlan;
  used: number;
  limit: number;
  remaining: number;
  isLimitReached: boolean;
}

/**
 * Returns the year and month key in "YYYY-MM" format (e.g. "2026-08").
 */
export function getCurrentMonthKey(date: Date = new Date()): string {
  const d = date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Computes the extraction usage, limits, and remaining quota for a given user profile.
 * Automatically resets count if the user's recorded month is different from the current month.
 */
export function getExtractionUsage(
  profile: UserProfile | null | undefined,
  currentDate: Date = new Date()
): ExtractionUsage {
  const plan: SubscriptionPlan = profile?.plan === 'pro' ? 'pro' : 'free';
  const currentMonthKey = getCurrentMonthKey(currentDate);

  if (plan === 'pro') {
    const isCurrentMonth = profile?.extractionMonth === currentMonthKey;
    const used = isCurrentMonth ? Math.max(0, profile?.extractionsThisMonth ?? 0) : 0;
    return {
      plan: 'pro',
      used,
      limit: Infinity,
      remaining: Infinity,
      isLimitReached: false,
    };
  }

  // Free Tier
  const isCurrentMonth = profile?.extractionMonth === currentMonthKey;
  const used = isCurrentMonth ? Math.max(0, profile?.extractionsThisMonth ?? 0) : 0;
  const limit = FREE_TIER_MONTHLY_LIMIT;
  const remaining = Math.max(0, limit - used);
  const isLimitReached = remaining <= 0;

  return {
    plan: 'free',
    used,
    limit,
    remaining,
    isLimitReached,
  };
}

/**
 * Atomically increments the user's monthly AI extraction count in Firestore.
 * Handles calendar month rollover by resetting the count to 1 when entering a new month.
 */
export async function recordExtractionUsage(
  userId: string,
  currentDate: Date = new Date()
): Promise<{ remaining: number; plan: SubscriptionPlan }> {
  if (!userId) {
    throw new Error('User ID is required to record extraction usage');
  }

  const currentMonthKey = getCurrentMonthKey(currentDate);
  const userRef = doc(db, 'users', userId);

  return await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists()) {
      const initialData = {
        plan: 'free' as SubscriptionPlan,
        extractionsThisMonth: 1,
        extractionMonth: currentMonthKey,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      transaction.set(userRef, initialData, { merge: true });
      return {
        remaining: Math.max(0, FREE_TIER_MONTHLY_LIMIT - 1),
        plan: 'free' as SubscriptionPlan,
      };
    }

    const data = userDoc.data();
    const plan: SubscriptionPlan = data.plan === 'pro' ? 'pro' : 'free';
    const recordedMonth = data.extractionMonth;

    let newCount: number;
    if (recordedMonth === currentMonthKey) {
      const currentCount = typeof data.extractionsThisMonth === 'number' ? data.extractionsThisMonth : 0;
      newCount = currentCount + 1;
    } else {
      // Month changed, reset count to 1 for this new extraction
      newCount = 1;
    }

    transaction.update(userRef, {
      extractionsThisMonth: newCount,
      extractionMonth: currentMonthKey,
      updatedAt: serverTimestamp(),
    });

    const remaining = plan === 'pro' ? Infinity : Math.max(0, FREE_TIER_MONTHLY_LIMIT - newCount);

    return {
      remaining,
      plan,
    };
  });
}
