/**
 * Unit Tests: Freemium Usage Tracking, Quota Calculation & Plan Rollover
 * Specification: ORIGINAL_REQUEST.md §R2 & PROJECT.md F-43
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getCurrentMonthKey,
  getExtractionUsage,
  recordExtractionUsage,
  FREE_TIER_MONTHLY_LIMIT,
  type MonetizationUserProfile,
} from './helpers/monetization-helpers.ts';

describe('Unit: Freemium Usage & Quota Engine', () => {
  describe('1. getCurrentMonthKey', () => {
    it('1.1: Generates "YYYY-MM" format for current date', () => {
      const now = new Date('2026-08-28T12:00:00Z');
      assert.strictEqual(getCurrentMonthKey(now), '2026-08');
    });

    it('1.2: Pads single digit months with leading zero (e.g. March -> "2026-03")', () => {
      const marchDate = new Date('2026-03-15T08:00:00Z');
      assert.strictEqual(getCurrentMonthKey(marchDate), '2026-03');
    });

    it('1.3: Handles end-of-year rollover (December -> "2026-12", January -> "2027-01")', () => {
      const dec = new Date('2026-12-31T23:59:59Z');
      const jan = new Date('2027-01-01T00:00:01Z');
      assert.strictEqual(getCurrentMonthKey(dec), '2026-12');
      assert.strictEqual(getCurrentMonthKey(jan), '2027-01');
    });

    it('1.4: Defaults to current system date when argument omitted', () => {
      const key = getCurrentMonthKey();
      assert.match(key, /^\d{4}-\d{2}$/);
    });

    it('1.5: Handles invalid date gracefully by returning valid current month key', () => {
      const invalidDate = new Date('invalid-date');
      const key = getCurrentMonthKey(invalidDate);
      assert.match(key, /^\d{4}-\d{2}$/);
    });
  });

  describe('2. getExtractionUsage calculation', () => {
    const mockDate = new Date('2026-08-28T12:00:00Z');

    it('2.1: New Free user starts with 0 extractions used and 5 remaining', () => {
      const profile: MonetizationUserProfile = {
        uid: 'user_1',
        email: 'free@plateup.com',
        displayName: 'Free User',
        createdAt: new Date(),
        preferences: { repeatWindowDays: 5, mealsPerDay: ['breakfast', 'lunch', 'dinner'], dietaryRestrictions: [] },
        plan: 'free',
        extractionsThisMonth: 0,
        extractionMonth: '2026-08',
      };

      const usage = getExtractionUsage(profile, mockDate);
      assert.strictEqual(usage.plan, 'free');
      assert.strictEqual(usage.used, 0);
      assert.strictEqual(usage.limit, 5);
      assert.strictEqual(usage.remaining, 5);
      assert.strictEqual(usage.isLimitReached, false);
    });

    it('2.2: Free user with 3 extractions has 2 remaining', () => {
      const profile: MonetizationUserProfile = {
        uid: 'user_2',
        email: 'free@plateup.com',
        displayName: 'Free User',
        createdAt: new Date(),
        preferences: { repeatWindowDays: 5, mealsPerDay: ['breakfast', 'lunch', 'dinner'], dietaryRestrictions: [] },
        plan: 'free',
        extractionsThisMonth: 3,
        extractionMonth: '2026-08',
      };

      const usage = getExtractionUsage(profile, mockDate);
      assert.strictEqual(usage.used, 3);
      assert.strictEqual(usage.remaining, 2);
      assert.strictEqual(usage.isLimitReached, false);
    });

    it('2.3: Free user with 5 extractions hits limit (0 remaining, isLimitReached: true)', () => {
      const profile: MonetizationUserProfile = {
        uid: 'user_3',
        email: 'free@plateup.com',
        displayName: 'Free User',
        createdAt: new Date(),
        preferences: { repeatWindowDays: 5, mealsPerDay: ['breakfast', 'lunch', 'dinner'], dietaryRestrictions: [] },
        plan: 'free',
        extractionsThisMonth: 5,
        extractionMonth: '2026-08',
      };

      const usage = getExtractionUsage(profile, mockDate);
      assert.strictEqual(usage.used, 5);
      assert.strictEqual(usage.remaining, 0);
      assert.strictEqual(usage.isLimitReached, true);
    });

    it('2.4: Free user with >= 6 extractions clamps remaining to 0 and marks limit reached', () => {
      const profile: MonetizationUserProfile = {
        uid: 'user_4',
        email: 'free@plateup.com',
        displayName: 'Free User',
        createdAt: new Date(),
        preferences: { repeatWindowDays: 5, mealsPerDay: ['breakfast', 'lunch', 'dinner'], dietaryRestrictions: [] },
        plan: 'free',
        extractionsThisMonth: 8,
        extractionMonth: '2026-08',
      };

      const usage = getExtractionUsage(profile, mockDate);
      assert.strictEqual(usage.used, 8);
      assert.strictEqual(usage.remaining, 0);
      assert.strictEqual(usage.isLimitReached, true);
    });

    it('2.5: Resets usage count on calendar month rollover (e.g. usage in 2026-07 resets in 2026-08)', () => {
      const profile: MonetizationUserProfile = {
        uid: 'user_rollover',
        email: 'rollover@plateup.com',
        displayName: 'Rollover User',
        createdAt: new Date(),
        preferences: { repeatWindowDays: 5, mealsPerDay: ['breakfast', 'lunch', 'dinner'], dietaryRestrictions: [] },
        plan: 'free',
        extractionsThisMonth: 5, // Was maxed out last month
        extractionMonth: '2026-07', // July
      };

      // Querying in August 2026
      const usage = getExtractionUsage(profile, mockDate);
      assert.strictEqual(usage.used, 0);
      assert.strictEqual(usage.remaining, 5);
      assert.strictEqual(usage.isLimitReached, false);
      assert.strictEqual(usage.extractionMonth, '2026-08');
    });

    it('2.6: Pro users have unlimited extractions (limit: Infinity, remaining: Infinity, isLimitReached: false)', () => {
      const proProfile: MonetizationUserProfile = {
        uid: 'user_pro',
        email: 'pro@plateup.com',
        displayName: 'Pro Subscriber',
        createdAt: new Date(),
        preferences: { repeatWindowDays: 5, mealsPerDay: ['breakfast', 'lunch', 'dinner'], dietaryRestrictions: [] },
        plan: 'pro',
        subscriptionId: 'sub_12345',
        extractionsThisMonth: 42,
        extractionMonth: '2026-08',
      };

      const usage = getExtractionUsage(proProfile, mockDate);
      assert.strictEqual(usage.plan, 'pro');
      assert.strictEqual(usage.used, 42);
      assert.strictEqual(usage.limit, Infinity);
      assert.strictEqual(usage.remaining, Infinity);
      assert.strictEqual(usage.isLimitReached, false);
    });

    it('2.7: Safely handles null or undefined user profile with default free tier limits', () => {
      const nullUsage = getExtractionUsage(null, mockDate);
      assert.strictEqual(nullUsage.plan, 'free');
      assert.strictEqual(nullUsage.limit, FREE_TIER_MONTHLY_LIMIT);
      assert.strictEqual(nullUsage.remaining, FREE_TIER_MONTHLY_LIMIT);
      assert.strictEqual(nullUsage.isLimitReached, false);
    });
  });

  describe('3. recordExtractionUsage mutation', () => {
    const mockDate = new Date('2026-08-28T12:00:00Z');

    it('3.1: Increments monthly count and returns updated remaining extractions for free user', () => {
      const profile: MonetizationUserProfile = {
        uid: 'user_record',
        email: 'rec@plateup.com',
        displayName: 'Rec User',
        createdAt: new Date(),
        preferences: { repeatWindowDays: 5, mealsPerDay: ['breakfast', 'lunch', 'dinner'], dietaryRestrictions: [] },
        plan: 'free',
        extractionsThisMonth: 1,
        extractionMonth: '2026-08',
      };

      const result = recordExtractionUsage(profile, mockDate);
      assert.strictEqual(result.profile.extractionsThisMonth, 2);
      assert.strictEqual(result.remaining, 3);
      assert.strictEqual(result.plan, 'free');
    });

    it('3.2: Throws an error and blocks extraction when free limit is already reached', () => {
      const profile: MonetizationUserProfile = {
        uid: 'user_blocked',
        email: 'blocked@plateup.com',
        displayName: 'Blocked User',
        createdAt: new Date(),
        preferences: { repeatWindowDays: 5, mealsPerDay: ['breakfast', 'lunch', 'dinner'], dietaryRestrictions: [] },
        plan: 'free',
        extractionsThisMonth: 5,
        extractionMonth: '2026-08',
      };

      assert.throws(() => {
        recordExtractionUsage(profile, mockDate);
      }, /Monthly extraction limit reached for Free plan/);

      // Usage count must not be incremented on blocked attempt
      assert.strictEqual(profile.extractionsThisMonth, 5);
    });

    it('3.3: Allows Pro user to extract indefinitely without throwing', () => {
      const proProfile: MonetizationUserProfile = {
        uid: 'pro_unlimited',
        email: 'unlimited@plateup.com',
        displayName: 'Unlimited Chef',
        createdAt: new Date(),
        preferences: { repeatWindowDays: 5, mealsPerDay: ['breakfast', 'lunch', 'dinner'], dietaryRestrictions: [] },
        plan: 'pro',
        subscriptionId: 'sub_pro_unlimited',
        extractionsThisMonth: 100,
        extractionMonth: '2026-08',
      };

      const result = recordExtractionUsage(proProfile, mockDate);
      assert.strictEqual(result.profile.extractionsThisMonth, 101);
      assert.strictEqual(result.remaining, Infinity);
      assert.strictEqual(result.plan, 'pro');
    });

    it('3.4: Automatically initializes new month key on first extraction of month', () => {
      const staleMonthProfile: MonetizationUserProfile = {
        uid: 'stale_user',
        email: 'stale@plateup.com',
        displayName: 'Stale Month User',
        createdAt: new Date(),
        preferences: { repeatWindowDays: 5, mealsPerDay: ['breakfast', 'lunch', 'dinner'], dietaryRestrictions: [] },
        plan: 'free',
        extractionsThisMonth: 5, // Previous month was full
        extractionMonth: '2026-07',
      };

      const result = recordExtractionUsage(staleMonthProfile, mockDate); // in August
      assert.strictEqual(result.profile.extractionsThisMonth, 1);
      assert.strictEqual(result.profile.extractionMonth, '2026-08');
      assert.strictEqual(result.remaining, 4);
    });
  });
});
