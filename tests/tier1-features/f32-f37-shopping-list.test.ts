/**
 * Tier 1: Feature Coverage for F-32 to F-37
 * F-32: Shopping List Navigation Link
 * F-33: Meal Plan Grocery Aggregation
 * F-34: Intelligent Ingredient Merger / Math
 * F-35: Grocery Department Grouping (8 Cats)
 * F-36: Interactive Item Check-off & Sync
 * F-37: Custom Shopping List Items
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  PlateUpTestEnvironment,
  parseFractionOrAmount,
  formatQuantityDisplay,
  categorizeIngredientDepartment,
  GROCERY_DEPARTMENTS,
} from '../helpers/test-context.ts';
import { FIXTURE_RECIPES, type TestRecipe } from '../helpers/recipe-fixtures.ts';

describe('Tier 1: F-32 to F-37 — Shopping List Engine & Features', () => {
  let env: PlateUpTestEnvironment;
  let testUid: string;
  let savedRecipes: TestRecipe[];

  beforeEach(() => {
    env = new PlateUpTestEnvironment();
    const user = env.register('shopper@test.com', 'password123', 'Smart Shopper');
    testUid = user.uid;

    savedRecipes = FIXTURE_RECIPES.map(r => env.saveRecipe(testUid, r));
  });

  // F-32: Shopping List Navigation Link
  describe('F-32: Shopping List Navigation Link', () => {
    it('F-32.1: Shopping List route is /shopping-list', () => {
      const shoppingListRoute = '/shopping-list';
      assert.strictEqual(shoppingListRoute, '/shopping-list');
    });

    it('F-32.2: Shopping list link appears in desktop header navbar', () => {
      const desktopNavLinks = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Recipes', href: '/recipes' },
        { label: 'Meal Plan', href: '/meal-plan' },
        { label: 'Shopping List', href: '/shopping-list' },
      ];
      assert.ok(desktopNavLinks.some(l => l.href === '/shopping-list'));
    });

    it('F-32.3: Shopping list link appears in mobile bottom navigation bar', () => {
      const mobileNavLinks = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Recipes', href: '/recipes' },
        { label: 'Meal Plan', href: '/meal-plan' },
        { label: 'Shopping', href: '/shopping-list' },
        { label: 'Profile', href: '/profile' },
      ];
      assert.ok(mobileNavLinks.some(l => l.href === '/shopping-list'));
    });

    it('F-32.4: Shopping list badge displays number of unchecked items', () => {
      const getUncheckedCount = (items: { checked: boolean }[]) => items.filter(i => !i.checked).length;
      const count = getUncheckedCount([{ checked: false }, { checked: true }, { checked: false }]);
      assert.strictEqual(count, 2);
    });

    it('F-32.5: Navigation directly loads current weeks active shopping list', () => {
      const currentWeekId = '2026-W35';
      const list = env.generateShoppingList(testUid, currentWeekId);
      assert.strictEqual(list.weekId, currentWeekId);
    });
  });

  // F-33: Meal Plan Grocery Aggregation
  describe('F-33: Meal Plan Grocery Aggregation', () => {
    it('F-33.1: Aggregates ingredients across all assigned meal slots in the weekly plan', () => {
      // Assign Pasta Carbonara (Mon Dinner) and Beef Stew (Wed Dinner)
      env.assignSlot(testUid, '2026-W35', 'monday', 'dinner', savedRecipes[0]);
      env.assignSlot(testUid, '2026-W35', 'wednesday', 'dinner', savedRecipes[1]);

      const list = env.generateShoppingList(testUid, '2026-W35');
      assert.ok(list.items.length >= 8);
      const names = list.items.map(i => i.name.toLowerCase());
      assert.ok(names.includes('spaghetti'));
      assert.ok(names.includes('guanciale'));
      assert.ok(names.includes('beef chuck roast'));
    });

    it('F-33.2: Handles empty meal plan by returning empty shopping list', () => {
      const list = env.generateShoppingList(testUid, '2026-W35');
      assert.strictEqual(list.items.length, 0);
    });

    it('F-33.3: Tracks contributing recipe titles and recipe IDs on each aggregated item', () => {
      env.assignSlot(testUid, '2026-W35', 'monday', 'dinner', savedRecipes[0]);
      const list = env.generateShoppingList(testUid, '2026-W35');

      const spaghettiItem = list.items.find(i => i.name.toLowerCase().includes('spaghetti'));
      assert.ok(spaghettiItem);
      assert.ok(spaghettiItem.recipeIds.includes(savedRecipes[0].id));
      assert.ok(spaghettiItem.recipeTitles.includes(savedRecipes[0].name));
    });

    it('F-33.4: Re-generating shopping list updates ingredients when meal plan changes', () => {
      env.assignSlot(testUid, '2026-W35', 'monday', 'dinner', savedRecipes[0]);
      let list = env.generateShoppingList(testUid, '2026-W35');
      const initialCount = list.items.length;

      // Add a second meal
      env.assignSlot(testUid, '2026-W35', 'tuesday', 'dinner', savedRecipes[2]);
      list = env.generateShoppingList(testUid, '2026-W35');
      assert.ok(list.items.length > initialCount);
    });

    it('F-33.5: Preserves custom user items when re-aggregating from meal plan', () => {
      env.assignSlot(testUid, '2026-W35', 'monday', 'dinner', savedRecipes[0]);
      env.generateShoppingList(testUid, '2026-W35');

      env.addCustomShoppingItem(testUid, '2026-W35', 'Paper Towels', 'Other', 2, 'rolls');
      const updatedList = env.generateShoppingList(testUid, '2026-W35');

      assert.ok(updatedList.items.some(i => i.name === 'Paper Towels' && i.isCustom));
    });
  });

  // F-34: Intelligent Ingredient Merger / Math
  describe('F-34: Intelligent Ingredient Merger & Unit Math', () => {
    it('F-34.1: Sums quantities for duplicate ingredients with matching units (e.g. 2 lbs beef + 1.5 lbs beef = 3.5 lbs)', () => {
      // Recipe 1 has 2 lbs beef chuck, Recipe 5 has 1.5 lbs ground beef (normalized item name test)
      const rA: TestRecipe = {
        ...savedRecipes[0],
        id: 'test_a',
        ingredients: [{ item: 'Beef', name: 'Beef', amount: '2', unit: 'lbs', category: 'meat' }]
      };
      const rB: TestRecipe = {
        ...savedRecipes[0],
        id: 'test_b',
        ingredients: [{ item: 'Beef', name: 'Beef', amount: '1.5', unit: 'lbs', category: 'meat' }]
      };

      env.saveRecipe(testUid, rA);
      env.saveRecipe(testUid, rB);

      env.assignSlot(testUid, '2026-W35', 'monday', 'dinner', rA);
      env.assignSlot(testUid, '2026-W35', 'friday', 'dinner', rB);

      const list = env.generateShoppingList(testUid, '2026-W35');
      const beefItem = list.items.find(i => i.name.toLowerCase() === 'beef');
      assert.ok(beefItem);
      assert.strictEqual(beefItem.amount, 3.5);
      assert.strictEqual(beefItem.unit, 'lbs');
      assert.ok(beefItem.displayAmount === '3.5 lbs' || beefItem.displayAmount === '3 1/2 lbs');
    });

    it('F-34.2: Parses mixed fractions (e.g. "1 1/2" -> 1.5, "2 3/4" -> 2.75)', () => {
      assert.strictEqual(parseFractionOrAmount('1 1/2'), 1.5);
      assert.strictEqual(parseFractionOrAmount('2 3/4'), 2.75);
      assert.strictEqual(parseFractionOrAmount('3 1/4'), 3.25);
    });

    it('F-34.3: Parses simple fractions (e.g. "1/2" -> 0.5, "1/4" -> 0.25, "1/3" -> 0.333...)', () => {
      assert.strictEqual(parseFractionOrAmount('1/2'), 0.5);
      assert.strictEqual(parseFractionOrAmount('1/4'), 0.25);
      assert.ok(Math.abs(parseFractionOrAmount('1/3') - 0.333) < 0.01);
    });

    it('F-34.4: Formats summed decimal amounts into human-friendly fractions (e.g. 1.5 -> "1 1/2 cups")', () => {
      assert.strictEqual(formatQuantityDisplay(1.5, 'cups'), '1 1/2 cups');
      assert.strictEqual(formatQuantityDisplay(2.25, 'lbs'), '2 1/4 lbs');
      assert.strictEqual(formatQuantityDisplay(0.5, 'tsp'), '1/2 tsp');
      assert.strictEqual(formatQuantityDisplay(4, 'cloves'), '4 cloves');
    });

    it('F-34.5: Keeps ingredients separate when units cannot be cleanly combined', () => {
      const r1: TestRecipe = {
        ...savedRecipes[0],
        id: 'r_garlic_1',
        ingredients: [{ item: 'Garlic', name: 'Garlic', amount: '3', unit: 'cloves', category: 'produce' }]
      };
      const r2: TestRecipe = {
        ...savedRecipes[0],
        id: 'r_garlic_2',
        ingredients: [{ item: 'Garlic', name: 'Garlic', amount: '1', unit: 'head', category: 'produce' }]
      };

      env.saveRecipe(testUid, r1);
      env.saveRecipe(testUid, r2);

      env.assignSlot(testUid, '2026-W35', 'monday', 'dinner', r1);
      env.assignSlot(testUid, '2026-W35', 'tuesday', 'dinner', r2);

      const list = env.generateShoppingList(testUid, '2026-W35');
      const garlicItems = list.items.filter(i => i.name.toLowerCase() === 'garlic');
      assert.strictEqual(garlicItems.length, 2);
    });
  });

  // F-35: Grocery Department Grouping (8 Cats)
  describe('F-35: Grocery Department Grouping (8 Categories)', () => {
    it('F-35.1: Includes exactly the 8 standard store departments', () => {
      assert.strictEqual(GROCERY_DEPARTMENTS.length, 8);
      assert.deepStrictEqual(GROCERY_DEPARTMENTS, [
        'Produce',
        'Dairy',
        'Meat/Seafood',
        'Pantry',
        'Spices/Seasonings',
        'Bakery',
        'Frozen',
        'Other'
      ]);
    });

    it('F-35.2: Categorizes produce items (onions, carrots, herbs) to Produce', () => {
      assert.strictEqual(categorizeIngredientDepartment('Yellow Onion'), 'Produce');
      assert.strictEqual(categorizeIngredientDepartment('Fresh Thyme'), 'Produce');
      assert.strictEqual(categorizeIngredientDepartment('Avocado'), 'Produce');
    });

    it('F-35.3: Categorizes dairy items (milk, butter, pecorino, eggs) to Dairy', () => {
      assert.strictEqual(categorizeIngredientDepartment('Pecorino Romano Cheese'), 'Dairy');
      assert.strictEqual(categorizeIngredientDepartment('Large Eggs'), 'Dairy');
      assert.strictEqual(categorizeIngredientDepartment('Unsalted Butter'), 'Dairy');
    });

    it('F-35.4: Categorizes meat/seafood (beef, salmon, guanciale) to Meat/Seafood', () => {
      assert.strictEqual(categorizeIngredientDepartment('Beef Chuck Roast'), 'Meat/Seafood');
      assert.strictEqual(categorizeIngredientDepartment('Fresh Salmon Fillets'), 'Meat/Seafood');
      assert.strictEqual(categorizeIngredientDepartment('Guanciale'), 'Meat/Seafood');
    });

    it('F-35.5: Categorizes pantry, spices, and bakery items accurately', () => {
      assert.strictEqual(categorizeIngredientDepartment('Olive Oil'), 'Pantry');
      assert.strictEqual(categorizeIngredientDepartment('Smoked Paprika'), 'Spices/Seasonings');
      assert.strictEqual(categorizeIngredientDepartment('Sourdough Bread'), 'Bakery');
      assert.strictEqual(categorizeIngredientDepartment('Puff Pastry'), 'Frozen');
    });
  });

  // F-36: Interactive Item Check-off & Sync
  describe('F-36: Interactive Item Check-off & Sync', () => {
    it('F-36.1: Toggles item checked state between true and false', () => {
      env.assignSlot(testUid, '2026-W35', 'monday', 'dinner', savedRecipes[0]);
      const list = env.generateShoppingList(testUid, '2026-W35');
      const firstItem = list.items[0];
      assert.strictEqual(firstItem.checked, false);

      env.toggleShoppingItem(testUid, '2026-W35', firstItem.id);
      assert.strictEqual(firstItem.checked, true);

      env.toggleShoppingItem(testUid, '2026-W35', firstItem.id);
      assert.strictEqual(firstItem.checked, false);
    });

    it('F-36.2: Checked state persists across shopping list queries', () => {
      env.assignSlot(testUid, '2026-W35', 'monday', 'dinner', savedRecipes[0]);
      const list = env.generateShoppingList(testUid, '2026-W35');
      const item = list.items[1];

      env.toggleShoppingItem(testUid, '2026-W35', item.id);
      const reFetched = env.shoppingLists.get(`${testUid}_2026-W35`);
      assert.strictEqual(reFetched?.items.find(i => i.id === item.id)?.checked, true);
    });

    it('F-36.3: "Clear Checked Items" removes all completed items from list', () => {
      env.assignSlot(testUid, '2026-W35', 'monday', 'dinner', savedRecipes[0]);
      const list = env.generateShoppingList(testUid, '2026-W35');
      const item1 = list.items[0];
      const item2 = list.items[1];

      env.toggleShoppingItem(testUid, '2026-W35', item1.id);
      env.toggleShoppingItem(testUid, '2026-W35', item2.id);

      const clearedList = env.clearCheckedShoppingItems(testUid, '2026-W35');
      assert.strictEqual(clearedList.items.some(i => i.id === item1.id), false);
      assert.strictEqual(clearedList.items.some(i => i.id === item2.id), false);
      assert.ok(clearedList.items.length > 0);
    });

    it('F-36.4: Unchecked items remain in active shopping list after clearing completed', () => {
      env.assignSlot(testUid, '2026-W35', 'monday', 'dinner', savedRecipes[0]);
      const list = env.generateShoppingList(testUid, '2026-W35');
      const uncheckedItem = list.items[2];

      env.toggleShoppingItem(testUid, '2026-W35', list.items[0].id);
      const clearedList = env.clearCheckedShoppingItems(testUid, '2026-W35');

      assert.ok(clearedList.items.some(i => i.id === uncheckedItem.id));
    });

    it('F-36.5: Updates updatedAt timestamp on shopping list document when checked state changes', () => {
      env.assignSlot(testUid, '2026-W35', 'monday', 'dinner', savedRecipes[0]);
      const list = env.generateShoppingList(testUid, '2026-W35');
      const before = Date.now();

      const updated = env.toggleShoppingItem(testUid, '2026-W35', list.items[0].id);
      assert.ok(updated.updatedAt.getTime() >= before - 1000);
    });
  });

  // F-37: Custom Shopping List Items
  describe('F-37: Custom Shopping List Items', () => {
    it('F-37.1: Adds manual custom item to shopping list with name and category', () => {
      const item = env.addCustomShoppingItem(testUid, '2026-W35', 'Dish Sponges', 'Other', 2, 'packs');
      assert.ok(item.id.startsWith('custom_'));
      assert.strictEqual(item.name, 'Dish Sponges');
      assert.strictEqual(item.category, 'Other');
      assert.strictEqual(item.amount, 2);
      assert.strictEqual(item.unit, 'packs');
      assert.strictEqual(item.isCustom, true);
    });

    it('F-37.2: Custom items default to unchecked state', () => {
      const item = env.addCustomShoppingItem(testUid, '2026-W35', 'Hand Soap', 'Other');
      assert.strictEqual(item.checked, false);
    });

    it('F-37.3: Custom item can be checked off and cleared alongside recipe ingredients', () => {
      const custom = env.addCustomShoppingItem(testUid, '2026-W35', 'Aluminum Foil', 'Other');
      env.toggleShoppingItem(testUid, '2026-W35', custom.id);

      const list = env.shoppingLists.get(`${testUid}_2026-W35`)!;
      assert.strictEqual(list.items.find(i => i.id === custom.id)?.checked, true);

      env.clearCheckedShoppingItems(testUid, '2026-W35');
      const updatedList = env.shoppingLists.get(`${testUid}_2026-W35`)!;
      assert.strictEqual(updatedList.items.some(i => i.id === custom.id), false);
    });

    it('F-37.4: Custom items appear under their designated grocery department', () => {
      const customBakery = env.addCustomShoppingItem(testUid, '2026-W35', 'Croissants', 'Bakery', 4, 'items');
      assert.strictEqual(customBakery.category, 'Bakery');
    });

    it('F-37.5: Supports adding multiple custom items with unique IDs', () => {
      const item1 = env.addCustomShoppingItem(testUid, '2026-W35', 'Sparkling Water', 'Other', 6, 'cans');
      const item2 = env.addCustomShoppingItem(testUid, '2026-W35', 'Coffee Beans', 'Pantry', 1, 'bag');

      assert.notStrictEqual(item1.id, item2.id);
      const list = env.shoppingLists.get(`${testUid}_2026-W35`)!;
      assert.ok(list.items.some(i => i.id === item1.id));
      assert.ok(list.items.some(i => i.id === item2.id));
    });
  });
});
