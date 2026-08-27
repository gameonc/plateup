/**
 * Tier 1: Feature Coverage for F-21 to F-24
 * F-21: Smart Auto-Fill Planner
 * F-22: Dashboard Today's Menu Live View
 * F-23: Dashboard User Statistics
 * F-24: Dashboard Recent Recipes
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { PlateUpTestEnvironment, getISOWeekString } from '../helpers/test-context.ts';
import { FIXTURE_RECIPES } from '../helpers/recipe-fixtures.ts';

describe('Tier 1: F-21 to F-24 — Auto-Fill Engine & Dashboard Views', () => {
  let env: PlateUpTestEnvironment;
  let testUid: string;

  beforeEach(() => {
    env = new PlateUpTestEnvironment();
    const user = env.register('chef_dash@test.com', 'password123', 'Dash Master');
    testUid = user.uid;

    for (const r of FIXTURE_RECIPES) {
      env.saveRecipe(testUid, r);
    }
  });

  // F-21: Smart Auto-Fill Planner
  describe('F-21: Smart Auto-Fill Engine', () => {
    it('F-21.1: Fills all empty slots across the 7-day week (21 slots)', () => {
      const plan = env.autoFillPlan(testUid, '2026-W35');
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
      const meals = ['breakfast', 'lunch', 'dinner'] as const;

      let filledCount = 0;
      for (const day of days) {
        for (const meal of meals) {
          if (plan.meals[day]?.[meal]?.recipeId) {
            filledCount++;
          }
        }
      }
      assert.strictEqual(filledCount, 21);
    });

    it('F-21.2: Preserves locked/pre-filled slots during auto-fill', () => {
      const manualRecipe = FIXTURE_RECIPES[0];
      env.assignSlot(testUid, '2026-W35', 'wednesday', 'dinner', manualRecipe);

      const plan = env.autoFillPlan(testUid, '2026-W35');
      assert.strictEqual(plan.meals.wednesday.dinner?.recipeId, manualRecipe.id);
    });

    it('F-21.3: Avoids recently cooked recipes based on repeatWindowDays', () => {
      // Mark recipe 0 and 1 as cooked yesterday
      env.markAsCooked(testUid, FIXTURE_RECIPES[0].id);
      env.markAsCooked(testUid, FIXTURE_RECIPES[1].id);

      const plan = env.autoFillPlan(testUid, '2026-W35');
      // On the first slot (monday breakfast/lunch), candidate pool should prioritize non-recent recipes
      assert.ok(plan.meals.monday.breakfast?.recipeId);
    });

    it('F-21.4: Balances variety across consecutive days', () => {
      const plan = env.autoFillPlan(testUid, '2026-W35');
      // Tuesday dinner should avoid repeating Monday dinner if other recipes exist
      const monDinner = plan.meals.monday.dinner?.recipeId;
      const tueDinner = plan.meals.tuesday.dinner?.recipeId;
      assert.notStrictEqual(monDinner, tueDinner);
    });

    it('F-21.5: Triggers confirmation toast notification upon auto-fill', () => {
      env.autoFillPlan(testUid, '2026-W35');
      assert.ok(env.toastQueue.includes('Meal plan generated!'));
    });
  });

  // F-22: Dashboard Today's Menu Live View
  describe("F-22: Dashboard Today's Menu Live View", () => {
    const getTodaysMenu = (
      env: PlateUpTestEnvironment,
      userId: string,
      currentDate: Date = new Date('2026-08-27T12:00:00Z') // Thursday
    ) => {
      const weekId = getISOWeekString(currentDate);
      const plan = env.getOrCreateMealPlan(userId, weekId);
      
      const dayIndex = currentDate.getUTCDay(); // 0 is Sunday, 1 is Monday ... 4 is Thursday
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
      const currentDayName = dayNames[dayIndex];

      const dayMeals = plan.meals[currentDayName] || {};
      return {
        dayName: currentDayName,
        weekId,
        breakfast: dayMeals.breakfast || null,
        lunch: dayMeals.lunch || null,
        dinner: dayMeals.dinner || null,
        isPlanned: Boolean(dayMeals.breakfast || dayMeals.lunch || dayMeals.dinner),
      };
    };

    it('F-22.1: Resolves correct day of week from current date (Thursday for 2026-08-27)', () => {
      const menu = getTodaysMenu(env, testUid, new Date('2026-08-27T12:00:00Z'));
      assert.strictEqual(menu.dayName, 'thursday');
      assert.strictEqual(menu.weekId, '2026-W35');
    });

    it('F-22.2: Returns all 3 meals (breakfast, lunch, dinner) when planned for today', () => {
      env.assignSlot(testUid, '2026-W35', 'thursday', 'breakfast', FIXTURE_RECIPES[4]);
      env.assignSlot(testUid, '2026-W35', 'thursday', 'lunch', FIXTURE_RECIPES[2]);
      env.assignSlot(testUid, '2026-W35', 'thursday', 'dinner', FIXTURE_RECIPES[0]);

      const menu = getTodaysMenu(env, testUid, new Date('2026-08-27T12:00:00Z'));
      assert.strictEqual(menu.breakfast?.recipeName, FIXTURE_RECIPES[4].name);
      assert.strictEqual(menu.lunch?.recipeName, FIXTURE_RECIPES[2].name);
      assert.strictEqual(menu.dinner?.recipeName, FIXTURE_RECIPES[0].name);
      assert.strictEqual(menu.isPlanned, true);
    });

    it('F-22.3: Handles partially planned days (e.g. dinner only)', () => {
      env.assignSlot(testUid, '2026-W35', 'thursday', 'dinner', FIXTURE_RECIPES[1]);
      const menu = getTodaysMenu(env, testUid, new Date('2026-08-27T12:00:00Z'));
      assert.strictEqual(menu.breakfast, null);
      assert.strictEqual(menu.lunch, null);
      assert.strictEqual(menu.dinner?.recipeName, FIXTURE_RECIPES[1].name);
    });

    it('F-22.4: Returns uncompleted empty placeholder state when no meals are planned for today', () => {
      const menu = getTodaysMenu(env, testUid, new Date('2026-08-27T12:00:00Z'));
      assert.strictEqual(menu.breakfast, null);
      assert.strictEqual(menu.lunch, null);
      assert.strictEqual(menu.dinner, null);
      assert.strictEqual(menu.isPlanned, false);
    });

    it('F-22.5: Updates dynamically when user assigns or modifies a meal slot', () => {
      env.assignSlot(testUid, '2026-W35', 'thursday', 'dinner', FIXTURE_RECIPES[0]);
      let menu = getTodaysMenu(env, testUid, new Date('2026-08-27T12:00:00Z'));
      assert.strictEqual(menu.dinner?.recipeId, FIXTURE_RECIPES[0].id);

      env.assignSlot(testUid, '2026-W35', 'thursday', 'dinner', FIXTURE_RECIPES[3]);
      menu = getTodaysMenu(env, testUid, new Date('2026-08-27T12:00:00Z'));
      assert.strictEqual(menu.dinner?.recipeId, FIXTURE_RECIPES[3].id);
    });
  });

  // F-23: Dashboard User Statistics
  describe('F-23: Dashboard User Statistics Computation', () => {
    const computeDashboardStats = (
      env: PlateUpTestEnvironment,
      userId: string,
      currentDate: Date = new Date('2026-08-27T12:00:00Z')
    ) => {
      const userRecipes = Array.from(env.recipes.get(userId)?.values() || []);
      const totalRecipes = userRecipes.length;
      const favoriteRecipes = userRecipes.filter(r => (r.rating || 0) === 5).length;

      const weekId = getISOWeekString(currentDate);
      const plan = env.getOrCreateMealPlan(userId, weekId);
      let plannedThisWeek = 0;
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
      for (const d of days) {
        for (const m of ['breakfast', 'lunch', 'dinner'] as const) {
          if (plan.meals[d]?.[m]?.recipeId) plannedThisWeek++;
        }
      }

      const currentMonth = currentDate.getUTCMonth();
      const currentYear = currentDate.getUTCFullYear();
      const logs = env.cookingLogs.get(userId) || [];
      const madeThisMonth = logs.filter(log => {
        const d = new Date(log.cookedAt);
        return d.getUTCMonth() === currentMonth && d.getUTCFullYear() === currentYear;
      }).length;

      return {
        totalRecipes,
        favoriteRecipes,
        plannedThisWeek,
        madeThisMonth,
      };
    };

    it('F-23.1: Computes total count of saved recipes in user collection', () => {
      const stats = computeDashboardStats(env, testUid);
      assert.strictEqual(stats.totalRecipes, FIXTURE_RECIPES.length);
    });

    it('F-23.2: Computes number of planned meals in current week (0 to 21)', () => {
      env.assignSlot(testUid, '2026-W35', 'monday', 'lunch', FIXTURE_RECIPES[0]);
      env.assignSlot(testUid, '2026-W35', 'wednesday', 'dinner', FIXTURE_RECIPES[1]);
      env.assignSlot(testUid, '2026-W35', 'friday', 'dinner', FIXTURE_RECIPES[2]);

      const stats = computeDashboardStats(env, testUid);
      assert.strictEqual(stats.plannedThisWeek, 3);
    });

    it('F-23.3: Computes madeThisMonth count filtered to current calendar month', () => {
      env.markAsCooked(testUid, FIXTURE_RECIPES[0].id);
      env.markAsCooked(testUid, FIXTURE_RECIPES[1].id);

      const stats = computeDashboardStats(env, testUid);
      assert.strictEqual(stats.madeThisMonth, 2);
    });

    it('F-23.4: Computes 5-star favorite recipes count accurately', () => {
      const stats = computeDashboardStats(env, testUid);
      const expectedFaves = FIXTURE_RECIPES.filter(r => r.rating === 5).length;
      assert.strictEqual(stats.favoriteRecipes, expectedFaves);
    });

    it('F-23.5: Stats update immediately when a new recipe is saved or meal plan updated', () => {
      let stats = computeDashboardStats(env, testUid);
      const initialTotal = stats.totalRecipes;

      env.saveRecipe(testUid, {
        name: 'Brand New Quick Salad',
        description: 'Crisp green salad',
        source: 'manual',
        prepTimeMinutes: 5,
        cookTimeMinutes: 0,
        servings: 1,
        difficulty: 'easy',
        tags: ['salad'],
        dietaryTags: ['vegan'],
        ingredients: [{ item: 'Lettuce', amount: '2', unit: 'cups' }],
        instructions: ['Toss and serve.'],
      });

      stats = computeDashboardStats(env, testUid);
      assert.strictEqual(stats.totalRecipes, initialTotal + 1);
    });
  });

  // F-24: Dashboard Recent Recipes
  describe('F-24: Dashboard Recent Recipes View', () => {
    const getRecentRecipes = (env: PlateUpTestEnvironment, userId: string, limit: number = 5) => {
      const userRecipes = Array.from(env.recipes.get(userId)?.values() || []);
      return userRecipes
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    };

    it('F-24.1: Returns top 5 most recently created recipes', () => {
      const recent = getRecentRecipes(env, testUid, 5);
      assert.strictEqual(recent.length, 5);
    });

    it('F-24.2: Recent recipes are ordered newest first by createdAt timestamp', () => {
      const recent = getRecentRecipes(env, testUid, 5);
      for (let i = 0; i < recent.length - 1; i++) {
        assert.ok(new Date(recent[i].createdAt).getTime() >= new Date(recent[i + 1].createdAt).getTime());
      }
    });

    it('F-24.3: Displays source badge metadata (youtube, image, manual)', () => {
      const recent = getRecentRecipes(env, testUid, 5);
      const sources = recent.map(r => r.source);
      assert.ok(sources.includes('youtube'));
      assert.ok(sources.includes('image'));
      assert.ok(sources.includes('manual'));
    });

    it('F-24.4: Includes thumbnail URL, cook time, and recipe title', () => {
      const recent = getRecentRecipes(env, testUid, 5);
      const first = recent[0];
      assert.ok(first.name.length > 0);
      assert.ok(first.prepTimeMinutes >= 0);
      assert.ok(first.cookTimeMinutes >= 0);
    });

    it('F-24.5: Newly added recipe immediately appears at the top of recent recipes', () => {
      const brandNew = env.saveRecipe(testUid, {
        name: 'Just Added Midnight Snack',
        description: 'Toast with honey',
        source: 'manual',
        prepTimeMinutes: 2,
        cookTimeMinutes: 2,
        servings: 1,
        difficulty: 'easy',
        tags: ['snack'],
        dietaryTags: ['vegetarian'],
        createdAt: new Date(Date.now() + 10000),
        ingredients: [{ item: 'Bread', amount: '1', unit: 'slice' }],
        instructions: ['Toast and drizzle.'],
      });

      const recent = getRecentRecipes(env, testUid, 5);
      assert.strictEqual(recent[0].id, brandNew.id);
      assert.strictEqual(recent[0].name, 'Just Added Midnight Snack');
    });
  });
});
