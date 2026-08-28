/**
 * Unit tests for QA Improvements & Refinements
 * - TheMealDB instructions null safety & dietary tagging
 * - Recipe search ingredient matching predicate
 * - Redirect URL intent preservation logic
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  parseMealInstructions,
  mealToRecipeData,
  type MealDBMeal,
} from '../src/lib/mealdb.ts';
import type { Recipe } from '../src/types/index.ts';

describe('QA Improvements & Refinements Suite', () => {

  describe('1. TheMealDB Instructions Null Safety & Dietary Tagging', () => {
    it('handles null instructions gracefully without throwing', () => {
      const result = parseMealInstructions(null as unknown as string);
      assert.deepStrictEqual(result, []);
    });

    it('handles undefined instructions gracefully', () => {
      const result = parseMealInstructions(undefined as unknown as string);
      assert.deepStrictEqual(result, []);
    });

    it('handles empty string instructions gracefully', () => {
      const result = parseMealInstructions('');
      assert.deepStrictEqual(result, []);
    });

    it('parses valid multi-step instructions correctly', () => {
      const instructions = '1. Chop onions.\n2. Heat olive oil in pan.\n3. Sauté until translucent.';
      const steps = parseMealInstructions(instructions);
      assert.strictEqual(steps.length, 3);
      assert.strictEqual(steps[0], 'Chop onions.');
      assert.strictEqual(steps[1], 'Heat olive oil in pan.');
      assert.strictEqual(steps[2], 'Sauté until translucent.');
    });

    it('mealToRecipeData populates accurate dietary tags for vegan meal', () => {
      const meal: MealDBMeal = {
        idMeal: '99001',
        strMeal: 'Vegan Chickpea Salad',
        strCategory: 'Salad',
        strArea: 'Mediterranean',
        strInstructions: 'Mix chickpeas with diced cucumber, tomatoes, and olive oil dressing.',
        strMealThumb: 'https://example.com/salad.jpg',
        strTags: 'Vegan,Salad',
        strYoutube: null,
        strSource: null,
        strIngredient1: 'Chickpeas',
        strMeasure1: '1 can',
        strIngredient2: 'Cucumber',
        strMeasure2: '1 cup',
        strIngredient3: 'Olive Oil',
        strMeasure3: '2 tbsp',
      };

      const recipe = mealToRecipeData(meal);
      assert.strictEqual(recipe.name, 'Vegan Chickpea Salad');
      assert.ok(Array.isArray(recipe.dietaryTags));
      assert.ok(recipe.dietaryTags.includes('vegan'));
      assert.ok(recipe.dietaryTags.includes('vegetarian'));
      assert.ok(recipe.dietaryTags.includes('dairy-free'));
      assert.ok(recipe.dietaryTags.includes('gluten-free'));
    });

    it('mealToRecipeData handles null strInstructions and null strTags safely', () => {
      const meal: MealDBMeal = {
        idMeal: '99002',
        strMeal: 'Simple Salmon',
        strCategory: 'Seafood',
        strArea: 'Nordic',
        strInstructions: null as unknown as string,
        strMealThumb: 'https://example.com/salmon.jpg',
        strTags: null,
        strYoutube: null,
        strSource: null,
        strIngredient1: 'Salmon Fillet',
        strMeasure1: '2 pieces',
        strIngredient2: 'Lemon',
        strMeasure2: '1',
      };

      const recipe = mealToRecipeData(meal);
      assert.strictEqual(recipe.name, 'Simple Salmon');
      assert.deepStrictEqual(recipe.instructions, []);
      assert.ok(recipe.dietaryTags.includes('pescatarian'));
      assert.strictEqual(recipe.tags.includes('seafood'), true);
      assert.strictEqual(recipe.tags.includes('nordic'), true);
    });
  });

  describe('2. Recipe Search Ingredient Matching Predicate', () => {
    const testRecipes: Recipe[] = [
      {
        id: 'r1',
        name: 'Creamy Mushroom Risotto',
        description: 'Arborio rice with sauteed mushrooms',
        source: 'manual',
        prepTimeMinutes: 10,
        cookTimeMinutes: 30,
        servings: 4,
        difficulty: 'medium',
        tags: ['italian', 'rice'],
        dietaryTags: ['vegetarian', 'gluten-free'],
        ingredients: [
          { item: 'Arborio Rice', amount: '1.5', unit: 'cup' },
          { item: 'Cremini Mushrooms', amount: '8', unit: 'oz' },
          { item: 'Parmesan Cheese', amount: '0.5', unit: 'cup' },
        ],
        instructions: ['Cook rice in broth.'],
        timesMade: 0,
        createdAt: new Date(),
      },
      {
        id: 'r2',
        name: 'Tofu Veggie Stir Fry',
        description: 'Crispy tofu with bell peppers and broccoli',
        source: 'manual',
        prepTimeMinutes: 15,
        cookTimeMinutes: 15,
        servings: 2,
        difficulty: 'easy',
        tags: ['asian', 'stir-fry'],
        dietaryTags: ['vegan', 'vegetarian', 'dairy-free'],
        ingredients: [
          { item: 'Firm Tofu', amount: '1', unit: 'block' },
          { item: 'Broccoli Florets', amount: '2', unit: 'cups' },
          { item: 'Garlic Cloves', amount: '3', unit: 'cloves' },
        ],
        instructions: ['Fry tofu and vegetables.'],
        timesMade: 2,
        createdAt: new Date(),
      },
    ];

    function searchRecipes(recipes: Recipe[], query: string) {
      const q = query.toLowerCase().trim();
      return recipes.filter((recipe) => {
        const matchName = !q || recipe.name?.toLowerCase().includes(q);
        const matchTags = !q || recipe.tags?.some((tag) => tag.toLowerCase().includes(q));
        const matchDietaryTags = !q || recipe.dietaryTags?.some((tag) => tag.toLowerCase().includes(q));
        const matchIngredients = !q || recipe.ingredients?.some((ing) => (ing.item || ing.name || '')?.toLowerCase().includes(q));
        return matchName || matchTags || matchDietaryTags || matchIngredients;
      });
    }

    it('matches recipes by ingredient name (e.g. "garlic")', () => {
      const results = searchRecipes(testRecipes, 'garlic');
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].id, 'r2');
    });

    it('matches recipes by ingredient name (e.g. "mushrooms")', () => {
      const results = searchRecipes(testRecipes, 'mushrooms');
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].id, 'r1');
    });

    it('matches recipes by title (e.g. "risotto")', () => {
      const results = searchRecipes(testRecipes, 'risotto');
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].id, 'r1');
    });

    it('matches recipes by tag (e.g. "asian")', () => {
      const results = searchRecipes(testRecipes, 'asian');
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].id, 'r2');
    });

    it('returns empty array when query does not match any name, tag, or ingredient', () => {
      const results = searchRecipes(testRecipes, 'pineapple');
      assert.strictEqual(results.length, 0);
    });
  });

  describe('3. Redirect Intent Preservation Logic', () => {
    function resolveLoginRedirect(searchParams: URLSearchParams): string {
      return searchParams.get('redirect') || '/dashboard';
    }

    it('returns redirect query parameter if present', () => {
      const params = new URLSearchParams('redirect=%2Fmeal-plan');
      assert.strictEqual(resolveLoginRedirect(params), '/meal-plan');
    });

    it('returns redirect query parameter with sub-paths', () => {
      const params = new URLSearchParams('redirect=%2Frecipes%2Frecipe_123');
      assert.strictEqual(resolveLoginRedirect(params), '/recipes/recipe_123');
    });

    it('falls back to /dashboard if redirect param is missing', () => {
      const params = new URLSearchParams('');
      assert.strictEqual(resolveLoginRedirect(params), '/dashboard');
    });
  });
});
