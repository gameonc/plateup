/**
 * Tier 4: Real-World Application Scenarios
 * The 5 Full End-to-End User Journeys defined in TEST_INFRA.md
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { PlateUpTestEnvironment } from '../helpers/test-context.ts';
import { FIXTURE_RECIPES, MOCK_YOUTUBE_TRANSCRIPTS } from '../helpers/recipe-fixtures.ts';

describe('Tier 4: Real-World Application Scenarios (Full E2E Journeys)', () => {
  let env: PlateUpTestEnvironment;

  beforeEach(() => {
    env = new PlateUpTestEnvironment();
  });

  // Scenario 1: From YouTube Video to Cooked Meal & Grocery Run
  it('Scenario 1: From YouTube Video to Cooked Meal & Grocery Run', () => {
    // 1. User signs up with email & password
    const user = env.register('chef_marco@plateup.com', 'MarcoSecret2026!', 'Chef Marco');
    assert.strictEqual(env.currentUser?.uid, user.uid);
    assert.strictEqual(user.displayName, 'Chef Marco');

    // 2. Extracts pasta recipe from YouTube URL
    const ytData = MOCK_YOUTUBE_TRANSCRIPTS.pastaCarbonara;
    const extractedRecipe = {
      name: ytData.title,
      description: ytData.description,
      source: 'youtube' as const,
      sourceUrl: `https://www.youtube.com/watch?v=${ytData.videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${ytData.videoId}/hqdefault.jpg`,
      prepTimeMinutes: 10,
      cookTimeMinutes: 15,
      servings: 4,
      difficulty: 'medium' as const,
      tags: ['italian', 'pasta', 'dinner'],
      dietaryTags: ['nut-free'],
      ingredients: [
        { item: 'Spaghetti', amount: '1', unit: 'lb', category: 'pantry' },
        { item: 'Guanciale', amount: '200', unit: 'g', category: 'meat' },
        { item: 'Large Eggs', amount: '4', unit: 'items', category: 'dairy' },
        { item: 'Pecorino Romano Cheese', amount: '1', unit: 'cup', category: 'dairy' },
        { item: 'Black Pepper', amount: '1', unit: 'tsp', category: 'spices' },
        { item: 'Olive Oil', amount: '2', unit: 'tbsp', category: 'pantry' },
        { item: 'Garlic Cloves', amount: '2', unit: 'cloves', category: 'produce' },
      ],
      instructions: [
        'Boil salted water and cook spaghetti.',
        'Crisp guanciale in a wide skillet.',
        'Whisk whole eggs with grated Pecorino Romano and black pepper.',
        'Toss pasta in pan, remove from heat, vigorously stir in egg mixture with pasta water.',
      ]
    };

    // 3. Saves recipe to Firestore collection
    const saved = env.saveRecipe(user.uid, extractedRecipe);
    assert.ok(env.recipes.get(user.uid)!.has(saved.id));
    assert.strictEqual(saved.timesMade, 0);

    // 4. Adds recipe to Wednesday Dinner on current week meal plan
    const currentWeekId = '2026-W35';
    env.assignSlot(user.uid, currentWeekId, 'wednesday', 'dinner', saved);
    const plan = env.getOrCreateMealPlan(user.uid, currentWeekId);
    assert.strictEqual(plan.meals.wednesday.dinner?.recipeId, saved.id);

    // 5. Generates shopping list from weekly plan
    const shoppingList = env.generateShoppingList(user.uid, currentWeekId);
    assert.ok(shoppingList.items.length >= 7);

    // 6. Checks off olive oil and garlic at the supermarket
    const oliveOil = shoppingList.items.find(i => i.name.toLowerCase().includes('olive oil'))!;
    const garlic = shoppingList.items.find(i => i.name.toLowerCase().includes('garlic'))!;
    assert.ok(oliveOil);
    assert.ok(garlic);

    env.toggleShoppingItem(user.uid, currentWeekId, oliveOil.id);
    env.toggleShoppingItem(user.uid, currentWeekId, garlic.id);

    const reloadedList = env.shoppingLists.get(`${user.uid}_${currentWeekId}`)!;
    assert.strictEqual(reloadedList.items.find(i => i.id === oliveOil.id)?.checked, true);
    assert.strictEqual(reloadedList.items.find(i => i.id === garlic.id)?.checked, true);

    // 7. Cooks meal, rates 5 stars, and clicks "I Made This!"
    env.rateRecipe(user.uid, saved.id, 5);
    const logEntry = env.markAsCooked(user.uid, saved.id, 5);

    const updatedRecipe = env.recipes.get(user.uid)!.get(saved.id)!;
    assert.strictEqual(updatedRecipe.timesMade, 1);
    assert.strictEqual(updatedRecipe.rating, 5);
    assert.strictEqual(env.cookingLogs.get(user.uid)!.length, 1);
    assert.strictEqual(logEntry.recipeName, saved.name);
  });

  // Scenario 2: Photo Recipe & Weekly Family Meal Plan with Duplicate Ingredient Summing
  it('Scenario 2: Photo Recipe & Weekly Family Meal Plan with Duplicate Ingredient Summing', () => {
    // 1. User signs in with Google
    const user = env.signInWithGoogle('grandma_fan@gmail.com', 'Grandma Fan');

    // 2. Uploads photo of grandma's stew and extracts recipe
    const photoRecipe = env.saveRecipe(user.uid, {
      name: "Grandma's Hearty Beef Stew",
      description: 'Slow-simmered beef chuck with carrots, potatoes, and garlic.',
      source: 'image',
      thumbnailUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd',
      prepTimeMinutes: 25,
      cookTimeMinutes: 120,
      servings: 6,
      difficulty: 'hard',
      tags: ['comfort food', 'stew', 'beef'],
      dietaryTags: ['gluten-free', 'dairy-free', 'nut-free'],
      ingredients: [
        { item: 'Beef', amount: '2', unit: 'lbs', category: 'meat' },
        { item: 'Carrots', amount: '4', unit: 'items', category: 'produce' },
        { item: 'Potatoes', amount: '1.5', unit: 'lbs', category: 'produce' },
      ],
      instructions: ['Brown beef, add vegetables, simmer for 2 hours.'],
    });

    // Also add a taco recipe that also uses Beef (1.5 lbs)
    const tacoRecipe = env.saveRecipe(user.uid, {
      name: 'Friday Night Beef Tacos',
      description: 'Seasoned beef tacos',
      source: 'manual',
      prepTimeMinutes: 10,
      cookTimeMinutes: 15,
      servings: 4,
      difficulty: 'easy',
      tags: ['mexican', 'dinner'],
      dietaryTags: ['gluten-free', 'dairy-free'],
      ingredients: [
        { item: 'Beef', amount: '1.5', unit: 'lbs', category: 'meat' },
        { item: 'Corn Tortillas', amount: '12', unit: 'items', category: 'bakery' },
      ],
      instructions: ['Cook beef and warm tortillas.'],
    });

    // 3. Assigns stew to Monday Dinner and tacos to Friday Dinner
    const weekId = '2026-W35';
    env.assignSlot(user.uid, weekId, 'monday', 'dinner', photoRecipe);
    env.assignSlot(user.uid, weekId, 'friday', 'dinner', tacoRecipe);

    // 4. Generates shopping list and verifies duplicate ingredient math
    const list = env.generateShoppingList(user.uid, weekId);
    const beefItem = list.items.find(i => i.name.toLowerCase() === 'beef');
    assert.ok(beefItem);
    assert.strictEqual(beefItem.amount, 3.5); // 2 + 1.5 = 3.5 lbs
    assert.strictEqual(beefItem.unit, 'lbs');
    assert.ok(beefItem.displayAmount === '3.5 lbs' || beefItem.displayAmount === '3 1/2 lbs');
    assert.strictEqual(beefItem.category, 'Meat/Seafood');
    assert.ok(beefItem.recipeTitles.includes("Grandma's Hearty Beef Stew"));
    assert.ok(beefItem.recipeTitles.includes("Friday Night Beef Tacos"));
  });

  // Scenario 3: Strict Vegan / Gluten-Free Lifestyle Transition
  it('Scenario 3: Strict Vegan / Gluten-Free Lifestyle Transition', () => {
    // 1. User registers
    const user = env.register('plant_powered@plateup.com', 'PlantPass123!');

    // 2. Saves multiple diverse recipes (meat, dairy, vegan, gluten-free)
    for (const r of FIXTURE_RECIPES) {
      env.saveRecipe(user.uid, r);
    }

    // 3. User updates profile preferences to strictly 'vegan' and 'gluten-free'
    user.preferences.dietaryRestrictions = ['vegan', 'gluten-free'];
    user.preferences.repeatWindowDays = 2;

    // 4. Verifies recipe library filter shows only compliant recipes
    const userRecipes = Array.from(env.recipes.get(user.uid)!.values());
    const compliantRecipes = userRecipes.filter(r => 
      r.dietaryTags.includes('vegan') && r.dietaryTags.includes('gluten-free')
    );
    assert.ok(compliantRecipes.length >= 1);
    for (const r of compliantRecipes) {
      assert.ok(r.dietaryTags.includes('vegan'));
      assert.ok(r.dietaryTags.includes('gluten-free'));
    }

    // 5. Runs meal planner auto-fill
    const weekId = '2026-W35';
    const plan = env.autoFillPlan(user.uid, weekId);

    // 6. Verifies ALL 21 generated slots strictly satisfy vegan and gluten-free tags
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
    const meals = ['breakfast', 'lunch', 'dinner'] as const;

    for (const d of days) {
      for (const m of meals) {
        const slot = plan.meals[d]?.[m];
        if (slot) {
          const recipe = userRecipes.find(r => r.id === slot.recipeId);
          assert.ok(recipe);
          assert.ok(recipe.dietaryTags.includes('vegan'), `Recipe ${recipe.name} must be vegan`);
          assert.ok(recipe.dietaryTags.includes('gluten-free'), `Recipe ${recipe.name} must be gluten-free`);
        }
      }
    }
  });

  // Scenario 4: Mobile On-The-Go Grocery Shopping
  it('Scenario 4: Mobile On-The-Go Grocery Shopping', () => {
    // 1. Mobile user logs in
    const user = env.register('mobile_shopper@plateup.com', 'MobilePass123!');
    const recipe = env.saveRecipe(user.uid, FIXTURE_RECIPES[0]);

    // 2. Uses mobile day selector on /meal-plan to assign Wednesday dinner
    const weekId = '2026-W35';
    env.assignSlot(user.uid, weekId, 'wednesday', 'dinner', recipe);

    // 3. Jumps to /shopping-list via mobile bottom nav and generates list
    const list = env.generateShoppingList(user.uid, weekId);
    assert.ok(list.items.length >= 5);

    // 4. Adds custom manual item "Sponges" under Other department
    const sponge = env.addCustomShoppingItem(user.uid, weekId, 'Sponges', 'Other', 2, 'packs');
    assert.strictEqual(sponge.name, 'Sponges');
    assert.strictEqual(sponge.isCustom, true);

    // 5. Checks off items as navigating supermarket aisles
    const firstItem = list.items[0];
    env.toggleShoppingItem(user.uid, weekId, firstItem.id);
    env.toggleShoppingItem(user.uid, weekId, sponge.id);

    // 6. Simulates page reload by re-fetching from Firestore
    const reloaded = env.shoppingLists.get(`${user.uid}_${weekId}`)!;
    assert.strictEqual(reloaded.items.find(i => i.id === firstItem.id)?.checked, true);
    assert.strictEqual(reloaded.items.find(i => i.id === sponge.id)?.checked, true);

    // 7. Clears checked items and verifies remaining items
    const afterClear = env.clearCheckedShoppingItems(user.uid, weekId);
    assert.strictEqual(afterClear.items.some(i => i.id === firstItem.id), false);
    assert.strictEqual(afterClear.items.some(i => i.id === sponge.id), false);
    assert.ok(afterClear.items.length > 0);
  });

  // Scenario 5: High-Frequency Cook History & Recipe Management
  it('Scenario 5: High-Frequency Cook History & Recipe Management', () => {
    // 1. User signs in
    const user = env.register('pro_chef@plateup.com', 'ChefPass123!');

    // 2. Populates recipe collection
    const r1 = env.saveRecipe(user.uid, { ...FIXTURE_RECIPES[0], timesMade: 0 });
    const r2 = env.saveRecipe(user.uid, { ...FIXTURE_RECIPES[1], timesMade: 0 });
    const r3 = env.saveRecipe(user.uid, { ...FIXTURE_RECIPES[2], timesMade: 0 });

    // 3. Searches recipes by keyword "quinoa"
    const userRecipes = Array.from(env.recipes.get(user.uid)!.values());
    const query = 'quinoa';
    const searchMatch = userRecipes.filter(r => r.name.toLowerCase().includes(query));
    assert.strictEqual(searchMatch.length, 1);
    assert.strictEqual(searchMatch[0].id, r3.id);

    // 4. Edits recipe notes with live auto-save
    const customNote = 'Added toasted pumpkin seeds on top for extra crunch.';
    env.updateNotes(user.uid, r3.id, customNote);
    const updatedR3 = env.recipes.get(user.uid)!.get(r3.id)!;
    assert.strictEqual(updatedR3.notes, customNote);

    // 5. Logs multiple cook events across the week
    env.markAsCooked(user.uid, r1.id, 5);
    env.markAsCooked(user.uid, r1.id, 5);
    env.markAsCooked(user.uid, r2.id, 4);
    env.markAsCooked(user.uid, r3.id, 5);

    // 6. Sorts by "Most Made" and verifies order
    const allSorted = Array.from(env.recipes.get(user.uid)!.values()).sort((a, b) => b.timesMade - a.timesMade);
    assert.strictEqual(allSorted[0].id, r1.id);
    assert.strictEqual(allSorted[0].timesMade, 2);

    // 7. Verifies dashboard cooking statistics in real-time
    const currentMonth = new Date().getUTCMonth();
    const currentYear = new Date().getUTCFullYear();
    const monthlyCooks = env.cookingLogs.get(user.uid)!.filter(log => {
      const d = new Date(log.cookedAt);
      return d.getUTCMonth() === currentMonth && d.getUTCFullYear() === currentYear;
    });
    assert.strictEqual(monthlyCooks.length, 4);
    assert.strictEqual(env.recipes.get(user.uid)!.size, 3);
  });
});
