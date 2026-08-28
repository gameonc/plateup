/**
 * Milestone 2 Unit Tests: Freemium Tier System & Usage Tracking
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getCurrentMonthKey,
  getExtractionUsage,
  FREE_TIER_MONTHLY_LIMIT,
} from '../src/lib/usage.ts';
import type { UserProfile, SubscriptionPlan } from '../src/types/index.ts';

describe('Milestone 2: Unit Tests — Freemium Tier & Usage Tracking', () => {
  describe('Month Key Generation (getCurrentMonthKey)', () => {
    it('formats date to standard YYYY-MM format', () => {
      const d1 = new Date('2026-08-28T12:00:00Z');
      assert.strictEqual(getCurrentMonthKey(d1), '2026-08');

      const d2 = new Date('2026-01-05T08:00:00Z');
      assert.strictEqual(getCurrentMonthKey(d2), '2026-01');

      const d3 = new Date('2026-12-31T23:59:59Z');
      assert.strictEqual(getCurrentMonthKey(d3), '2026-12');
    });

    it('handles leap years and boundary dates correctly', () => {
      const leapDay = new Date('2028-02-29T10:00:00Z');
      assert.strictEqual(getCurrentMonthKey(leapDay), '2028-02');
    });

    it('handles year transitions across December and January', () => {
      const dec31 = new Date('2026-12-31T23:59:59Z');
      const jan1 = new Date('2027-01-01T00:00:00Z');
      assert.strictEqual(getCurrentMonthKey(dec31), '2026-12');
      assert.strictEqual(getCurrentMonthKey(jan1), '2027-01');
    });

    it('defaults to current date when no argument is passed', () => {
      const now = new Date();
      const expected = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
      assert.strictEqual(getCurrentMonthKey(), expected);
    });
  });

  describe('Usage & Quota Calculation (getExtractionUsage)', () => {
    const fixedDate = new Date('2026-08-15T12:00:00Z');
    const currentMonthKey = '2026-08';

    it('exports FREE_TIER_MONTHLY_LIMIT as 5', () => {
      assert.strictEqual(FREE_TIER_MONTHLY_LIMIT, 5);
    });

    it('handles null or undefined profile with safe free tier defaults', () => {
      const nullUsage = getExtractionUsage(null, fixedDate);
      assert.strictEqual(nullUsage.plan, 'free');
      assert.strictEqual(nullUsage.used, 0);
      assert.strictEqual(nullUsage.limit, 5);
      assert.strictEqual(nullUsage.remaining, 5);
      assert.strictEqual(nullUsage.isLimitReached, false);

      const undefUsage = getExtractionUsage(undefined, fixedDate);
      assert.strictEqual(undefUsage.plan, 'free');
      assert.strictEqual(undefUsage.used, 0);
      assert.strictEqual(undefUsage.limit, 5);
      assert.strictEqual(undefUsage.remaining, 5);
      assert.strictEqual(undefUsage.isLimitReached, false);
    });

    it('correctly tracks partial usage for free tier in current month', () => {
      const profile: UserProfile = {
        displayName: 'Alice',
        email: 'alice@example.com',
        plan: 'free',
        extractionsThisMonth: 3,
        extractionMonth: currentMonthKey,
        preferences: {
          repeatWindowDays: 5,
          mealsPerDay: ['breakfast', 'lunch', 'dinner'],
          dietaryRestrictions: [],
        },
        createdAt: new Date(),
      };

      const usage = getExtractionUsage(profile, fixedDate);
      assert.strictEqual(usage.plan, 'free');
      assert.strictEqual(usage.used, 3);
      assert.strictEqual(usage.limit, 5);
      assert.strictEqual(usage.remaining, 2);
      assert.strictEqual(usage.isLimitReached, false);
    });

    it('flags limit reached when free tier user consumes exactly 5 extractions', () => {
      const profile: UserProfile = {
        displayName: 'Bob',
        email: 'bob@example.com',
        plan: 'free',
        extractionsThisMonth: 5,
        extractionMonth: currentMonthKey,
        preferences: {
          repeatWindowDays: 5,
          mealsPerDay: ['breakfast', 'lunch', 'dinner'],
          dietaryRestrictions: [],
        },
        createdAt: new Date(),
      };

      const usage = getExtractionUsage(profile, fixedDate);
      assert.strictEqual(usage.plan, 'free');
      assert.strictEqual(usage.used, 5);
      assert.strictEqual(usage.limit, 5);
      assert.strictEqual(usage.remaining, 0);
      assert.strictEqual(usage.isLimitReached, true);
    });

    it('clamps remaining to 0 and marks limit reached if extractions exceed limit', () => {
      const profile: UserProfile = {
        displayName: 'Charlie',
        email: 'charlie@example.com',
        plan: 'free',
        extractionsThisMonth: 9,
        extractionMonth: currentMonthKey,
        preferences: {
          repeatWindowDays: 5,
          mealsPerDay: ['breakfast', 'lunch', 'dinner'],
          dietaryRestrictions: [],
        },
        createdAt: new Date(),
      };

      const usage = getExtractionUsage(profile, fixedDate);
      assert.strictEqual(usage.plan, 'free');
      assert.strictEqual(usage.used, 9);
      assert.strictEqual(usage.remaining, 0);
      assert.strictEqual(usage.isLimitReached, true);
    });

    it('automatically resets usage when entering a new calendar month', () => {
      const profileFromLastMonth: UserProfile = {
        displayName: 'Diana',
        email: 'diana@example.com',
        plan: 'free',
        extractionsThisMonth: 5, // used all 5 last month
        extractionMonth: '2026-07', // July
        preferences: {
          repeatWindowDays: 5,
          mealsPerDay: ['breakfast', 'lunch', 'dinner'],
          dietaryRestrictions: [],
        },
        createdAt: new Date(),
      };

      // Current date is in August
      const usage = getExtractionUsage(profileFromLastMonth, fixedDate);
      assert.strictEqual(usage.plan, 'free');
      assert.strictEqual(usage.used, 0); // Reset to 0 in new month
      assert.strictEqual(usage.limit, 5);
      assert.strictEqual(usage.remaining, 5);
      assert.strictEqual(usage.isLimitReached, false);
    });

    it('handles year rollover (e.g. December to January)', () => {
      const profileFromDec: UserProfile = {
        displayName: 'Eve',
        email: 'eve@example.com',
        plan: 'free',
        extractionsThisMonth: 5,
        extractionMonth: '2026-12',
        preferences: {
          repeatWindowDays: 5,
          mealsPerDay: ['breakfast', 'lunch', 'dinner'],
          dietaryRestrictions: [],
        },
        createdAt: new Date(),
      };

      const janDate = new Date('2027-01-10T12:00:00Z');
      const usage = getExtractionUsage(profileFromDec, janDate);
      assert.strictEqual(usage.plan, 'free');
      assert.strictEqual(usage.used, 0);
      assert.strictEqual(usage.remaining, 5);
      assert.strictEqual(usage.isLimitReached, false);
    });

    it('gives Pro users unlimited extractions regardless of count', () => {
      const proProfile: UserProfile = {
        displayName: 'Pro Chef',
        email: 'pro@example.com',
        plan: 'pro',
        subscriptionId: 'sub_123456789',
        subscriptionStatus: 'active',
        extractionsThisMonth: 42,
        extractionMonth: currentMonthKey,
        preferences: {
          repeatWindowDays: 5,
          mealsPerDay: ['breakfast', 'lunch', 'dinner'],
          dietaryRestrictions: [],
        },
        createdAt: new Date(),
      };

      const usage = getExtractionUsage(proProfile, fixedDate);
      assert.strictEqual(usage.plan, 'pro');
      assert.strictEqual(usage.used, 42);
      assert.strictEqual(usage.limit, Infinity);
      assert.strictEqual(usage.remaining, Infinity);
      assert.strictEqual(usage.isLimitReached, false);
    });

    it('handles missing extractionMonth gracefully', () => {
      const legacyProfile: UserProfile = {
        displayName: 'Legacy User',
        email: 'legacy@example.com',
        preferences: {
          repeatWindowDays: 5,
          mealsPerDay: ['breakfast', 'lunch', 'dinner'],
          dietaryRestrictions: [],
        },
        createdAt: new Date(),
      };

      const usage = getExtractionUsage(legacyProfile, fixedDate);
      assert.strictEqual(usage.plan, 'free');
      assert.strictEqual(usage.used, 0);
      assert.strictEqual(usage.remaining, 5);
      assert.strictEqual(usage.isLimitReached, false);
    });

    it('handles negative or corrupt extraction numbers safely', () => {
      const corruptProfile = {
        displayName: 'Corrupt',
        email: 'corrupt@example.com',
        plan: 'free' as SubscriptionPlan,
        extractionsThisMonth: -3,
        extractionMonth: currentMonthKey,
        preferences: {
          repeatWindowDays: 5,
          mealsPerDay: ['breakfast' as const],
          dietaryRestrictions: [],
        },
        createdAt: new Date(),
      };

      const usage = getExtractionUsage(corruptProfile, fixedDate);
      assert.strictEqual(usage.used, 0);
      assert.strictEqual(usage.remaining, 5);
      assert.strictEqual(usage.isLimitReached, false);
    });
  });
});
