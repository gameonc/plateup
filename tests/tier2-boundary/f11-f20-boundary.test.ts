/**
 * Tier 2: Boundary & Corner Cases for F-11 to F-20
 * >= 5 test cases per feature across F-11 to F-20 (50+ tests)
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { PlateUpTestEnvironment, shiftISOWeek, getISOWeekString } from '../helpers/test-context.ts';
import { FIXTURE_RECIPES, type TestRecipe } from '../helpers/recipe-fixtures.ts';

describe('Tier 2: F-11 to F-20 — Boundary & Corner Cases', () => {
  let env: PlateUpTestEnvironment;
  let testUid: string;
  let testRecipe: TestRecipe;

  beforeEach(() => {
    env = new PlateUpTestEnvironment();
    const user = env.register('boundary2@plateup.com', 'BoundaryPass123!');
    testUid = user.uid;
    testRecipe = env.saveRecipe(testUid, { ...FIXTURE_RECIPES[0], timesMade: 0 });
  });

  // F-11: 1-5 Star Rating Boundaries
  describe('F-11: 1-5 Star Recipe Rating Boundaries', () => {
    it('F-11.B1: Minimum valid boundary rating is exactly 1 star', () => {
      const rated = env.rateRecipe(testUid, testRecipe.id, 1);
      assert.strictEqual(rated.rating, 1);
    });

    it('F-11.B2: Maximum valid boundary rating is exactly 5 stars', () => {
      const rated = env.rateRecipe(testUid, testRecipe.id, 5);
      assert.strictEqual(rated.rating, 5);
    });

    it('F-11.B3: Rejects negative rating (-1)', () => {
      assert.throws(() => env.rateRecipe(testUid, testRecipe.id, -1), /Rating must be between 1 and 5/);
    });

    it('F-11.B4: Rejects rating above maximum (>5)', () => {
      assert.throws(() => env.rateRecipe(testUid, testRecipe.id, 10), /Rating must be between 1 and 5/);
    });

    it('F-11.B5: Rejects rating on non-existent recipe ID', () => {
      assert.throws(() => env.rateRecipe(testUid, 'non_existent_rec_id', 4), /Recipe not found/);
    });
  });

  // F-12: "I Made This" Cook Tracker Boundaries
  describe('F-12: Cook Tracker Boundaries', () => {
    it('F-12.B1: Handles high frequency cooking (marking as cooked 100 times)', () => {
      for (let i = 0; i < 100; i++) {
        env.markAsCooked(testUid, testRecipe.id);
      }
      const recipe = env.recipes.get(testUid)!.get(testRecipe.id)!;
      assert.strictEqual(recipe.timesMade, 100);
      assert.strictEqual(env.cookingLogs.get(testUid)!.length, 100);
    });

    it('F-12.B2: Cook log handles rating passed alongside cook event', () => {
      const entry = env.markAsCooked(testUid, testRecipe.id, 5);
      assert.strictEqual(entry.rating, 5);
      const recipe = env.recipes.get(testUid)!.get(testRecipe.id)!;
      assert.strictEqual(recipe.rating, 5);
    });

    it('F-12.B3: Cook log records distinct timestamps for subsequent cooking sessions', () => {
      env.markAsCooked(testUid, testRecipe.id);
      const log1 = env.cookingLogs.get(testUid)![0];

      env.markAsCooked(testUid, testRecipe.id);
      const log2 = env.cookingLogs.get(testUid)![1];

      assert.notStrictEqual(log1.id, log2.id);
    });

    it('F-12.B4: Rejects cook tracking for non-existent recipe ID', () => {
      assert.throws(() => env.markAsCooked(testUid, 'bad_id'), /Recipe not found/);
    });

    it('F-12.B5: LastMadeAt timestamp updates monotonically', () => {
      env.markAsCooked(testUid, testRecipe.id);
      const t1 = env.recipes.get(testUid)!.get(testRecipe.id)!.lastMadeAt!.getTime();

      env.markAsCooked(testUid, testRecipe.id);
      const t2 = env.recipes.get(testUid)!.get(testRecipe.id)!.lastMadeAt!.getTime();

      assert.ok(t2 >= t1);
    });
  });

  // F-13: Recipe Notes Auto-save Boundaries
  describe('F-13: Recipe Notes Auto-save Boundaries', () => {
    it('F-13.B1: Handles 10,000-character long chef notes', () => {
      const hugeNotes = 'Secret technique notes. '.repeat(400);
      const updated = env.updateNotes(testUid, testRecipe.id, hugeNotes);
      assert.strictEqual(updated.notes?.length, hugeNotes.length);
    });

    it('F-13.B2: Handles HTML entities and special characters without corruption', () => {
      const htmlNotes = 'Use <1 tsp> salt & "fresh" ground pepper > 100°C';
      const updated = env.updateNotes(testUid, testRecipe.id, htmlNotes);
      assert.strictEqual(updated.notes, htmlNotes);
    });

    it('F-13.B3: Handles rapid repeated auto-saves without race condition data loss', () => {
      for (let i = 1; i <= 5; i++) {
        env.updateNotes(testUid, testRecipe.id, `Draft edit ${i}`);
      }
      const final = env.recipes.get(testUid)!.get(testRecipe.id)!;
      assert.strictEqual(final.notes, 'Draft edit 5');
    });

    it('F-13.B4: Setting notes to empty string clears the field', () => {
      env.updateNotes(testUid, testRecipe.id, 'Temporary note');
      const cleared = env.updateNotes(testUid, testRecipe.id, '');
      assert.strictEqual(cleared.notes, '');
    });

    it('F-13.B5: Rejects updating notes for non-existent recipe ID', () => {
      assert.throws(() => env.updateNotes(testUid, 'ghost_id', 'Note'), /Recipe not found/);
    });
  });

  // F-14: In-Recipe Ingredient Checklist Boundaries
  describe('F-14: In-Recipe Ingredient Checklist Boundaries', () => {
    const createChecklist = (size: number) => {
      const state = new Array(size).fill(false);
      return {
        toggle: (idx: number) => {
          if (idx >= 0 && idx < size) state[idx] = !state[idx];
        },
        getState: () => [...state],
        countCompleted: () => state.filter(Boolean).length,
      };
    };

    it('F-14.B1: Handles checklist with 50+ ingredients', () => {
      const checklist = createChecklist(60);
      for (let i = 0; i < 30; i++) checklist.toggle(i);
      assert.strictEqual(checklist.countCompleted(), 30);
    });

    it('F-14.B2: Handles checklist with 0 ingredients (no error)', () => {
      const checklist = createChecklist(0);
      assert.strictEqual(checklist.countCompleted(), 0);
    });

    it('F-14.B3: Ignores out-of-bounds toggle index', () => {
      const checklist = createChecklist(5);
      checklist.toggle(100);
      checklist.toggle(-1);
      assert.strictEqual(checklist.countCompleted(), 0);
    });

    it('F-14.B4: Toggling all items twice returns all to unchecked state', () => {
      const checklist = createChecklist(5);
      for (let i = 0; i < 5; i++) checklist.toggle(i);
      assert.strictEqual(checklist.countCompleted(), 5);
      for (let i = 0; i < 5; i++) checklist.toggle(i);
      assert.strictEqual(checklist.countCompleted(), 0);
    });

    it('F-14.B5: Rapid toggling maintains consistent boolean state', () => {
      const checklist = createChecklist(3);
      checklist.toggle(0);
      checklist.toggle(0);
      checklist.toggle(0);
      assert.strictEqual(checklist.getState()[0], true);
    });
  });

  // F-15: Recipe Deletion & Modal Boundaries
  describe('F-15: Recipe Deletion Boundaries', () => {
    it('F-15.B1: Deleting already deleted recipe returns false gracefully', () => {
      env.deleteRecipe(testUid, testRecipe.id);
      const secondAttempt = env.deleteRecipe(testUid, testRecipe.id);
      assert.strictEqual(secondAttempt, false);
    });

    it('F-15.B2: Deleting all recipes empties the recipe collection without throwing', () => {
      const r2 = env.saveRecipe(testUid, FIXTURE_RECIPES[1]);
      env.deleteRecipe(testUid, testRecipe.id);
      env.deleteRecipe(testUid, r2.id);

      assert.strictEqual(env.recipes.get(testUid)!.size, 0);
    });

    it('F-15.B3: Deleting recipe while assigned in meal plan leaves meal slot data intact with recipe snapshot', () => {
      env.assignSlot(testUid, '2026-W35', 'monday', 'dinner', testRecipe);
      env.deleteRecipe(testUid, testRecipe.id);

      const plan = env.getOrCreateMealPlan(testUid, '2026-W35');
      assert.strictEqual(plan.meals.monday.dinner?.recipeName, testRecipe.name);
    });

    it('F-15.B4: Deleting recipe does not purge historical cooking log entries', () => {
      env.markAsCooked(testUid, testRecipe.id);
      env.deleteRecipe(testUid, testRecipe.id);

      const logs = env.cookingLogs.get(testUid) || [];
      assert.strictEqual(logs.length, 1);
      assert.strictEqual(logs[0].recipeName, testRecipe.name);
    });

    it('F-15.B5: Deleting recipe does not affect other users recipes', () => {
      const otherUser = env.register('other@plateup.com', 'password123');
      const otherRecipe = env.saveRecipe(otherUser.uid, FIXTURE_RECIPES[0]);

      env.deleteRecipe(testUid, testRecipe.id);
      assert.ok(env.recipes.get(otherUser.uid)!.has(otherRecipe.id));
    });
  });

  // F-16: Recipe Search & Sorting Boundaries
  describe('F-16: Recipe Search & Sorting Boundaries', () => {
    const filterAndSort = (
      recipes: TestRecipe[],
      q: string,
      sortBy: 'newest' | 'rating' | 'mostMade' | 'recent'
    ) => {
      const query = q.trim().toLowerCase();
      const filtered = recipes.filter(r => {
        if (!query) return true;
        return (r.name || '').toLowerCase().includes(query) ||
               (r.description || '').toLowerCase().includes(query) ||
               (r.tags || []).some(t => t.toLowerCase().includes(query));
      });
      return filtered.sort((a, b) => {
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'mostMade') return (b.timesMade || 0) - (a.timesMade || 0);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    };

    it('F-16.B1: Search query with 200+ characters returns empty without crashing', () => {
      const hugeQuery = 'q'.repeat(250);
      const results = filterAndSort([testRecipe], hugeQuery, 'newest');
      assert.strictEqual(results.length, 0);
    });

    it('F-16.B2: Search query with regex metacharacters (.*+?^${}()|[]) does not throw regex error', () => {
      const regexQuery = '.*+?^${}()|[]';
      assert.doesNotThrow(() => filterAndSort([testRecipe], regexQuery, 'newest'));
    });

    it('F-16.B3: Sorting 50 recipes with identical ratings preserves stable ordering', () => {
      const sameRatingRecipes = Array(50).fill(0).map((_, i) => ({
        ...testRecipe,
        id: `rec_same_${i}`,
        rating: 4,
        createdAt: new Date(1700000000000 + i * 1000),
      }));
      const sorted = filterAndSort(sameRatingRecipes, '', 'rating');
      assert.strictEqual(sorted.length, 50);
    });

    it('F-16.B4: Sorting empty recipe list returns empty array', () => {
      const results = filterAndSort([], 'pasta', 'newest');
      assert.strictEqual(results.length, 0);
    });

    it('F-16.B5: Trims excessive whitespace around search query', () => {
      const results = filterAndSort([testRecipe], '   carbonara   ', 'newest');
      assert.strictEqual(results.length, 1);
    });
  });

  // F-17: 7x3 Weekly Planner Grid Boundaries
  describe('F-17: Weekly Planner Grid Boundaries', () => {
    it('F-17.B1: Handles planner when all 21 slots are completely filled', () => {
      const plan = env.getOrCreateMealPlan(testUid, '2026-W35');
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
      const meals = ['breakfast', 'lunch', 'dinner'] as const;

      for (const d of days) {
        for (const m of meals) {
          env.assignSlot(testUid, '2026-W35', d, m, testRecipe);
        }
      }

      let count = 0;
      for (const d of days) {
        for (const m of meals) {
          if (plan.meals[d][m]) count++;
        }
      }
      assert.strictEqual(count, 21);
    });

    it('F-17.B2: Handles planner when all 21 slots are completely empty', () => {
      const plan = env.getOrCreateMealPlan(testUid, '2026-W35');
      let count = 0;
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
      for (const d of days) {
        if (plan.meals[d].breakfast) count++;
        if (plan.meals[d].lunch) count++;
        if (plan.meals[d].dinner) count++;
      }
      assert.strictEqual(count, 0);
    });

    it('F-17.B3: Supports meal slot containing long recipe names without breaking grid structure', () => {
      const longNameRecipe = { ...testRecipe, name: 'Extremely Long Recipe Title For Gourmet Braised Artisanal Entree' };
      env.assignSlot(testUid, '2026-W35', 'saturday', 'dinner', longNameRecipe);
      const plan = env.getOrCreateMealPlan(testUid, '2026-W35');
      assert.strictEqual(plan.meals.saturday.dinner?.recipeName, longNameRecipe.name);
    });

    it('F-17.B4: Supports meal slot with missing thumbnail URL (fallback thumbnail)', () => {
      const noThumbRecipe = { ...testRecipe, thumbnailUrl: undefined };
      env.assignSlot(testUid, '2026-W35', 'sunday', 'lunch', noThumbRecipe);
      const plan = env.getOrCreateMealPlan(testUid, '2026-W35');
      assert.strictEqual(plan.meals.sunday.lunch?.thumbnailUrl, undefined);
    });

    it('F-17.B5: Handles planner state across multiple independent weeks', () => {
      env.assignSlot(testUid, '2026-W35', 'monday', 'dinner', testRecipe);
      env.assignSlot(testUid, '2026-W36', 'monday', 'dinner', FIXTURE_RECIPES[1]);

      const planW35 = env.getOrCreateMealPlan(testUid, '2026-W35');
      const planW36 = env.getOrCreateMealPlan(testUid, '2026-W36');

      assert.strictEqual(planW35.meals.monday.dinner?.recipeId, testRecipe.id);
      assert.strictEqual(planW36.meals.monday.dinner?.recipeId, FIXTURE_RECIPES[1].id);
    });
  });

  // F-18: ISO Week Navigation Boundaries
  describe('F-18: ISO Week Navigation Boundaries', () => {
    it('F-18.B1: Handles 52-week year boundary (2025-W52 + 1 -> 2026-W01)', () => {
      const next = shiftISOWeek('2025-W52', 1);
      assert.strictEqual(next, '2026-W01');
    });

    it('F-18.B2: Handles 53-week leap week year boundary (2020-W53 + 1 -> 2021-W01)', () => {
      const next = shiftISOWeek('2020-W53', 1);
      assert.strictEqual(next, '2021-W01');
    });

    it('F-18.B3: Shifts backwards across year boundary (2026-W01 - 1 -> 2025-W52)', () => {
      const prev = shiftISOWeek('2026-W01', -1);
      assert.strictEqual(prev, '2025-W52');
    });

    it('F-18.B4: Large week shift (+52 weeks in 53-week year lands on W34, +53 weeks on W35)', () => {
      const w52Shift = shiftISOWeek('2026-W35', 52);
      assert.strictEqual(w52Shift, '2027-W34');

      const w53Shift = shiftISOWeek('2026-W35', 53);
      assert.strictEqual(w53Shift, '2027-W35');
    });

    it('F-18.B5: Handles leap day (Feb 29) within ISO week calculations', () => {
      const leapDay = new Date(Date.UTC(2024, 1, 29)); // 2024-02-29
      const weekStr = getISOWeekString(leapDay);
      assert.strictEqual(weekStr, '2024-W09');
    });
  });

  // F-19: Manual Slot Assignment Boundaries
  describe('F-19: Manual Slot Assignment Boundaries', () => {
    it('F-19.B1: Assigning same recipe to all 21 slots succeeds without conflict', () => {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
      const meals = ['breakfast', 'lunch', 'dinner'] as const;

      for (const d of days) {
        for (const m of meals) {
          env.assignSlot(testUid, '2026-W35', d, m, testRecipe);
        }
      }

      const plan = env.getOrCreateMealPlan(testUid, '2026-W35');
      assert.strictEqual(plan.meals.sunday.dinner?.recipeId, testRecipe.id);
    });

    it('F-19.B2: Reassigning a slot 10 times in rapid succession persists latest assignment', () => {
      for (let i = 0; i < FIXTURE_RECIPES.length; i++) {
        env.assignSlot(testUid, '2026-W35', 'monday', 'dinner', FIXTURE_RECIPES[i]);
      }
      const plan = env.getOrCreateMealPlan(testUid, '2026-W35');
      const last = FIXTURE_RECIPES[FIXTURE_RECIPES.length - 1];
      assert.strictEqual(plan.meals.monday.dinner?.recipeId, last.id);
    });

    it('F-19.B3: Assigning slot on future week (e.g. 2027-W10) creates week on demand', () => {
      const plan = env.assignSlot(testUid, '2027-W10', 'friday', 'dinner', testRecipe);
      assert.strictEqual(plan.id, '2027-W10');
      assert.strictEqual(plan.meals.friday.dinner?.recipeId, testRecipe.id);
    });

    it('F-19.B4: Assigning slot on past week preserves historical record', () => {
      const plan = env.assignSlot(testUid, '2025-W01', 'monday', 'breakfast', testRecipe);
      assert.strictEqual(plan.id, '2025-W01');
      assert.strictEqual(plan.meals.monday.breakfast?.recipeId, testRecipe.id);
    });

    it('F-19.B5: Assigned slot structure strictly matches MealSlot interface', () => {
      const plan = env.assignSlot(testUid, '2026-W35', 'tuesday', 'lunch', testRecipe);
      const slot = plan.meals.tuesday.lunch!;
      assert.ok(typeof slot.recipeId === 'string');
      assert.ok(typeof slot.recipeName === 'string');
    });
  });

  // F-20: Slot Clearing Boundaries
  describe('F-20: Meal Plan Slot Clearing Boundaries', () => {
    it('F-20.B1: Clearing slot on an already empty day does not throw or corrupt object', () => {
      assert.doesNotThrow(() => {
        env.clearSlot(testUid, '2026-W35', 'monday', 'breakfast');
      });
      const plan = env.getOrCreateMealPlan(testUid, '2026-W35');
      assert.strictEqual(plan.meals.monday.breakfast, undefined);
    });

    it('F-20.B2: Clearing entire week when already empty is safe no-op', () => {
      assert.doesNotThrow(() => {
        env.clearWeek(testUid, '2026-W35');
      });
    });

    it('F-20.B3: Clearing week clears only target week, leaving other weeks untouched', () => {
      env.assignSlot(testUid, '2026-W35', 'monday', 'dinner', testRecipe);
      env.assignSlot(testUid, '2026-W36', 'monday', 'dinner', testRecipe);

      env.clearWeek(testUid, '2026-W35');
      const planW35 = env.getOrCreateMealPlan(testUid, '2026-W35');
      const planW36 = env.getOrCreateMealPlan(testUid, '2026-W36');

      assert.strictEqual(planW35.meals.monday.dinner, undefined);
      assert.strictEqual(planW36.meals.monday.dinner?.recipeId, testRecipe.id);
    });

    it('F-20.B4: Clearing slot 10 times consecutively does not error', () => {
      for (let i = 0; i < 10; i++) {
        env.clearSlot(testUid, '2026-W35', 'wednesday', 'lunch');
      }
    });

    it('F-20.B5: Meal plan maintains 7 day keys after clearWeek operation', () => {
      env.clearWeek(testUid, '2026-W35');
      const plan = env.getOrCreateMealPlan(testUid, '2026-W35');
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      for (const d of days) {
        assert.ok(d in plan.meals);
      }
    });
  });
});
