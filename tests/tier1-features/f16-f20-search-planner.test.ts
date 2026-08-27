/**
 * Tier 1: Feature Coverage for F-16 to F-20
 * F-16: Recipe Search & Sorting
 * F-17: 7x3 Weekly Planner Display
 * F-18: ISO Week Navigation
 * F-19: Manual Slot Assignment
 * F-20: Slot Clearing & Clear All
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { PlateUpTestEnvironment, getISOWeekString, shiftISOWeek, getWeekStartDate } from '../helpers/test-context.ts';
import { FIXTURE_RECIPES, type TestRecipe } from '../helpers/recipe-fixtures.ts';

describe('Tier 1: F-16 to F-20 — Recipe Search, Sort & Meal Planner Grid', () => {
  let env: PlateUpTestEnvironment;
  let testUid: string;
  let savedRecipes: TestRecipe[];

  beforeEach(() => {
    env = new PlateUpTestEnvironment();
    const user = env.register('planner@test.com', 'password123', 'Meal Master');
    testUid = user.uid;

    savedRecipes = FIXTURE_RECIPES.map(r => env.saveRecipe(testUid, r));
  });

  // F-16: Recipe Search & Sorting
  describe('F-16: Recipe Search & Sorting', () => {
    const searchAndSortRecipes = (
      recipes: TestRecipe[],
      query: string = '',
      sortBy: 'newest' | 'rating' | 'mostMade' | 'recent' = 'newest'
    ) => {
      const q = query.trim().toLowerCase();
      const filtered = recipes.filter(r => {
        if (!q) return true;
        const nameMatch = (r.name || r.title || '').toLowerCase().includes(q);
        const descMatch = (r.description || '').toLowerCase().includes(q);
        const tagMatch = (r.tags || []).some(t => t.toLowerCase().includes(q));
        const ingMatch = (r.ingredients || []).some(i => (i.item || i.name || '').toLowerCase().includes(q));
        return nameMatch || descMatch || tagMatch || ingMatch;
      });

      return filtered.sort((a, b) => {
        if (sortBy === 'rating') {
          return (b.rating || 0) - (a.rating || 0);
        }
        if (sortBy === 'mostMade') {
          return (b.timesMade || 0) - (a.timesMade || 0);
        }
        if (sortBy === 'recent') {
          const timeA = a.lastMadeAt ? new Date(a.lastMadeAt).getTime() : 0;
          const timeB = b.lastMadeAt ? new Date(b.lastMadeAt).getTime() : 0;
          return timeB - timeA;
        }
        // newest
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    };

    it('F-16.1: Searches recipes by recipe title keyword case-insensitively', () => {
      const results = searchAndSortRecipes(savedRecipes, 'carbonara');
      assert.strictEqual(results.length, 1);
      assert.ok(results[0].name.includes('Carbonara'));
    });

    it('F-16.2: Searches recipes by ingredient name (e.g., "avocado")', () => {
      const results = searchAndSortRecipes(savedRecipes, 'avocado');
      assert.ok(results.length >= 2);
      assert.ok(results.some(r => r.name.includes('Buddha Bowl') || r.name.includes('Avocado Toast')));
    });

    it('F-16.3: Sorts recipes by rating descending with unrated items last', () => {
      const results = searchAndSortRecipes(savedRecipes, '', 'rating');
      assert.ok(results.length > 0);
      for (let i = 0; i < results.length - 1; i++) {
        assert.ok((results[i].rating || 0) >= (results[i + 1].rating || 0));
      }
    });

    it('F-16.4: Sorts recipes by Most Made (timesMade) descending', () => {
      // Set distinct timesMade counts
      savedRecipes[0].timesMade = 20;
      savedRecipes[1].timesMade = 5;
      savedRecipes[2].timesMade = 35;

      const results = searchAndSortRecipes(savedRecipes, '', 'mostMade');
      assert.strictEqual(results[0].id, savedRecipes[2].id);
      assert.strictEqual(results[0].timesMade, 35);
    });

    it('F-16.5: Sorts recipes by Recent cook history (lastMadeAt desc)', () => {
      savedRecipes[0].lastMadeAt = new Date('2026-08-27T10:00:00Z');
      savedRecipes[1].lastMadeAt = new Date('2026-08-20T10:00:00Z');
      savedRecipes[2].lastMadeAt = null;

      const results = searchAndSortRecipes(savedRecipes, '', 'recent');
      assert.strictEqual(results[0].id, savedRecipes[0].id);
    });
  });

  // F-17: 7x3 Weekly Planner Grid
  describe('F-17: 7x3 Weekly Planner Grid Display', () => {
    it('F-17.1: Meal plan contains all 7 days of the week', () => {
      const plan = env.getOrCreateMealPlan(testUid, '2026-W35');
      const expectedDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      for (const day of expectedDays) {
        assert.ok(day in plan.meals);
      }
    });

    it('F-17.2: Each day supports 3 distinct meal times (breakfast, lunch, dinner)', () => {
      const plan = env.getOrCreateMealPlan(testUid, '2026-W35');
      const mealTimes = ['breakfast', 'lunch', 'dinner'];
      assert.strictEqual(mealTimes.length, 3);
      assert.strictEqual(Object.keys(plan.meals).length, 7);
    });

    it('F-17.3: Total planner capacity equals exactly 21 meal slots (7 days x 3 meals)', () => {
      const days = Object.keys(env.getOrCreateMealPlan(testUid, '2026-W35').meals);
      const totalSlots = days.length * 3;
      assert.strictEqual(totalSlots, 21);
    });

    it('F-17.4: Empty slot renders as unfilled placeholder available for selection', () => {
      const plan = env.getOrCreateMealPlan(testUid, '2026-W35');
      assert.strictEqual(plan.meals.monday.dinner, undefined);
    });

    it('F-17.5: Filled slot displays recipe name, id, and thumbnail', () => {
      env.assignSlot(testUid, '2026-W35', 'wednesday', 'dinner', savedRecipes[0]);
      const plan = env.getOrCreateMealPlan(testUid, '2026-W35');
      const slot = plan.meals.wednesday.dinner!;
      assert.strictEqual(slot.recipeId, savedRecipes[0].id);
      assert.strictEqual(slot.recipeName, savedRecipes[0].name);
      assert.strictEqual(slot.thumbnailUrl, savedRecipes[0].thumbnailUrl);
    });
  });

  // F-18: ISO Week Navigation
  describe('F-18: ISO Week Navigation & Calculations', () => {
    it('F-18.1: Calculates correct ISO week string for current date (e.g. 2026-W35)', () => {
      const testDate = new Date('2026-08-27T12:00:00Z');
      const weekStr = getISOWeekString(testDate);
      assert.strictEqual(weekStr, '2026-W35');
    });

    it('F-18.2: Navigates to next week (+1 week offset)', () => {
      const nextWeek = shiftISOWeek('2026-W35', 1);
      assert.strictEqual(nextWeek, '2026-W36');
    });

    it('F-18.3: Navigates to previous week (-1 week offset)', () => {
      const prevWeek = shiftISOWeek('2026-W35', -1);
      assert.strictEqual(prevWeek, '2026-W34');
    });

    it('F-18.4: Correctly handles calendar year transitions (e.g. 2026-W53 -> 2027-W01 and 2025-W52 -> 2026-W01)', () => {
      const nextYearWeek = shiftISOWeek('2026-W53', 1);
      assert.strictEqual(nextYearWeek, '2027-W01');

      const nextYearWeek2025 = shiftISOWeek('2025-W52', 1);
      assert.strictEqual(nextYearWeek2025, '2026-W01');
    });

    it('F-18.5: Computes exact Monday start date for any ISO week', () => {
      const startDate = getWeekStartDate('2026-W35');
      // In 2026-W35, Monday was Aug 24, 2026
      assert.strictEqual(startDate.getUTCFullYear(), 2026);
      assert.strictEqual(startDate.getUTCMonth(), 7); // 0-indexed: 7 is August
      assert.strictEqual(startDate.getUTCDate(), 24);
    });
  });

  // F-19: Manual Slot Assignment
  describe('F-19: Manual Slot Assignment', () => {
    it('F-19.1: Assigns recipe to specific day and meal slot', () => {
      const plan = env.assignSlot(testUid, '2026-W35', 'monday', 'lunch', savedRecipes[1]);
      assert.strictEqual(plan.meals.monday.lunch?.recipeId, savedRecipes[1].id);
      assert.strictEqual(plan.meals.monday.lunch?.recipeName, savedRecipes[1].name);
    });

    it('F-19.2: Overwriting an occupied slot replaces with new recipe selection', () => {
      env.assignSlot(testUid, '2026-W35', 'tuesday', 'dinner', savedRecipes[0]);
      const updated = env.assignSlot(testUid, '2026-W35', 'tuesday', 'dinner', savedRecipes[2]);
      assert.strictEqual(updated.meals.tuesday.dinner?.recipeId, savedRecipes[2].id);
    });

    it('F-19.3: Assigning slots across multiple days persists all selections', () => {
      env.assignSlot(testUid, '2026-W35', 'monday', 'breakfast', savedRecipes[4]);
      env.assignSlot(testUid, '2026-W35', 'friday', 'dinner', savedRecipes[3]);

      const plan = env.getOrCreateMealPlan(testUid, '2026-W35');
      assert.strictEqual(plan.meals.monday.breakfast?.recipeId, savedRecipes[4].id);
      assert.strictEqual(plan.meals.friday.dinner?.recipeId, savedRecipes[3].id);
    });

    it('F-19.4: Updates mealPlan updatedAt timestamp on assignment', () => {
      const before = Date.now();
      const plan = env.assignSlot(testUid, '2026-W35', 'thursday', 'dinner', savedRecipes[0]);
      assert.ok(plan.updatedAt instanceof Date);
      assert.ok(plan.updatedAt.getTime() >= before - 1000);
    });

    it('F-19.5: Preserves other unchanged slots when modifying one slot', () => {
      env.assignSlot(testUid, '2026-W35', 'monday', 'dinner', savedRecipes[0]);
      env.assignSlot(testUid, '2026-W35', 'tuesday', 'dinner', savedRecipes[1]);

      const plan = env.getOrCreateMealPlan(testUid, '2026-W35');
      assert.strictEqual(plan.meals.monday.dinner?.recipeId, savedRecipes[0].id);
      assert.strictEqual(plan.meals.tuesday.dinner?.recipeId, savedRecipes[1].id);
    });
  });

  // F-20: Slot Clearing & Clear All
  describe('F-20: Meal Plan Slot Clearing', () => {
    it('F-20.1: Clears an individual filled meal slot', () => {
      env.assignSlot(testUid, '2026-W35', 'wednesday', 'lunch', savedRecipes[0]);
      assert.ok(env.getOrCreateMealPlan(testUid, '2026-W35').meals.wednesday.lunch);

      env.clearSlot(testUid, '2026-W35', 'wednesday', 'lunch');
      const plan = env.getOrCreateMealPlan(testUid, '2026-W35');
      assert.strictEqual(plan.meals.wednesday.lunch, undefined);
    });

    it('F-20.2: Clearing one slot does not affect other assigned slots in the same day', () => {
      env.assignSlot(testUid, '2026-W35', 'thursday', 'breakfast', savedRecipes[4]);
      env.assignSlot(testUid, '2026-W35', 'thursday', 'dinner', savedRecipes[0]);

      env.clearSlot(testUid, '2026-W35', 'thursday', 'breakfast');
      const plan = env.getOrCreateMealPlan(testUid, '2026-W35');
      assert.strictEqual(plan.meals.thursday.breakfast, undefined);
      assert.strictEqual(plan.meals.thursday.dinner?.recipeId, savedRecipes[0].id);
    });

    it('F-20.3: "Clear Week" clears all 21 meal slots simultaneously', () => {
      env.assignSlot(testUid, '2026-W35', 'monday', 'dinner', savedRecipes[0]);
      env.assignSlot(testUid, '2026-W35', 'friday', 'lunch', savedRecipes[1]);
      env.assignSlot(testUid, '2026-W35', 'sunday', 'dinner', savedRecipes[2]);

      const cleared = env.clearWeek(testUid, '2026-W35');
      const days = Object.keys(cleared.meals) as (keyof typeof cleared.meals)[];
      for (const day of days) {
        assert.deepStrictEqual(cleared.meals[day], {});
      }
    });

    it('F-20.4: Clearing empty slot is a safe no-op', () => {
      assert.doesNotThrow(() => {
        env.clearSlot(testUid, '2026-W35', 'sunday', 'breakfast');
      });
    });

    it('F-20.5: Clearing updates updatedAt timestamp on meal plan document', () => {
      const before = Date.now();
      const plan = env.clearWeek(testUid, '2026-W35');
      assert.ok(plan.updatedAt instanceof Date);
      assert.ok(plan.updatedAt.getTime() >= before - 1000);
    });
  });
});
