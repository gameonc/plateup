'use client';

import { useMemo, useCallback } from 'react';
import { useProfile } from './useProfile';
import { useAuth } from './useAuth';
import { getExtractionUsage, recordExtractionUsage, SubscriptionPlan, FREE_TIER_MONTHLY_LIMIT } from '@/lib/usage';

export function useUsage() {
  const { user } = useAuth();
  const { profile, loading } = useProfile();

  const usage = useMemo(() => {
    return getExtractionUsage(profile);
  }, [profile]);

  const recordUsage = useCallback(async () => {
    if (!user?.uid) {
      return {
        remaining: Math.max(0, FREE_TIER_MONTHLY_LIMIT - 1),
        plan: 'free' as SubscriptionPlan,
      };
    }
    return await recordExtractionUsage(user.uid);
  }, [user]);

  return {
    plan: usage.plan,
    extractionsThisMonth: usage.used,
    used: usage.used,
    limit: usage.limit,
    remaining: usage.remaining,
    isLimitReached: usage.isLimitReached,
    loading,
    recordUsage,
    profile,
  };
}
