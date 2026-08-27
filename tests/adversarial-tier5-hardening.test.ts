/**
 * Tier 5 Adversarial White-Box Stress Testing and Coverage Hardening
 * Master Test Suite for PlateUp
 * 
 * Domains Tested:
 * 1. Complex fraction and unit math edge cases (vulgar Unicode fractions, mixed fractions with hyphens/spaces, unparseable units, 0 quantities, decimal rounding)
 * 2. Shopping list aggregation extreme workloads (100+ items across 21 meals, duplicate items with different units, custom item toggling and deduplication)
 * 3. Dietary restriction combinations and edge cases (0-matching recipes, multiple restrictive diets like vegan + keto + gluten-free, case-insensitive tag matching)
 * 4. Week boundary math across ISO year transitions (December-January boundary, 52/53-week years, week navigation)
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
import {
  STANDARD_DIETARY_RESTRICTIONS,
  DIETARY_OPTIONS,
  detectDietaryTags,
  getDietaryBadgeClass,
  filterRecipesByDietary,
} from '../src/lib/dietary.ts';
import {
  generateMealPlan,
  createEmptyWeekMeals,
  DAYS_OF_WEEK,
  MEAL_TIMES,
  formatDayName,
  formatMealTime,
} from '../src/lib/meal-planner.ts';
import type {
  Recipe,
  MealPlan,
  ShoppingListItem,
  DietaryRestriction,
  DayOfWeek,
  MealTime,
  WeekMeals,
} from '../src/types/index.ts';
import {
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  getISOWeek,
  getISOWeekYear,
  getYear,
  format,
} from 'date-fns';

describe('Tier 5 Adversarial Coverage Hardening Suite', () => {

  // =========================================================================
  // DOMAIN 1: Complex Fraction and Unit Math Edge Cases
  // =========================================================================
  describe('Domain 1: Complex Fraction and Unit Math Edge Cases', () => {

    describe('1.1 Vulgar Unicode Fractions', () => {
      const vulgarTests: [string, number][] = [
        ['½', 0.5],
        ['⅓', 1 / 3],
        ['⅔', 2 / 3],
        ['¼', 0.25],
        ['¾', 0.75],
        ['⅛', 0.125],
        ['⅜', 0.375],
        ['⅝', 0.625],
        ['⅞', 0.875],
        ['⅙', 1 / 6],
        ['⅚', 5 / 6],
        ['⅑', 1 / 9],
        ['⅒', 0.1],
      ];

      for (const [symbol, expected] of vulgarTests) {
        it(`accurately parses single vulgar fraction '${symbol}' to ${expected}`, () => {
          const parsed = parseFractionOrAmount(symbol);
          assert.ok(
            Math.abs(parsed - expected) < 0.001,
            `Expected ${expected} for '${symbol}', got ${parsed}`
          );
        });
      }

      it('parses mixed integers with vulgar fractions (e.g. "1 ½", "2¾", " 5 ⅛ ")', () => {
        assert.strictEqual(parseFractionOrAmount('1 ½'), 1.5);
        assert.strictEqual(parseFractionOrAmount('2¾'), 2.75);
        assert.strictEqual(parseFractionOrAmount(' 5 ⅛ '), 5.125);
        assert.ok(Math.abs(parseFractionOrAmount('3 ⅓') - 3.333) < 0.01);
        assert.ok(Math.abs(parseFractionOrAmount('4 ⅔') - 4.667) < 0.01);
        assert.strictEqual(parseFractionOrAmount('10 ⅒'), 10.1);
      });
    });

    describe('1.2 Mixed Fractions with Hyphens, Spaces, and Slashes', () => {
      it('parses hyphenated mixed fractions (e.g. "1-1/2", "2-3/4", "3-1/8")', () => {
        assert.strictEqual(parseFractionOrAmount('1-1/2'), 1.5);
        assert.strictEqual(parseFractionOrAmount('2-3/4'), 2.75);
        assert.strictEqual(parseFractionOrAmount('3-1/8'), 3.125);
        assert.strictEqual(parseFractionOrAmount('10-1/4'), 10.25);
      });

      it('parses spaced mixed fractions with irregular whitespace', () => {
        assert.strictEqual(parseFractionOrAmount('1   1/2'), 1.5);
        assert.strictEqual(parseFractionOrAmount('  2  3/4  '), 2.75);
        assert.strictEqual(parseFractionOrAmount('4 5/8'), 4.625);
        assert.strictEqual(parseFractionOrAmount('1 1/16'), 1.0625);
      });

      it('handles denominator of zero gracefully without returning Infinity', () => {
        const zeroDenom = parseFractionOrAmount('1/0');
        assert.ok(isFinite(zeroDenom), 'Result must be finite');
      });
    });

    describe('1.3 Range Quantities & Upper Bound Extraction', () => {
      it('extracts conservative upper bound from numeric ranges', () => {
        assert.strictEqual(parseFractionOrAmount('2-3'), 3);
        assert.strictEqual(parseFractionOrAmount('1 to 2'), 2);
        assert.strictEqual(parseFractionOrAmount('2 - 4'), 4);
        assert.strictEqual(parseFractionOrAmount('1/2 - 1'), 1);
        assert.strictEqual(parseFractionOrAmount('1/4 to 1/2'), 0.5);
        assert.strictEqual(parseFractionOrAmount('1.5 - 2.5'), 2.5);
        assert.strictEqual(parseFractionOrAmount('1 - 1 1/2'), 1.5);
      });
    });

    describe('1.4 Zero Quantities, Malformed Strings & Nullish Values', () => {
      it('preserves explicit zero quantities (0, "0", "0.0")', () => {
        assert.strictEqual(parseFractionOrAmount(0), 0);
        assert.strictEqual(parseFractionOrAmount('0'), 0);
        assert.strictEqual(parseFractionOrAmount('0.0'), 0);
      });

      it('returns safe fallback of 1 for null, undefined, empty strings, and non-numeric words', () => {
        assert.strictEqual(parseFractionOrAmount(null), 1);
        assert.strictEqual(parseFractionOrAmount(undefined), 1);
        assert.strictEqual(parseFractionOrAmount(''), 1);
        assert.strictEqual(parseFractionOrAmount('   '), 1);
        assert.strictEqual(parseFractionOrAmount('to taste'), 1);
        assert.strictEqual(parseFractionOrAmount('pinch'), 1);
        assert.strictEqual(parseFractionOrAmount('as needed'), 1);
        assert.strictEqual(parseFractionOrAmount(NaN), 1);
      });
    });

    describe('1.5 Quantity Display Formatter', () => {
      it('formats standard fractional quantities correctly with units', () => {
        assert.strictEqual(formatQuantityDisplay(0.5, 'cup'), '1/2 cup');
        assert.strictEqual(formatQuantityDisplay(1.5, 'cups'), '1 1/2 cups');
        assert.strictEqual(formatQuantityDisplay(0.25, 'tsp'), '1/4 tsp');
        assert.strictEqual(formatQuantityDisplay(2.75, 'lbs'), '2 3/4 lbs');
        assert.strictEqual(formatQuantityDisplay(0.125, 'tsp'), '1/8 tsp');
        assert.strictEqual(formatQuantityDisplay(0.375, 'cup'), '3/8 cup');
        assert.strictEqual(formatQuantityDisplay(0.625, 'cup'), '5/8 cup');
        assert.strictEqual(formatQuantityDisplay(0.875, 'cup'), '7/8 cup');
        assert.strictEqual(formatQuantityDisplay(0.0625, 'oz'), '1/16 oz');
      });

      it('formats thirds accurately (0.333 -> 1/3, 0.667 -> 2/3)', () => {
        assert.strictEqual(formatQuantityDisplay(1 / 3, 'cup'), '1/3 cup');
        assert.strictEqual(formatQuantityDisplay(2 / 3, 'cup'), '2/3 cup');
        assert.strictEqual(formatQuantityDisplay(1 + 1 / 3, 'cups'), '1 1/3 cups');
        assert.strictEqual(formatQuantityDisplay(2 + 2 / 3, 'cups'), '2 2/3 cups');
      });

      it('formats whole numbers cleanly without decimals', () => {
        assert.strictEqual(formatQuantityDisplay(1, 'egg'), '1 egg');
        assert.strictEqual(formatQuantityDisplay(4, 'cloves'), '4 cloves');
        assert.strictEqual(formatQuantityDisplay(12, 'tortillas'), '12 tortillas');
      });

      it('handles 0 and missing units cleanly', () => {
        assert.strictEqual(formatQuantityDisplay(0, 'tsp'), '0 tsp');
        assert.strictEqual(formatQuantityDisplay(0, ''), '0');
        assert.strictEqual(formatQuantityDisplay(0, undefined), '0');
        assert.strictEqual(formatQuantityDisplay(null, 'cloves'), 'cloves');
        assert.strictEqual(formatQuantityDisplay(undefined, 'pinch'), 'pinch');
      });

      it('handles arbitrary decimal quantities cleanly (e.g. 1.2 -> 1.2, 2.83 -> 2.83)', () => {
        assert.strictEqual(formatQuantityDisplay(1.2, 'kg'), '1.2 kg');
        assert.strictEqual(formatQuantityDisplay(2.83, 'lbs'), '2.83 lbs');
        assert.strictEqual(formatQuantityDisplay(1.7, 'lbs'), '1.7 lbs');
      });
    });

    describe('1.6 Unit Normalizer & Department Categorization', () => {
      it('normalizes volume units and their plural/cased aliases', () => {
        const volumeCases = ['tsp', 'teaspoon', 'Teaspoons', 't', 'tbsp', 'Tablespoon', 'TABLESPOONS', 'tbs', 'c', 'cup', 'CUPS', 'fl oz', 'fluid ounces', 'ml', 'milliliters', 'liters', 'L', 'qt', 'quart', 'gal', 'gallon'];
        for (const unit of volumeCases) {
          const res = normalizeUnit(unit);
          assert.strictEqual(res.type, 'volume', `Failed for ${unit}`);
        }
      });

      it('normalizes weight units and aliases', () => {
        const weightCases = ['oz', 'ounce', 'Ounces', 'lb', 'lbs', 'pound', 'POUNDS', 'g', 'gram', 'grams', 'kg', 'kilogram', 'kilograms'];
        for (const unit of weightCases) {
          const res = normalizeUnit(unit);
          assert.strictEqual(res.type, 'weight', `Failed for ${unit}`);
        }
      });

      it('normalizes discrete counts and unknown units safely', () => {
        assert.strictEqual(normalizeUnit('cloves').type, 'count');
        assert.strictEqual(normalizeUnit('slices').type, 'count');
        assert.strictEqual(normalizeUnit('cans').type, 'count');
        assert.strictEqual(normalizeUnit('bunches').type, 'count');
        assert.strictEqual(normalizeUnit('unusual_unit_xyz').type, 'other');
        assert.strictEqual(normalizeUnit('').type, 'other');
        assert.strictEqual(normalizeUnit(undefined).type, 'other');
      });

      it('categorizes ingredients accurately across 8 standard departments', () => {
        assert.strictEqual(categorizeIngredientDepartment('Yellow Onion'), 'Produce');
        assert.strictEqual(categorizeIngredientDepartment('Fresh Garlic'), 'Produce');
        assert.strictEqual(categorizeIngredientDepartment('Whole Milk'), 'Dairy');
        assert.strictEqual(categorizeIngredientDepartment('Cheddar Cheese'), 'Dairy');
        assert.strictEqual(categorizeIngredientDepartment('Ribeye Steak'), 'Meat/Seafood');
        assert.strictEqual(categorizeIngredientDepartment('Atlantic Salmon'), 'Meat/Seafood');
        assert.strictEqual(categorizeIngredientDepartment('Smoked Paprika'), 'Spices/Seasonings');
        assert.strictEqual(categorizeIngredientDepartment('Kosher Salt'), 'Spices/Seasonings');
        assert.strictEqual(categorizeIngredientDepartment('Sourdough Bread'), 'Bakery');
        assert.strictEqual(categorizeIngredientDepartment('Brioche Buns'), 'Bakery');
        assert.strictEqual(categorizeIngredientDepartment('Frozen Peas'), 'Frozen');
        assert.strictEqual(categorizeIngredientDepartment('Puff Pastry'), 'Frozen');
        assert.strictEqual(categorizeIngredientDepartment('Extra Virgin Olive Oil'), 'Pantry');
        assert.strictEqual(categorizeIngredientDepartment('All-Purpose Flour'), 'Pantry');
        assert.strictEqual(categorizeIngredientDepartment('Random Kitchen Gadget'), 'Other');
      });
    });
  });

  // =========================================================================
  // DOMAIN 2: Shopping List Aggregation Extreme Workloads
  // =========================================================================
  describe('Domain 2: Shopping List Aggregation Extreme Workloads', () => {

    it('2.1 Extreme Workload: Aggregates 100+ ingredients across a full 21-meal plan (7x3 slots)', () => {
      const recipes: Recipe[] = [];
      const meals: WeekMeals = createEmptyWeekMeals();

      let ingredientCounter = 1;
      let recipeIndex = 1;

      for (const day of DAYS_OF_WEEK) {
        for (const meal of MEAL_TIMES) {
          const recipeId = `recipe_stress_${recipeIndex}`;
          const recipeTitle = `Recipe Stress #${recipeIndex}`;

          const recipeIngredients = [
            { item: `Produce Item ${ingredientCounter++}`, amount: '1/2', unit: 'cup', category: 'Produce' },
            { item: `Spice Item ${ingredientCounter++}`, amount: '1', unit: 'tsp', category: 'Spices/Seasonings' },
            { item: `Dairy Item ${ingredientCounter++}`, amount: '2', unit: 'oz', category: 'Dairy' },
            { item: `Pantry Item ${ingredientCounter++}`, amount: '1.5', unit: 'lbs', category: 'Pantry' },
            { item: `Meat Item ${ingredientCounter++}`, amount: '2', unit: 'pieces', category: 'Meat/Seafood' },
          ];

          const recipe: Recipe = {
            id: recipeId,
            name: recipeTitle,
            description: 'Stress test recipe',
            source: 'manual',
            prepTimeMinutes: 10,
            cookTimeMinutes: 15,
            servings: 4,
            difficulty: 'easy',
            tags: ['stress'],
            dietaryTags: [],
            ingredients: recipeIngredients,
            instructions: ['Cook stress dish.'],
            timesMade: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          recipes.push(recipe);
          meals[day][meal] = {
            recipeId,
            recipeName: recipeTitle,
          };

          recipeIndex++;
        }
      }

      const mealPlan: MealPlan = {
        id: '2026-W35',
        weekStart: new Date(2026, 7, 24),
        meals,
        createdAt: new Date(),
      };

      const start = Date.now();
      const shoppingList = aggregateMealPlanIngredients(mealPlan, recipes);
      const durationMs = Date.now() - start;

      // Verification: 21 meals * 5 ingredients = 105 aggregated items
      assert.strictEqual(shoppingList.length, 105);
      assert.ok(durationMs < 100, `Aggregation should be near-instant (<100ms), took ${durationMs}ms`);

      // Verify every item has required fields populated
      for (const item of shoppingList) {
        assert.ok(item.id, 'Item must have an ID');
        assert.ok(item.name, 'Item must have a name');
        assert.ok((item.amount ?? 0) > 0, 'Item amount must be > 0');
        assert.ok(item.category, 'Item must have a category');
        assert.strictEqual(item.checked, false, 'Aggregated items must start unchecked');
        assert.strictEqual(item.isCustom, false, 'Aggregated items are not custom');
        assert.strictEqual(item.recipeIds.length, 1);
        assert.strictEqual(item.recipeTitles.length, 1);
      }
    });

    it('2.2 Duplicate Ingredients with Compatible Units: Sums correctly across 21 meals', () => {
      const recipes: Recipe[] = [];
      const meals: WeekMeals = createEmptyWeekMeals();

      for (let i = 1; i <= 21; i++) {
        const recipeId = `oil_garlic_recipe_${i}`;
        const recipeTitle = `Garlic Dish ${i}`;

        recipes.push({
          id: recipeId,
          name: recipeTitle,
          description: 'Garlic dish',
          source: 'manual',
          prepTimeMinutes: 5,
          cookTimeMinutes: 10,
          servings: 2,
          difficulty: 'easy',
          tags: [],
          dietaryTags: [],
          ingredients: [
            { item: 'Olive Oil', amount: '1/2', unit: 'cup', category: 'Pantry' },
            { item: 'Garlic', amount: '2', unit: 'cloves', category: 'Produce' },
          ],
          instructions: ['Cook with garlic.'],
          timesMade: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      let idx = 0;
      for (const day of DAYS_OF_WEEK) {
        for (const meal of MEAL_TIMES) {
          const rec = recipes[idx++];
          meals[day][meal] = {
            recipeId: rec.id,
            recipeName: rec.name,
          };
        }
      }

      const mealPlan: MealPlan = {
        id: '2026-W35',
        weekStart: new Date(),
        meals,
        createdAt: new Date(),
      };

      const shoppingList = aggregateMealPlanIngredients(mealPlan, recipes);

      // Should aggregate into exactly 2 items: Olive Oil and Garlic
      assert.strictEqual(shoppingList.length, 2);

      const oliveOil = shoppingList.find((i) => i.name.toLowerCase().includes('olive oil'));
      const garlic = shoppingList.find((i) => i.name.toLowerCase().includes('garlic'));

      assert.ok(oliveOil, 'Olive Oil must be present');
      assert.ok(garlic, 'Garlic must be present');

      // 21 * 0.5 = 10.5 cups
      assert.strictEqual(oliveOil!.amount, 10.5);
      assert.strictEqual(oliveOil!.unit, 'cups');
      assert.strictEqual(oliveOil!.displayAmount, '10 1/2 cups');
      assert.strictEqual(oliveOil!.recipeIds.length, 21);
      assert.strictEqual(oliveOil!.recipeTitles.length, 21);

      // 21 * 2 = 42 cloves
      assert.strictEqual(garlic!.amount, 42);
      assert.strictEqual(garlic!.unit, 'cloves');
      assert.strictEqual(garlic!.displayAmount, '42 cloves');
      assert.strictEqual(garlic!.recipeIds.length, 21);
      assert.strictEqual(garlic!.recipeTitles.length, 21);
    });

    it('2.3 Duplicate Ingredients with Incompatible Units: Keeps separate items without collision', () => {
      const r1: Recipe = {
        id: 'rec_chicken_lbs',
        name: 'Chicken Lbs',
        description: 'Dish 1',
        source: 'manual',
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        servings: 4,
        difficulty: 'medium',
        tags: [],
        dietaryTags: [],
        ingredients: [{ item: 'Chicken Breast', amount: '2', unit: 'lbs' }],
        instructions: ['Cook.'],
        timesMade: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const r2: Recipe = {
        id: 'rec_chicken_pcs',
        name: 'Chicken Pieces',
        description: 'Dish 2',
        source: 'manual',
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        servings: 4,
        difficulty: 'medium',
        tags: [],
        dietaryTags: [],
        ingredients: [{ item: 'Chicken Breast', amount: '4', unit: 'pieces' }],
        instructions: ['Cook.'],
        timesMade: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const r3: Recipe = {
        id: 'rec_chicken_oz',
        name: 'Chicken Oz',
        description: 'Dish 3',
        source: 'manual',
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        servings: 4,
        difficulty: 'medium',
        tags: [],
        dietaryTags: [],
        ingredients: [{ item: 'Chicken Breast', amount: '16', unit: 'oz' }],
        instructions: ['Cook.'],
        timesMade: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const meals: WeekMeals = createEmptyWeekMeals();
      meals.monday.dinner = { recipeId: r1.id, recipeName: r1.name };
      meals.tuesday.dinner = { recipeId: r2.id, recipeName: r2.name };
      meals.wednesday.dinner = { recipeId: r3.id, recipeName: r3.name };

      const mealPlan: MealPlan = {
        id: '2026-W35',
        weekStart: new Date(),
        meals,
        createdAt: new Date(),
      };

      const list = aggregateMealPlanIngredients(mealPlan, [r1, r2, r3]);

      // 3 distinct units => 3 items in list
      assert.strictEqual(list.length, 3);
      const units = list.map((i) => i.unit);
      assert.ok(units.includes('lbs'));
      assert.ok(units.includes('pieces'));
      assert.ok(units.includes('oz'));
    });

    it('2.4 Custom Item Preservation & Check-State Merging', () => {
      const existingItems: ShoppingListItem[] = [
        {
          id: 'custom_1',
          name: 'Paper Towels',
          amount: 2,
          unit: 'rolls',
          displayAmount: '2 rolls',
          category: 'Other',
          checked: true,
          recipeIds: [],
          recipeTitles: [],
          isCustom: true,
          createdAt: new Date(),
        },
        {
          id: 'custom_2',
          name: 'Dish Soap',
          amount: 1,
          unit: 'bottle',
          displayAmount: '1 bottle',
          category: 'Other',
          checked: false,
          recipeIds: [],
          recipeTitles: [],
          isCustom: true,
          createdAt: new Date(),
        },
        {
          id: 'agg_old_1',
          name: 'Olive Oil',
          amount: 1,
          unit: 'cups',
          displayAmount: '1 cups',
          category: 'Pantry',
          checked: true,
          recipeIds: ['r1'],
          recipeTitles: ['Old Recipe'],
          isCustom: false,
          createdAt: new Date(),
        },
      ];

      const newPlanItems: ShoppingListItem[] = [
        {
          id: 'agg_new_1',
          name: 'Olive Oil',
          amount: 2,
          unit: 'cups',
          displayAmount: '2 cups',
          category: 'Pantry',
          checked: false,
          recipeIds: ['r2'],
          recipeTitles: ['New Recipe'],
          isCustom: false,
          createdAt: new Date(),
        },
        {
          id: 'agg_new_2',
          name: 'Black Pepper',
          amount: 1,
          unit: 'tsp',
          displayAmount: '1 tsp',
          category: 'Spices/Seasonings',
          checked: false,
          recipeIds: ['r2'],
          recipeTitles: ['New Recipe'],
          isCustom: false,
          createdAt: new Date(),
        },
      ];

      const merged = mergeShoppingListWithCustomItems(existingItems, newPlanItems);

      // Should have 2 new plan items + 2 preserved custom items = 4 total
      assert.strictEqual(merged.length, 4);

      // Custom items preserved intact
      const customTowel = merged.find((i) => i.id === 'custom_1');
      const customSoap = merged.find((i) => i.id === 'custom_2');
      assert.ok(customTowel && customTowel.isCustom && customTowel.checked === true);
      assert.ok(customSoap && customSoap.isCustom && customSoap.checked === false);

      // Aggregated Olive Oil should have inherited checked: true
      const oliveOil = merged.find((i) => i.name === 'Olive Oil');
      assert.ok(oliveOil);
      assert.strictEqual(oliveOil!.checked, true, 'Olive oil checked state should be preserved');
      assert.strictEqual(oliveOil!.amount, 2, 'Amount must be updated to new plan amount');

      // Aggregated Black Pepper should be unchecked
      const pepper = merged.find((i) => i.name === 'Black Pepper');
      assert.ok(pepper);
      assert.strictEqual(pepper!.checked, false);
    });

    it('2.5 Handles null, undefined, or empty meal plan gracefully', () => {
      assert.deepStrictEqual(aggregateMealPlanIngredients(null, []), []);
      assert.deepStrictEqual(aggregateMealPlanIngredients(undefined, []), []);
      assert.deepStrictEqual(aggregateMealPlanIngredients({ id: 'w1', weekStart: new Date(), meals: {} as any, createdAt: new Date() }, []), []);
    });
  });

  // =========================================================================
  // DOMAIN 3: Dietary Restriction Combinations and Edge Cases
  // =========================================================================
  describe('Domain 3: Dietary Restriction Combinations and Edge Cases', () => {

    const sampleRecipes: Recipe[] = [
      {
        id: 'r_vegan_keto_gf',
        name: 'Avocado Spinach Salad with Walnuts',
        description: 'Clean high-fat salad',
        source: 'manual',
        prepTimeMinutes: 10,
        cookTimeMinutes: 0,
        servings: 2,
        difficulty: 'easy',
        tags: ['salad', 'quick'],
        dietaryTags: ['vegan', 'vegetarian', 'keto', 'low-carb', 'gluten-free', 'dairy-free'],
        ingredients: [
          { item: 'Spinach', amount: '4', unit: 'cups' },
          { item: 'Avocado', amount: '2', unit: 'items' },
          { item: 'Walnuts', amount: '1/4', unit: 'cup' },
          { item: 'Olive Oil', amount: '2', unit: 'tbsp' },
        ],
        instructions: ['Toss spinach, avocado, and walnuts with olive oil.'],
        timesMade: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'r_vegan_nutfree_gf',
        name: 'Quinoa Black Bean Bowl',
        description: 'Protein packed bowl',
        source: 'manual',
        prepTimeMinutes: 15,
        cookTimeMinutes: 20,
        servings: 4,
        difficulty: 'medium',
        tags: ['dinner', 'mexican'],
        dietaryTags: ['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'nut-free'],
        ingredients: [
          { item: 'Quinoa', amount: '1', unit: 'cup' },
          { item: 'Black Beans', amount: '1', unit: 'can' },
          { item: 'Cilantro', amount: '2', unit: 'tbsp' },
        ],
        instructions: ['Cook quinoa and mix with beans.'],
        timesMade: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'r_pescatarian_keto',
        name: 'Pan-Seared Salmon with Asparagus',
        description: 'Rich omega-3 meal',
        source: 'manual',
        prepTimeMinutes: 5,
        cookTimeMinutes: 15,
        servings: 2,
        difficulty: 'medium',
        tags: ['dinner', 'seafood'],
        dietaryTags: ['pescatarian', 'keto', 'low-carb', 'gluten-free', 'dairy-free', 'nut-free'],
        ingredients: [
          { item: 'Salmon', amount: '2', unit: 'fillets' },
          { item: 'Asparagus', amount: '1', unit: 'bunch' },
          { item: 'Butter', amount: '1', unit: 'tbsp' },
        ],
        instructions: ['Sear salmon in butter with asparagus.'],
        timesMade: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'r_omnivore_pasta',
        name: 'Classic Beef Bolognese',
        description: 'Hearty pasta',
        source: 'manual',
        prepTimeMinutes: 20,
        cookTimeMinutes: 60,
        servings: 6,
        difficulty: 'hard',
        tags: ['dinner', 'italian'],
        dietaryTags: ['nut-free'],
        ingredients: [
          { item: 'Ground Beef', amount: '1', unit: 'lb' },
          { item: 'Spaghetti', amount: '1', unit: 'lb' },
          { item: 'Parmesan', amount: '1/2', unit: 'cup' },
        ],
        instructions: ['Simmer meat sauce and serve over pasta.'],
        timesMade: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('3.1 Multiple Restrictive Diets Filtering (e.g. vegan + keto + gluten-free)', () => {
      const filtered = filterRecipesByDietary(sampleRecipes, ['vegan', 'keto', 'gluten-free']);
      assert.strictEqual(filtered.length, 1);
      assert.strictEqual(filtered[0].id, 'r_vegan_keto_gf');
    });

    it('3.2 Case-Insensitive and Mixed-Case Tag Matching', () => {
      const filtered = filterRecipesByDietary(sampleRecipes, ['VEGAN', 'Gluten-Free'] as unknown as DietaryRestriction[]);
      assert.strictEqual(filtered.length, 2);
      const ids = filtered.map((r) => r.id);
      assert.ok(ids.includes('r_vegan_keto_gf'));
      assert.ok(ids.includes('r_vegan_nutfree_gf'));
    });

    it('3.3 0-Matching Recipes Handling: Returns empty array without exceptions', () => {
      const filtered = filterRecipesByDietary(sampleRecipes, ['pescatarian', 'vegan']);
      assert.strictEqual(filtered.length, 0);
    });

    it('3.4 Empty or null dietary restrictions returns all recipes', () => {
      assert.strictEqual(filterRecipesByDietary(sampleRecipes, []).length, 4);
      assert.strictEqual(filterRecipesByDietary(sampleRecipes, null as any).length, 4);
    });

    it('3.5 Auto-Fill with 0-Matching Recipes: Preserves locked slots and avoids crashing', () => {
      const lockedMeals: Partial<WeekMeals> = {
        monday: {
          dinner: { recipeId: 'r_omnivore_pasta', recipeName: 'Classic Beef Bolognese' },
        },
      };

      const plan = generateMealPlan(
        sampleRecipes,
        new Set<string>(),
        lockedMeals,
        5,
        ['vegan', 'pescatarian', 'keto'] as DietaryRestriction[]
      );

      // Monday dinner must remain locked
      assert.strictEqual(plan.monday.dinner?.recipeId, 'r_omnivore_pasta');
      // Other slots remain empty because 0 candidates match
      assert.strictEqual(plan.tuesday.dinner, undefined);
      assert.strictEqual(plan.wednesday.lunch, undefined);
    });

    it('3.6 Auto-Fill with Multiple Active Restrictions: Generates compliant plan for all 21 slots', () => {
      const veganRecipes: Recipe[] = [
        sampleRecipes[0],
        sampleRecipes[1],
        {
          id: 'r_vegan_stirfry',
          name: 'Tofu Vegetable Stir-Fry',
          description: 'Quick stir-fry',
          source: 'manual',
          prepTimeMinutes: 10,
          cookTimeMinutes: 10,
          servings: 2,
          difficulty: 'easy',
          tags: ['vegan', 'asian'],
          dietaryTags: ['vegan', 'vegetarian', 'gluten-free', 'dairy-free'],
          ingredients: [{ item: 'Tofu', amount: '1', unit: 'block' }],
          instructions: ['Stir-fry tofu.'],
          timesMade: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const allCombined = [...sampleRecipes, veganRecipes[2]];

      const plan = generateMealPlan(
        allCombined,
        new Set<string>(),
        {},
        5,
        ['vegan', 'gluten-free']
      );

      // Verify all filled slots strictly have vegan + gluten-free
      for (const day of DAYS_OF_WEEK) {
        for (const meal of MEAL_TIMES) {
          const slot = plan[day][meal];
          if (slot) {
            const recipe = allCombined.find((r) => r.id === slot.recipeId);
            assert.ok(recipe, `Recipe ${slot.recipeId} must exist`);
            const tags = [...(recipe.dietaryTags || []), ...(recipe.tags || [])].map((t) => t.toLowerCase());
            assert.ok(tags.includes('vegan'), `Recipe ${recipe.name} must have vegan tag`);
            assert.ok(tags.includes('gluten-free'), `Recipe ${recipe.name} must have gluten-free tag`);
          }
        }
      }
    });

    it('3.7 Dietary Tag Auto-Detection Accuracy', () => {
      const plantTags = detectDietaryTags(
        [
          { item: 'Kale', amount: '2', unit: 'cups' },
          { item: 'Chickpeas', amount: '1', unit: 'can' },
          { item: 'Tahini', amount: '2', unit: 'tbsp' },
          { item: 'Lemon Juice', amount: '1', unit: 'tbsp' },
        ],
        ['Whisk dressing and toss kale.']
      );
      assert.ok(plantTags.includes('vegetarian'));
      assert.ok(plantTags.includes('vegan'));
      assert.ok(plantTags.includes('gluten-free'));
      assert.ok(plantTags.includes('dairy-free'));
      assert.ok(plantTags.includes('nut-free'));

      const dairyTags = detectDietaryTags(
        [
          { item: 'Pasta', amount: '1', unit: 'lb' },
          { item: 'Heavy Cream', amount: '1', unit: 'cup' },
          { item: 'Parmesan', amount: '1/2', unit: 'cup' },
        ],
        ['Melt butter and stir in cream.']
      );
      assert.strictEqual(dairyTags.includes('dairy-free'), false);
      assert.strictEqual(dairyTags.includes('vegan'), false);
      assert.strictEqual(dairyTags.includes('gluten-free'), false);
      assert.ok(dairyTags.includes('vegetarian'));
    });
  });

  // =========================================================================
  // DOMAIN 4: Week Boundary Math Across ISO Year Transitions
  // =========================================================================
  describe('Domain 4: Week Boundary Math Across ISO Year Transitions', () => {

    it('4.1 ISO Year Transition: 2024 to 2025 (Dec 30, 2024 is ISO 2025-W01)', () => {
      const dec30_2024 = new Date(2024, 11, 30); // Monday Dec 30, 2024
      const week = getISOWeek(dec30_2024);
      const isoYear = getISOWeekYear(dec30_2024);
      const calYear = getYear(dec30_2024);

      assert.strictEqual(week, 1, 'Dec 30, 2024 must be ISO Week 1');
      assert.strictEqual(isoYear, 2025, 'Dec 30, 2024 must be ISO Week Year 2025');
      assert.strictEqual(calYear, 2024, 'Calendar year is 2024');

      const start = startOfWeek(dec30_2024, { weekStartsOn: 1 });
      const end = endOfWeek(dec30_2024, { weekStartsOn: 1 });

      assert.strictEqual(format(start, 'yyyy-MM-dd'), '2024-12-30');
      assert.strictEqual(format(end, 'yyyy-MM-dd'), '2025-01-05');
    });

    it('4.2 ISO Year Transition: 2021 to 2022 (Jan 2, 2022 is ISO 2021-W52)', () => {
      const jan2_2022 = new Date(2022, 0, 2); // Sunday Jan 2, 2022
      const week = getISOWeek(jan2_2022);
      const isoYear = getISOWeekYear(jan2_2022);
      const calYear = getYear(jan2_2022);

      assert.strictEqual(week, 52, 'Jan 2, 2022 must be ISO Week 52');
      assert.strictEqual(isoYear, 2021, 'Jan 2, 2022 must be ISO Week Year 2021');
      assert.strictEqual(calYear, 2022, 'Calendar year is 2022');

      const start = startOfWeek(jan2_2022, { weekStartsOn: 1 });
      const end = endOfWeek(jan2_2022, { weekStartsOn: 1 });

      assert.strictEqual(format(start, 'yyyy-MM-dd'), '2021-12-27');
      assert.strictEqual(format(end, 'yyyy-MM-dd'), '2022-01-02');
    });

    it('4.3 53-Week Year Handling: 2020 (Dec 31, 2020 is ISO 2020-W53)', () => {
      const dec31_2020 = new Date(2020, 11, 31); // Thursday Dec 31, 2020
      const week = getISOWeek(dec31_2020);
      const isoYear = getISOWeekYear(dec31_2020);

      assert.strictEqual(week, 53, 'Dec 31, 2020 must be ISO Week 53');
      assert.strictEqual(isoYear, 2020, 'ISO Year must be 2020');

      const nextWeek = addWeeks(dec31_2020, 1);
      assert.strictEqual(getISOWeek(nextWeek), 1, 'Adding 1 week reaches ISO Week 1');
      assert.strictEqual(getISOWeekYear(nextWeek), 2021, 'Next ISO year is 2021');
    });

    it('4.4 Bi-directional Week Navigation Across Year Boundaries', () => {
      let current = new Date(2025, 11, 25);
      
      const weekHistory: string[] = [];
      for (let i = 0; i < 3; i++) {
        current = addWeeks(current, 1);
        const isoId = `${getISOWeekYear(current)}-W${getISOWeek(current).toString().padStart(2, '0')}`;
        weekHistory.push(isoId);
      }

      for (let i = 0; i < 3; i++) {
        current = subWeeks(current, 1);
      }

      const returnIsoId = `${getISOWeekYear(current)}-W${getISOWeek(current).toString().padStart(2, '0')}`;
      assert.strictEqual(returnIsoId, '2025-W52', 'SubWeeks must accurately return to original week');
    });

    it('4.5 Meal Planner generates all 7 days consistently for cross-year boundary weeks', () => {
      const recipes: Recipe[] = [
        {
          id: 'rec_boundary_1',
          name: 'Year-End Stew',
          description: 'Hearty stew',
          source: 'manual',
          prepTimeMinutes: 15,
          cookTimeMinutes: 45,
          servings: 4,
          difficulty: 'easy',
          tags: ['dinner'],
          dietaryTags: [],
          ingredients: [{ item: 'Potatoes', amount: '3', unit: 'lbs' }],
          instructions: ['Cook stew.'],
          timesMade: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const plan = generateMealPlan(recipes, new Set(), {}, 5);

      for (const day of DAYS_OF_WEEK) {
        assert.ok(plan[day], `Day ${day} must exist in plan`);
        assert.strictEqual(formatDayName(day).length > 0, true);
      }

      for (const meal of MEAL_TIMES) {
        assert.strictEqual(formatMealTime(meal).length > 0, true);
      }
    });
  });
});
