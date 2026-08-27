/**
 * Milestone 3 Unit Tests: Ingredient Parser & Shopping Aggregator Engine
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  parseFractionOrAmount,
  formatQuantityDisplay,
  normalizeUnit,
  categorizeIngredientDepartment,
  GROCERY_DEPARTMENTS,
} from '../src/lib/ingredient-parser.ts';
import {
  aggregateMealPlanIngredients,
  aggregateRecipeIngredients,
  mergeShoppingListWithCustomItems,
} from '../src/lib/shopping-aggregator.ts';
import type { Recipe, MealPlan, ShoppingListItem } from '../src/types/index.ts';

describe('Milestone 3: Unit Tests — Ingredient Parser & Aggregator', () => {
  describe('Ingredient Math & Fraction Parser', () => {
    it('parses vulgar fractions accurately', () => {
      assert.strictEqual(parseFractionOrAmount('½'), 0.5);
      assert.strictEqual(parseFractionOrAmount('¼'), 0.25);
      assert.strictEqual(parseFractionOrAmount('¾'), 0.75);
      assert.strictEqual(parseFractionOrAmount('⅛'), 0.125);
      assert.strictEqual(parseFractionOrAmount('⅜'), 0.375);
      assert.strictEqual(parseFractionOrAmount('⅝'), 0.625);
      assert.strictEqual(parseFractionOrAmount('⅞'), 0.875);
      assert.ok(Math.abs(parseFractionOrAmount('⅓') - 0.333) < 0.01);
      assert.ok(Math.abs(parseFractionOrAmount('⅔') - 0.667) < 0.01);
      assert.strictEqual(parseFractionOrAmount('1 ½'), 1.5);
    });

    it('parses mixed and simple fraction strings', () => {
      assert.strictEqual(parseFractionOrAmount('1/2'), 0.5);
      assert.strictEqual(parseFractionOrAmount('1 1/2'), 1.5);
      assert.strictEqual(parseFractionOrAmount('1-1/2'), 1.5);
      assert.strictEqual(parseFractionOrAmount('2 3/4'), 2.75);
      assert.strictEqual(parseFractionOrAmount('3 1/4'), 3.25);
      assert.strictEqual(parseFractionOrAmount('1/16'), 0.0625);
    });

    it('parses range strings by taking the conservative upper bound', () => {
      assert.strictEqual(parseFractionOrAmount('2-3'), 3);
      assert.strictEqual(parseFractionOrAmount('1 to 2'), 2);
      assert.strictEqual(parseFractionOrAmount('1/2 - 1'), 1);
    });

    it('handles edge cases (null, undefined, 0, non-numeric strings)', () => {
      assert.strictEqual(parseFractionOrAmount(null), 1);
      assert.strictEqual(parseFractionOrAmount(undefined), 1);
      assert.strictEqual(parseFractionOrAmount(''), 1);
      assert.strictEqual(parseFractionOrAmount('0'), 0);
      assert.strictEqual(parseFractionOrAmount(0), 0);
      assert.strictEqual(parseFractionOrAmount('pinch'), 1);
    });

    it('formats quantities back into clean human-friendly fractions', () => {
      assert.strictEqual(formatQuantityDisplay(0.5, 'cup'), '1/2 cup');
      assert.strictEqual(formatQuantityDisplay(1.5, 'cups'), '1 1/2 cups');
      assert.strictEqual(formatQuantityDisplay(2.25, 'lbs'), '2 1/4 lbs');
      assert.strictEqual(formatQuantityDisplay(0.75, 'tbsp'), '3/4 tbsp');
      assert.strictEqual(formatQuantityDisplay(3, 'cloves'), '3 cloves');
      assert.strictEqual(formatQuantityDisplay(0, 'tsp'), '0 tsp');
      assert.strictEqual(formatQuantityDisplay(null, 'items'), 'items');
    });
  });

  describe('Unit Normalizer & Hierarchies', () => {
    it('normalizes volume variations', () => {
      assert.strictEqual(normalizeUnit('tablespoon').normalizedUnit, 'tbsp');
      assert.strictEqual(normalizeUnit('tablespoons').normalizedUnit, 'tbsp');
      assert.strictEqual(normalizeUnit('Tbs').normalizedUnit, 'tbsp');
      assert.strictEqual(normalizeUnit('teaspoon').normalizedUnit, 'tsp');
      assert.strictEqual(normalizeUnit('tsp').normalizedUnit, 'tsp');
      assert.strictEqual(normalizeUnit('cups').normalizedUnit, 'cups');
      assert.strictEqual(normalizeUnit('fluid ounce').normalizedUnit, 'fl oz');
      assert.strictEqual(normalizeUnit('milliliters').normalizedUnit, 'ml');
      assert.strictEqual(normalizeUnit('liters').normalizedUnit, 'liters');
    });

    it('normalizes weight variations', () => {
      assert.strictEqual(normalizeUnit('pound').normalizedUnit, 'lbs');
      assert.strictEqual(normalizeUnit('lbs').normalizedUnit, 'lbs');
      assert.strictEqual(normalizeUnit('ounce').normalizedUnit, 'oz');
      assert.strictEqual(normalizeUnit('grams').normalizedUnit, 'g');
      assert.strictEqual(normalizeUnit('kg').normalizedUnit, 'kg');
    });

    it('normalizes discrete counts', () => {
      assert.strictEqual(normalizeUnit('cloves').normalizedUnit, 'cloves');
      assert.strictEqual(normalizeUnit('slices').normalizedUnit, 'slices');
      assert.strictEqual(normalizeUnit('cans').normalizedUnit, 'cans');
      assert.strictEqual(normalizeUnit('bunches').normalizedUnit, 'bunches');
    });
  });

  describe('Department Categorization (8 Standard Departments)', () => {
    it('has exactly 8 departments in correct order', () => {
      assert.strictEqual(GROCERY_DEPARTMENTS.length, 8);
      assert.deepStrictEqual(GROCERY_DEPARTMENTS, [
        'Produce',
        'Dairy',
        'Meat/Seafood',
        'Pantry',
        'Spices/Seasonings',
        'Bakery',
        'Frozen',
        'Other',
      ]);
    });

    it('correctly maps produce items', () => {
      assert.strictEqual(categorizeIngredientDepartment('Yellow Onion'), 'Produce');
      assert.strictEqual(categorizeIngredientDepartment('Garlic Cloves'), 'Produce');
      assert.strictEqual(categorizeIngredientDepartment('Fresh Cilantro'), 'Produce');
      assert.strictEqual(categorizeIngredientDepartment('Ripe Avocados'), 'Produce');
      assert.strictEqual(categorizeIngredientDepartment('Jalapeño Pepper'), 'Produce');
    });

    it('correctly maps dairy items', () => {
      assert.strictEqual(categorizeIngredientDepartment('Whole Milk'), 'Dairy');
      assert.strictEqual(categorizeIngredientDepartment('Pecorino Romano'), 'Dairy');
      assert.strictEqual(categorizeIngredientDepartment('Large Eggs'), 'Dairy');
      assert.strictEqual(categorizeIngredientDepartment('Unsalted Butter'), 'Dairy');
    });

    it('correctly maps meat and seafood items', () => {
      assert.strictEqual(categorizeIngredientDepartment('Beef Chuck Roast'), 'Meat/Seafood');
      assert.strictEqual(categorizeIngredientDepartment('Fresh Salmon Fillets'), 'Meat/Seafood');
      assert.strictEqual(categorizeIngredientDepartment('Ground Beef'), 'Meat/Seafood');
      assert.strictEqual(categorizeIngredientDepartment('Guanciale'), 'Meat/Seafood');
      assert.strictEqual(categorizeIngredientDepartment('Chicken Breast'), 'Meat/Seafood');
    });

    it('correctly maps bakery, pantry, spices, and frozen items', () => {
      assert.strictEqual(categorizeIngredientDepartment('Artisan Sourdough Bread'), 'Bakery');
      assert.strictEqual(categorizeIngredientDepartment('Corn Tortillas'), 'Bakery');
      assert.strictEqual(categorizeIngredientDepartment('Extra Virgin Olive Oil'), 'Pantry');
      assert.strictEqual(categorizeIngredientDepartment('Tricolor Quinoa'), 'Pantry');
      assert.strictEqual(categorizeIngredientDepartment('Smoked Paprika'), 'Spices/Seasonings');
      assert.strictEqual(categorizeIngredientDepartment('Kosher Salt'), 'Spices/Seasonings');
      assert.strictEqual(categorizeIngredientDepartment('Puff Pastry'), 'Frozen');
      assert.strictEqual(categorizeIngredientDepartment('Unknown Rare Ingredient'), 'Other');
    });
  });

  describe('Shopping List Aggregator', () => {
    const recipeA: Recipe = {
      id: 'rec_1',
      name: 'Spaghetti Carbonara',
      description: 'Classic pasta',
      source: 'manual',
      prepTimeMinutes: 10,
      cookTimeMinutes: 15,
      servings: 4,
      difficulty: 'medium',
      tags: ['pasta'],
      ingredients: [
        { item: 'Spaghetti', amount: '1', unit: 'lb', category: 'pantry' },
        { item: 'Eggs', amount: '4', unit: 'items', category: 'dairy' },
        { item: 'Black Pepper', amount: '1', unit: 'tsp', category: 'spices' },
        { item: 'Olive Oil', amount: '2', unit: 'tbsp', category: 'pantry' },
      ],
      instructions: ['Cook pasta'],
      timesMade: 1,
      createdAt: new Date(),
    };

    const recipeB: Recipe = {
      id: 'rec_2',
      name: 'Avocado Toast',
      description: 'Quick breakfast',
      source: 'manual',
      prepTimeMinutes: 5,
      cookTimeMinutes: 5,
      servings: 2,
      difficulty: 'easy',
      tags: ['breakfast'],
      ingredients: [
        { item: 'Eggs', amount: '2', unit: 'items', category: 'dairy' },
        { item: 'Sourdough Bread', amount: '4', unit: 'slices', category: 'bakery' },
        { item: 'Olive Oil', amount: '1', unit: 'tbsp', category: 'pantry' },
        { item: 'Avocado', amount: '2', unit: 'items', category: 'produce' },
      ],
      instructions: ['Toast bread'],
      timesMade: 1,
      createdAt: new Date(),
    };

    it('aggregates ingredients from meal plan with duplicate summing', () => {
      const mealPlan: MealPlan = {
        id: '2026-W35',
        weekStart: new Date(),
        createdAt: new Date(),
        meals: {
          monday: { dinner: { recipeId: 'rec_1', recipeName: 'Spaghetti Carbonara' } },
          tuesday: { breakfast: { recipeId: 'rec_2', recipeName: 'Avocado Toast' } },
          wednesday: {},
          thursday: {},
          friday: {},
          saturday: {},
          sunday: {},
        },
      };

      const recipesMap = new Map<string, Recipe>([
        ['rec_1', recipeA],
        ['rec_2', recipeB],
      ]);

      const items = aggregateMealPlanIngredients(mealPlan, recipesMap);

      // Check Eggs (4 + 2 = 6)
      const eggItem = items.find((i) => i.name.toLowerCase() === 'eggs');
      assert.ok(eggItem);
      assert.strictEqual(eggItem.amount, 6);
      assert.strictEqual(eggItem.unit, 'items');
      assert.strictEqual(eggItem.category, 'Dairy');
      assert.strictEqual(eggItem.recipeIds.length, 2);
      assert.ok(eggItem.recipeTitles.includes('Spaghetti Carbonara'));
      assert.ok(eggItem.recipeTitles.includes('Avocado Toast'));

      // Check Olive Oil (2 + 1 = 3 tbsp)
      const oilItem = items.find((i) => i.name.toLowerCase() === 'olive oil');
      assert.ok(oilItem);
      assert.strictEqual(oilItem.amount, 3);
      assert.strictEqual(oilItem.unit, 'tbsp');
      assert.strictEqual(oilItem.category, 'Pantry');
    });

    it('aggregates single recipe ingredients directly', () => {
      const items = aggregateRecipeIngredients(recipeA);
      assert.strictEqual(items.length, 4);
      assert.strictEqual(items[0].name, 'Spaghetti');
      assert.strictEqual(items[0].amount, 1);
      assert.strictEqual(items[0].recipeIds[0], 'rec_1');
    });

    it('preserves custom items and checked states when re-aggregating', () => {
      const existingItems: ShoppingListItem[] = [
        {
          id: 'custom_1',
          name: 'Paper Towels',
          amount: 2,
          unit: 'rolls',
          displayAmount: '2 rolls',
          category: 'Other',
          checked: false,
          recipeIds: [],
          recipeTitles: [],
          isCustom: true,
          createdAt: new Date(),
        },
        {
          id: 'item_agg_1',
          name: 'Spaghetti',
          amount: 1,
          unit: 'lbs',
          displayAmount: '1 lbs',
          category: 'Pantry',
          checked: true, // checked by user in store
          recipeIds: ['rec_1'],
          recipeTitles: ['Spaghetti Carbonara'],
          isCustom: false,
          createdAt: new Date(),
        },
      ];

      const newPlanItems: ShoppingListItem[] = [
        {
          id: 'item_agg_new',
          name: 'Spaghetti',
          amount: 2,
          unit: 'lbs',
          displayAmount: '2 lbs',
          category: 'Pantry',
          checked: false,
          recipeIds: ['rec_1', 'rec_3'],
          recipeTitles: ['Spaghetti Carbonara', 'Bolognese'],
          isCustom: false,
          createdAt: new Date(),
        },
      ];

      const merged = mergeShoppingListWithCustomItems(existingItems, newPlanItems);

      // Custom item preserved
      assert.ok(merged.some((i) => i.name === 'Paper Towels' && i.isCustom));
      // Checked state preserved for matching item
      const mergedSpaghetti = merged.find((i) => i.name === 'Spaghetti');
      assert.ok(mergedSpaghetti);
      assert.strictEqual(mergedSpaghetti.checked, true);
    });
  });
});
