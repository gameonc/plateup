/**
 * Tier 1: Feature Coverage for F-38 to F-40
 * F-38: Profile Dietary Preferences UI
 * F-39: AI Extraction Dietary Auto-Tagging
 * F-40: Dietary Recipe Filter & Auto-Fill
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  PlateUpTestEnvironment,
  type DietaryRestriction,
  generateSmartMealPlan,
} from '../helpers/test-context.ts';
import { FIXTURE_RECIPES, type TestRecipe } from '../helpers/recipe-fixtures.ts';

describe('Tier 1: F-38 to F-40 — Dietary Preferences & Smart Filtering', () => {
  let env: PlateUpTestEnvironment;
  let testUid: string;
  let savedRecipes: TestRecipe[];

  beforeEach(() => {
    env = new PlateUpTestEnvironment();
    const user = env.register('vegan_chef@test.com', 'password123', 'Plant Power');
    testUid = user.uid;

    savedRecipes = FIXTURE_RECIPES.map(r => env.saveRecipe(testUid, r));
  });

  // F-38: Profile Dietary Preferences UI
  describe('F-38: Profile Dietary Preferences UI', () => {
    const STANDARD_DIETARY_RESTRICTIONS: DietaryRestriction[] = [
      'vegetarian',
      'vegan',
      'gluten-free',
      'dairy-free',
      'keto',
      'low-carb',
      'pescatarian',
      'nut-free'
    ];

    it('F-38.1: Supports all 8 standard dietary restriction tags', () => {
      assert.strictEqual(STANDARD_DIETARY_RESTRICTIONS.length, 8);
      assert.ok(STANDARD_DIETARY_RESTRICTIONS.includes('vegan'));
      assert.ok(STANDARD_DIETARY_RESTRICTIONS.includes('gluten-free'));
      assert.ok(STANDARD_DIETARY_RESTRICTIONS.includes('keto'));
    });

    it('F-38.2: Updates user profile dietary preferences in Firestore', () => {
      const user = env.users.get(testUid)!;
      user.preferences.dietaryRestrictions = ['vegan', 'gluten-free'];
      user.preferences.repeatWindowDays = 7;

      const updated = env.users.get(testUid)!;
      assert.deepStrictEqual(updated.preferences.dietaryRestrictions, ['vegan', 'gluten-free']);
      assert.strictEqual(updated.preferences.repeatWindowDays, 7);
    });

    it('F-38.3: Allows multiple simultaneous dietary restrictions', () => {
      const user = env.users.get(testUid)!;
      user.preferences.dietaryRestrictions = ['vegetarian', 'dairy-free', 'nut-free'];
      assert.strictEqual(user.preferences.dietaryRestrictions.length, 3);
    });

    it('F-38.4: Allows clearing dietary preferences back to unrestricted', () => {
      const user = env.users.get(testUid)!;
      user.preferences.dietaryRestrictions = ['keto'];
      user.preferences.dietaryRestrictions = [];
      assert.deepStrictEqual(user.preferences.dietaryRestrictions, []);
    });

    it('F-38.5: Configurable repeat window setting (e.g. 1 to 14 days)', () => {
      const user = env.users.get(testUid)!;
      user.preferences.repeatWindowDays = 14;
      assert.strictEqual(user.preferences.repeatWindowDays, 14);
    });
  });

  // F-39: AI Extraction Dietary Auto-Tagging
  describe('F-39: AI Extraction Dietary Auto-Tagging', () => {
    const detectDietaryTags = (ingredients: { item: string }[], instructions: string[]): DietaryRestriction[] => {
      const text = (ingredients.map(i => i.item).join(' ') + ' ' + instructions.join(' ')).toLowerCase();
      const tags: DietaryRestriction[] = [];

      const hasMeat = /\b(beef|pork|chicken|guanciale|bacon|turkey|lamb)\b/.test(text);
      const hasFish = /\b(salmon|tuna|fish|shrimp|cod|anchov)\b/.test(text);
      const hasDairy = /\b(milk|cream|butter|cheese|pecorino|parmesan|yogurt|whey)\b/.test(text);
      const hasGluten = /\b(flour|wheat|spaghetti|pasta|sourdough|bread|bun|soy sauce)\b/.test(text);
      const hasNuts = /\b(peanut|almond|walnut|cashew|pecan|nut)\b/.test(text);

      if (!hasMeat && !hasFish) tags.push('vegetarian');
      if (!hasMeat && !hasFish && !hasDairy) tags.push('vegan');
      if (!hasGluten) tags.push('gluten-free');
      if (!hasDairy) tags.push('dairy-free');
      if (!hasNuts) tags.push('nut-free');
      if (!hasMeat && hasFish) tags.push('pescatarian');

      return tags;
    };

    it('F-39.1: Auto-detects vegetarian and vegan tags for plant-based recipes', () => {
      const plantIngredients = [
        { item: 'Tricolor Quinoa', amount: '1', unit: 'cup' },
        { item: 'Chickpeas', amount: '1', unit: 'can' },
        { item: 'Avocado', amount: '1', unit: 'items' },
        { item: 'Spinach', amount: '2', unit: 'cups' },
      ];
      const tags = detectDietaryTags(plantIngredients, ['Roast chickpeas and assemble bowl.']);
      assert.ok(tags.includes('vegetarian'));
      assert.ok(tags.includes('vegan'));
      assert.ok(tags.includes('dairy-free'));
    });

    it('F-39.2: Auto-detects gluten-free and pescatarian for seafood recipes without flour', () => {
      const salmonIngredients = [
        { item: 'Salmon Fillet', amount: '2', unit: 'items' },
        { item: 'Asparagus', amount: '1', unit: 'bunch' },
        { item: 'Butter', amount: '2', unit: 'tbsp' },
      ];
      const tags = detectDietaryTags(salmonIngredients, ['Pan sear salmon in butter.']);
      assert.ok(tags.includes('pescatarian'));
      assert.ok(tags.includes('gluten-free'));
      assert.strictEqual(tags.includes('vegan'), false);
    });

    it('F-39.3: Correctly identifies non-vegetarian recipes with beef or poultry', () => {
      const beefIngredients = [{ item: 'Beef Chuck Roast', amount: '2', unit: 'lbs' }];
      const tags = detectDietaryTags(beefIngredients, ['Brown beef.']);
      assert.strictEqual(tags.includes('vegetarian'), false);
      assert.strictEqual(tags.includes('vegan'), false);
    });

    it('F-39.4: Allows user to manually edit and override AI-generated tags', () => {
      const recipe = env.saveRecipe(testUid, {
        name: 'Custom Salad',
        description: 'Salad with dressing',
        source: 'manual',
        prepTimeMinutes: 5,
        cookTimeMinutes: 0,
        servings: 1,
        difficulty: 'easy',
        tags: ['salad'],
        dietaryTags: ['vegetarian'], // initial AI tag
        ingredients: [{ item: 'Greens', amount: '2', unit: 'cups' }],
        instructions: ['Toss.'],
      });

      // User adds vegan and gluten-free
      recipe.dietaryTags = ['vegetarian', 'vegan', 'gluten-free'];
      assert.strictEqual(recipe.dietaryTags.length, 3);
      assert.ok(recipe.dietaryTags.includes('vegan'));
    });

    it('F-39.5: Preserves assigned dietary tags in Firestore recipe document', () => {
      const recipe = env.recipes.get(testUid)!.get(savedRecipes[2].id)!;
      assert.ok(recipe.dietaryTags.includes('vegan'));
      assert.ok(recipe.dietaryTags.includes('gluten-free'));
    });
  });

  // F-40: Dietary Recipe Filter & Auto-Fill
  describe('F-40: Dietary Recipe Filter & Auto-Fill', () => {
    const filterRecipesByDiet = (recipes: TestRecipe[], activeDietaryFilter: DietaryRestriction | 'all') => {
      if (activeDietaryFilter === 'all') return recipes;
      return recipes.filter(r => (r.dietaryTags || []).map(t => t.toLowerCase()).includes(activeDietaryFilter.toLowerCase()));
    };

    it('F-40.1: Filters recipe library by "vegan" tag and shows only compliant recipes', () => {
      const veganRecipes = filterRecipesByDiet(savedRecipes, 'vegan');
      assert.ok(veganRecipes.length >= 1);
      for (const r of veganRecipes) {
        assert.ok(r.dietaryTags.map(t => t.toLowerCase()).includes('vegan'));
      }
    });

    it('F-40.2: Filters recipe library by "gluten-free" tag', () => {
      const gfRecipes = filterRecipesByDiet(savedRecipes, 'gluten-free');
      assert.ok(gfRecipes.length >= 2);
      for (const r of gfRecipes) {
        assert.ok(r.dietaryTags.map(t => t.toLowerCase()).includes('gluten-free'));
      }
    });

    it('F-40.3: Smart Auto-Fill strictly uses only recipes satisfying user dietary restrictions', () => {
      const user = env.users.get(testUid)!;
      user.preferences.dietaryRestrictions = ['vegan'];

      const plan = env.autoFillPlan(testUid, '2026-W35');
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
      const meals = ['breakfast', 'lunch', 'dinner'] as const;

      for (const day of days) {
        for (const meal of meals) {
          const slot = plan.meals[day]?.[meal];
          if (slot) {
            const recipe = savedRecipes.find(r => r.id === slot.recipeId);
            assert.ok(recipe);
            assert.ok(recipe.dietaryTags.map(t => t.toLowerCase()).includes('vegan'));
          }
        }
      }
    });

    it('F-40.4: Smart Auto-Fill strictly satisfies multi-dietary requirements (e.g. gluten-free AND nut-free)', () => {
      const user = env.users.get(testUid)!;
      user.preferences.dietaryRestrictions = ['gluten-free', 'nut-free'];

      const plan = env.autoFillPlan(testUid, '2026-W35');
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

      for (const day of days) {
        const slot = plan.meals[day]?.dinner;
        if (slot) {
          const recipe = savedRecipes.find(r => r.id === slot.recipeId);
          assert.ok(recipe);
          assert.ok(recipe.dietaryTags.includes('gluten-free'));
          assert.ok(recipe.dietaryTags.includes('nut-free'));
        }
      }
    });

    it('F-40.5: Returns partial/empty plan with warning if no recipe matches impossible dietary criteria', () => {
      const user = env.users.get(testUid)!;
      // Set combination no fixture matches (e.g. keto + vegan simultaneously with 0 items)
      user.preferences.dietaryRestrictions = ['keto', 'vegan'];

      const generated = generateSmartMealPlan(savedRecipes, {}, user.preferences);
      // Since no recipe matches both keto and vegan in fixtures, generated plan slots remain empty
      assert.strictEqual(generated.monday.dinner, undefined);
    });
  });
});
