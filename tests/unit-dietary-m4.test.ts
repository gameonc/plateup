/**
 * Milestone 4: Unit & Integration Tests for Dietary Preferences and Recipe Filtering (R4)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  STANDARD_DIETARY_RESTRICTIONS,
  DIETARY_OPTIONS,
  detectDietaryTags,
  getDietaryBadgeClass,
  filterRecipesByDietary,
} from '../src/lib/dietary.ts';
import { generateMealPlan, createEmptyWeekMeals } from '../src/lib/meal-planner.ts';
import type { DietaryRestriction, Recipe, WeekMeals } from '../src/types/index.ts';

describe('Milestone 4: Dietary Preferences & Filtering (R4)', () => {
  // 1. Dietary Taxonomy & Constants
  describe('Dietary Taxonomy & Constants', () => {
    it('M4.1: Defines all 8 standard dietary restrictions', () => {
      assert.strictEqual(STANDARD_DIETARY_RESTRICTIONS.length, 8);
      const expected: DietaryRestriction[] = [
        'vegetarian',
        'vegan',
        'gluten-free',
        'dairy-free',
        'keto',
        'low-carb',
        'pescatarian',
        'nut-free',
      ];
      for (const item of expected) {
        assert.ok(STANDARD_DIETARY_RESTRICTIONS.includes(item), `Missing dietary restriction: ${item}`);
      }
    });

    it('M4.2: DIETARY_OPTIONS provides UI metadata for all 8 categories', () => {
      assert.strictEqual(DIETARY_OPTIONS.length, 8);
      for (const opt of DIETARY_OPTIONS) {
        assert.ok(opt.id);
        assert.ok(opt.label);
        assert.ok(opt.description);
        assert.ok(opt.badgeClass);
      }
    });

    it('M4.3: getDietaryBadgeClass maps restrictions to distinct colored badges', () => {
      assert.ok(getDietaryBadgeClass('vegetarian').includes('emerald'));
      assert.ok(getDietaryBadgeClass('vegan').includes('green'));
      assert.ok(getDietaryBadgeClass('gluten-free').includes('amber'));
      assert.ok(getDietaryBadgeClass('dairy-free').includes('blue'));
      assert.ok(getDietaryBadgeClass('keto').includes('purple'));
      assert.ok(getDietaryBadgeClass('low-carb').includes('indigo'));
      assert.ok(getDietaryBadgeClass('pescatarian').includes('cyan'));
      assert.ok(getDietaryBadgeClass('nut-free').includes('rose'));
    });
  });

  // 2. AI Extraction Dietary Tag Detection
  describe('AI Extraction Dietary Auto-Tagging', () => {
    it('M4.4: Detects vegetarian, vegan, and dairy-free for plant-based ingredients', () => {
      const ingredients = [
        { item: 'Organic Quinoa', amount: '1', unit: 'cup' },
        { item: 'Black Beans', amount: '1', unit: 'can' },
        { item: 'Avocado', amount: '1', unit: 'item' },
        { item: 'Cilantro', amount: '2', unit: 'tbsp' },
      ];
      const tags = detectDietaryTags(ingredients, ['Mix and serve fresh.']);
      assert.ok(tags.includes('vegetarian'));
      assert.ok(tags.includes('vegan'));
      assert.ok(tags.includes('dairy-free'));
      assert.ok(tags.includes('gluten-free'));
      assert.ok(tags.includes('nut-free'));
    });

    it('M4.5: Detects pescatarian and gluten-free for seafood dishes without flour', () => {
      const ingredients = [
        { item: 'Wild Salmon Fillet', amount: '2', unit: 'pieces' },
        { item: 'Asparagus', amount: '1', unit: 'bunch' },
        { item: 'Olive Oil', amount: '2', unit: 'tbsp' },
        { item: 'Lemon Juice', amount: '1', unit: 'tbsp' },
      ];
      const tags = detectDietaryTags(ingredients, ['Pan sear salmon in olive oil.']);
      assert.ok(tags.includes('pescatarian'));
      assert.ok(tags.includes('gluten-free'));
      assert.ok(tags.includes('dairy-free'));
      assert.strictEqual(tags.includes('vegan'), false);
      assert.strictEqual(tags.includes('vegetarian'), false);
    });

    it('M4.6: Correctly excludes vegetarian/vegan for red meat and poultry recipes', () => {
      const beefIngredients = [
        { item: 'Grass-Fed Ground Beef', amount: '1', unit: 'lb' },
        { item: 'Garlic Powder', amount: '1', unit: 'tsp' },
      ];
      const tags = detectDietaryTags(beefIngredients, ['Brown the beef.']);
      assert.strictEqual(tags.includes('vegetarian'), false);
      assert.strictEqual(tags.includes('vegan'), false);
      assert.strictEqual(tags.includes('pescatarian'), false);
    });

    it('M4.7: Correctly excludes gluten-free for recipes containing wheat flour or pasta', () => {
      const pastaIngredients = [
        { item: 'Spaghetti Pasta', amount: '200', unit: 'g' },
        { item: 'Tomato Sauce', amount: '1', unit: 'cup' },
      ];
      const tags = detectDietaryTags(pastaIngredients, ['Boil spaghetti.']);
      assert.strictEqual(tags.includes('gluten-free'), false);
    });

    it('M4.8: Correctly excludes dairy-free for recipes containing cheese or butter', () => {
      const dairyIngredients = [
        { item: 'Eggs', amount: '3', unit: 'items' },
        { item: 'Cheddar Cheese', amount: '1/2', unit: 'cup' },
        { item: 'Butter', amount: '1', unit: 'tbsp' },
      ];
      const tags = detectDietaryTags(dairyIngredients, ['Scramble eggs with butter and cheese.']);
      assert.strictEqual(tags.includes('dairy-free'), false);
      assert.strictEqual(tags.includes('vegan'), false);
      assert.ok(tags.includes('vegetarian'));
    });

    it('M4.9: Correctly excludes nut-free for recipes containing peanuts or tree nuts', () => {
      const nutIngredients = [
        { item: 'Rolled Oats', amount: '1', unit: 'cup' },
        { item: 'Almond Butter', amount: '2', unit: 'tbsp' },
        { item: 'Walnuts', amount: '1/4', unit: 'cup' },
      ];
      const tags = detectDietaryTags(nutIngredients, ['Mix into energy balls.']);
      assert.strictEqual(tags.includes('nut-free'), false);
    });
  });

  // 3. Dietary Meal Planner Auto-Fill
  describe('Dietary-Compliant Meal Planner Auto-Fill', () => {
    const mockRecipes: Recipe[] = [
      {
        id: 'rec_vegan_bowl',
        name: 'Quinoa Buddha Bowl',
        description: 'Nutritious bowl',
        source: 'manual',
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        servings: 2,
        difficulty: 'easy',
        tags: ['lunch', 'bowl'],
        dietaryTags: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free'],
        ingredients: [{ item: 'Quinoa', amount: '1', unit: 'cup' }],
        instructions: ['Assemble bowl.'],
        timesMade: 0,
        createdAt: new Date(),
      },
      {
        id: 'rec_salmon_gf',
        name: 'Pan-Seared Salmon',
        description: 'Crispy salmon with greens',
        source: 'manual',
        prepTimeMinutes: 5,
        cookTimeMinutes: 12,
        servings: 2,
        difficulty: 'easy',
        tags: ['dinner', 'seafood'],
        dietaryTags: ['pescatarian', 'gluten-free', 'dairy-free', 'keto', 'low-carb', 'nut-free'],
        ingredients: [{ item: 'Salmon', amount: '2', unit: 'fillets' }],
        instructions: ['Pan fry.'],
        timesMade: 0,
        createdAt: new Date(),
      },
      {
        id: 'rec_steak_keto',
        name: 'Ribeye Steak with Butter',
        description: 'Juicy ribeye',
        source: 'manual',
        prepTimeMinutes: 5,
        cookTimeMinutes: 15,
        servings: 2,
        difficulty: 'medium',
        tags: ['dinner', 'meat'],
        dietaryTags: ['keto', 'low-carb', 'gluten-free', 'nut-free'],
        ingredients: [{ item: 'Ribeye Steak', amount: '1', unit: 'lb' }, { item: 'Butter', amount: '2', unit: 'tbsp' }],
        instructions: ['Sear steak.'],
        timesMade: 0,
        createdAt: new Date(),
      },
      {
        id: 'rec_pasta_carbonara',
        name: 'Classic Spaghetti Carbonara',
        description: 'Traditional Italian pasta',
        source: 'youtube',
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        servings: 2,
        difficulty: 'medium',
        tags: ['dinner', 'pasta'],
        dietaryTags: ['nut-free'],
        ingredients: [{ item: 'Spaghetti', amount: '200', unit: 'g' }, { item: 'Pancetta', amount: '100', unit: 'g' }],
        instructions: ['Cook pasta and toss with egg and cheese.'],
        timesMade: 0,
        createdAt: new Date(),
      },
    ];

    it('M4.10: Auto-fill strictly selects only vegan recipes when user is vegan', () => {
      const plan = generateMealPlan(mockRecipes, new Set(), {}, 5, ['vegan']);
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

      for (const day of days) {
        const slot = plan[day].dinner;
        if (slot) {
          const recipe = mockRecipes.find((r) => r.id === slot.recipeId);
          assert.ok(recipe, `Recipe ${slot.recipeId} must exist`);
          assert.ok(
            (recipe.dietaryTags as string[]).includes('vegan'),
            `Selected recipe ${recipe.name} must be vegan`
          );
        }
      }
    });

    it('M4.11: Auto-fill satisfies multi-dietary restrictions (e.g. keto AND gluten-free)', () => {
      const plan = generateMealPlan(mockRecipes, new Set(), {}, 5, ['keto', 'gluten-free']);
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

      for (const day of days) {
        const slot = plan[day].dinner;
        if (slot) {
          const recipe = mockRecipes.find((r) => r.id === slot.recipeId);
          assert.ok(recipe);
          assert.ok((recipe.dietaryTags as string[]).includes('keto'));
          assert.ok((recipe.dietaryTags as string[]).includes('gluten-free'));
        }
      }
    });

    it('M4.12: Returns unfilled slots gracefully when 0 recipes match requested restrictions', () => {
      // Impossible combination in our mock: vegan + keto (0 recipes match)
      const plan = generateMealPlan(mockRecipes, new Set(), {}, 5, ['vegan', 'keto']);
      assert.strictEqual(plan.monday.breakfast, undefined);
      assert.strictEqual(plan.monday.lunch, undefined);
      assert.strictEqual(plan.monday.dinner, undefined);
    });

    it('M4.13: Case-insensitive dietary restriction matching', () => {
      const plan = generateMealPlan(mockRecipes, new Set(), {}, 5, ['VEGAN' as unknown as DietaryRestriction]);
      assert.ok(plan.monday.dinner?.recipeId === 'rec_vegan_bowl');
    });

    it('M4.14: Preserves user-locked slots during dietary auto-fill', () => {
      const locked: Partial<WeekMeals> = {
        monday: {
          dinner: {
            recipeId: 'rec_pasta_carbonara',
            recipeName: 'Classic Spaghetti Carbonara',
          },
        },
      };

      const plan = generateMealPlan(mockRecipes, new Set(), locked, 5, ['vegan']);
      // Monday dinner should retain locked non-vegan recipe
      assert.strictEqual(plan.monday.dinner?.recipeId, 'rec_pasta_carbonara');
      // Tuesday dinner should be auto-filled with vegan recipe
      assert.strictEqual(plan.tuesday.dinner?.recipeId, 'rec_vegan_bowl');
    });

    it('M4.15: filterRecipesByDietary filters recipes matching single or multiple restrictions', () => {
      const veganRecipes = filterRecipesByDietary(mockRecipes, ['vegan']);
      assert.strictEqual(veganRecipes.length, 1);
      assert.strictEqual(veganRecipes[0].id, 'rec_vegan_bowl');

      const ketoGfRecipes = filterRecipesByDietary(mockRecipes, ['keto', 'gluten-free']);
      assert.strictEqual(ketoGfRecipes.length, 2);
      assert.ok(ketoGfRecipes.some((r) => r.id === 'rec_salmon_gf'));
      assert.ok(ketoGfRecipes.some((r) => r.id === 'rec_steak_keto'));
    });

    it('M4.16: filterRecipesByDietary returns all recipes when restrictions array is empty', () => {
      const all = filterRecipesByDietary(mockRecipes, []);
      assert.strictEqual(all.length, mockRecipes.length);
    });
  });
});
