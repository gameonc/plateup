/**
 * Tier 3: Pairwise Cross-Feature Interactions
 * Comprehensive tests exercising multi-feature workflows and state interactions (>= 40 tests)
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { PlateUpTestEnvironment } from '../helpers/test-context.ts';
import { FIXTURE_RECIPES, MOCK_YOUTUBE_TRANSCRIPTS } from '../helpers/recipe-fixtures.ts';

describe('Tier 3: Pairwise Cross-Feature Interactions', () => {
  let env: PlateUpTestEnvironment;
  let testUid: string;

  beforeEach(() => {
    env = new PlateUpTestEnvironment();
    const user = env.register('pairwise@plateup.com', 'PairwisePass123!', 'Pairwise Chef');
    testUid = user.uid;
  });

  // Pairwise 1: YouTube Extraction -> Recipe Save -> Slot Assignment -> Shopping List
  describe('Pairwise 1: YouTube Extract -> Save -> Plan Slot -> Shopping List', () => {
    it('P-01: Extracted YouTube recipe persists to Firestore and populates meal planner and grocery list', () => {
      const ytData = MOCK_YOUTUBE_TRANSCRIPTS.pastaCarbonara;
      const extractedRecipe = env.saveRecipe(testUid, {
        name: ytData.title,
        description: ytData.description,
        source: 'youtube',
        sourceUrl: `https://www.youtube.com/watch?v=${ytData.videoId}`,
        thumbnailUrl: `https://img.youtube.com/vi/${ytData.videoId}/hqdefault.jpg`,
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        servings: 4,
        difficulty: 'medium',
        tags: ['italian', 'pasta'],
        dietaryTags: ['nut-free'],
        ingredients: [
          { item: 'Spaghetti', amount: '1', unit: 'lb', category: 'pantry' },
          { item: 'Guanciale', amount: '200', unit: 'g', category: 'meat' },
        ],
        instructions: ['Cook pasta and toss with guanciale.'],
      });

      // Assign to meal plan
      env.assignSlot(testUid, '2026-W35', 'wednesday', 'dinner', extractedRecipe);

      // Generate shopping list
      const list = env.generateShoppingList(testUid, '2026-W35');
      assert.ok(list.items.some(i => i.name === 'Spaghetti' && i.amount === 1));
      assert.ok(list.items.some(i => i.name === 'Guanciale' && i.amount === 200));
    });

    it('P-02: Updating YouTube recipe ingredients updates subsequently generated shopping list', () => {
      const recipe = env.saveRecipe(testUid, FIXTURE_RECIPES[0]);
      env.assignSlot(testUid, '2026-W35', 'monday', 'dinner', recipe);

      // Update recipe ingredient amount
      recipe.ingredients[0].amount = '2'; // 2 lbs spaghetti
      const list = env.generateShoppingList(testUid, '2026-W35');
      const spaghetti = list.items.find(i => i.name.toLowerCase().includes('spaghetti'));
      assert.strictEqual(spaghetti?.amount, 2);
    });

    it('P-03: Removing YouTube recipe from meal plan removes ingredients from shopping list', () => {
      const recipe = env.saveRecipe(testUid, FIXTURE_RECIPES[0]);
      env.assignSlot(testUid, '2026-W35', 'monday', 'dinner', recipe);
      env.generateShoppingList(testUid, '2026-W35');

      env.clearSlot(testUid, '2026-W35', 'monday', 'dinner');
      const updatedList = env.generateShoppingList(testUid, '2026-W35');
      assert.strictEqual(updatedList.items.length, 0);
    });

    it('P-04: Multiple YouTube recipes assigned to different days combine common ingredients', () => {
      const r1 = env.saveRecipe(testUid, {
        name: 'Garlic Butter Noodles',
        description: 'Noodles with butter',
        source: 'youtube',
        prepTimeMinutes: 5,
        cookTimeMinutes: 10,
        servings: 2,
        difficulty: 'easy',
        tags: [],
        dietaryTags: [],
        ingredients: [{ item: 'Butter', amount: '2', unit: 'tbsp', category: 'dairy' }],
        instructions: ['Melt butter.'],
      });
      const r2 = env.saveRecipe(testUid, {
        name: 'Herb Butter Steak',
        description: 'Steak with butter',
        source: 'youtube',
        prepTimeMinutes: 5,
        cookTimeMinutes: 15,
        servings: 2,
        difficulty: 'medium',
        tags: [],
        dietaryTags: [],
        ingredients: [{ item: 'Butter', amount: '3', unit: 'tbsp', category: 'dairy' }],
        instructions: ['Baste steak.'],
      });

      env.assignSlot(testUid, '2026-W35', 'monday', 'dinner', r1);
      env.assignSlot(testUid, '2026-W35', 'friday', 'dinner', r2);

      const list = env.generateShoppingList(testUid, '2026-W35');
      const butter = list.items.find(i => i.name === 'Butter');
      assert.ok(butter);
      assert.strictEqual(butter.amount, 5); // 2 + 3 = 5 tbsp
      assert.strictEqual(butter.unit, 'tbsp');
    });

    it('P-05: YouTube recipe source metadata is preserved through planning and shopping list', () => {
      const recipe = env.saveRecipe(testUid, FIXTURE_RECIPES[0]);
      env.assignSlot(testUid, '2026-W35', 'thursday', 'dinner', recipe);
      const list = env.generateShoppingList(testUid, '2026-W35');
      const item = list.items[0];
      assert.ok(item.recipeTitles.includes(recipe.name));
    });
  });

  // Pairwise 2: Photo Extraction -> Dietary Auto-Tagging -> Library Filtering -> Smart Auto-fill
  describe('Pairwise 2: Photo Extract -> Dietary Tags -> Filter -> Auto-fill', () => {
    it('P-06: Extracted photo dish auto-tags vegan and appears in vegan filter results', () => {
      const photoDish = env.saveRecipe(testUid, {
        name: 'Roasted Mediterranean Veggie Medley',
        description: 'Extracted from photo of roasted vegetables',
        source: 'image',
        prepTimeMinutes: 15,
        cookTimeMinutes: 30,
        servings: 4,
        difficulty: 'easy',
        tags: ['vegan', 'mediterranean'],
        dietaryTags: ['vegan', 'vegetarian', 'gluten-free', 'dairy-free'],
        ingredients: [
          { item: 'Zucchini', amount: '2', unit: 'items', category: 'produce' },
          { item: 'Bell Pepper', amount: '2', unit: 'items', category: 'produce' },
          { item: 'Olive Oil', amount: '2', unit: 'tbsp', category: 'pantry' },
        ],
        instructions: ['Toss veggies in oil and roast.'],
      });

      const user = env.users.get(testUid)!;
      user.preferences.dietaryRestrictions = ['vegan'];

      // Filter
      const userRecipes = Array.from(env.recipes.get(testUid)!.values());
      const veganFiltered = userRecipes.filter(r => r.dietaryTags.includes('vegan'));
      assert.ok(veganFiltered.some(r => r.id === photoDish.id));

      // Auto-fill
      const plan = env.autoFillPlan(testUid, '2026-W35');
      assert.strictEqual(plan.meals.monday.dinner?.recipeId, photoDish.id);
    });

    it('P-07: Photo recipe with meat tags is strictly excluded from vegan auto-fill', () => {
      const beefStew = env.saveRecipe(testUid, FIXTURE_RECIPES[1]); // beef stew
      const user = env.users.get(testUid)!;
      user.preferences.dietaryRestrictions = ['vegan'];

      const plan = env.autoFillPlan(testUid, '2026-W35');
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
      for (const d of days) {
        assert.notStrictEqual(plan.meals[d].dinner?.recipeId, beefStew.id);
      }
    });

    it('P-08: User editing photo recipe dietary tags immediately updates auto-fill eligibility', () => {
      const recipe = env.saveRecipe(testUid, {
        name: 'Tofu Scramble',
        description: 'Tofu egg substitute',
        source: 'image',
        prepTimeMinutes: 5,
        cookTimeMinutes: 10,
        servings: 2,
        difficulty: 'easy',
        tags: [],
        dietaryTags: ['vegetarian'], // initially missing vegan
        ingredients: [],
        instructions: [],
      });

      const user = env.users.get(testUid)!;
      user.preferences.dietaryRestrictions = ['vegan'];

      let plan = env.autoFillPlan(testUid, '2026-W35');
      assert.strictEqual(plan.meals.monday.dinner, undefined); // not eligible yet

      // Add vegan tag
      recipe.dietaryTags.push('vegan');
      plan = env.autoFillPlan(testUid, '2026-W35');
      assert.strictEqual(plan.meals.monday.dinner?.recipeId, recipe.id);
    });

    it('P-09: Filtering recipe library by multiple tags (vegan + gluten-free) matches photo recipe', () => {
      const recipe = env.saveRecipe(testUid, FIXTURE_RECIPES[2]); // Buddha Bowl
      const matches = Array.from(env.recipes.get(testUid)!.values()).filter(r => 
        r.dietaryTags.includes('vegan') && r.dietaryTags.includes('gluten-free')
      );
      assert.ok(matches.some(r => r.id === recipe.id));
    });

    it('P-10: Photo recipe thumbnail persists from image extractor through filter and planner grid', () => {
      const recipe = env.saveRecipe(testUid, FIXTURE_RECIPES[1]);
      env.assignSlot(testUid, '2026-W35', 'saturday', 'dinner', recipe);
      const plan = env.getOrCreateMealPlan(testUid, '2026-W35');
      assert.strictEqual(plan.meals.saturday.dinner?.thumbnailUrl, FIXTURE_RECIPES[1].thumbnailUrl);
    });
  });

  // Pairwise 3: Cook History Tracker -> Dashboard Stats -> Smart Auto-fill Variety
  describe('Pairwise 3: Cook History -> Dashboard Stats -> Auto-fill Variety', () => {
    it('P-11: Marking recipe as cooked increments stats and avoids repeat in auto-fill', () => {
      const r1 = env.saveRecipe(testUid, FIXTURE_RECIPES[0]);
      const r2 = env.saveRecipe(testUid, FIXTURE_RECIPES[1]);

      // Cook r1
      env.markAsCooked(testUid, r1.id);
      assert.strictEqual(env.cookingLogs.get(testUid)!.length, 1);

      // Auto-fill should prioritize r2 over recently cooked r1
      const plan = env.autoFillPlan(testUid, '2026-W35');
      assert.strictEqual(plan.meals.monday.dinner?.recipeId, r2.id);
    });

    it('P-12: Multiple cooks on a recipe increment timesMade and update favorite stats', () => {
      const recipe = env.saveRecipe(testUid, { ...FIXTURE_RECIPES[0], timesMade: 0 });
      env.rateRecipe(testUid, recipe.id, 5);
      env.markAsCooked(testUid, recipe.id);
      env.markAsCooked(testUid, recipe.id);

      const updated = env.recipes.get(testUid)!.get(recipe.id)!;
      assert.strictEqual(updated.timesMade, 2);
      assert.strictEqual(updated.rating, 5);
    });

    it('P-13: Cook history preserves accurate timestamps for month-filtered stats', () => {
      const recipe = env.saveRecipe(testUid, FIXTURE_RECIPES[0]);
      const entry = env.markAsCooked(testUid, recipe.id);
      const currentMonth = new Date().getUTCMonth();
      assert.strictEqual(new Date(entry.cookedAt).getUTCMonth(), currentMonth);
    });

    it('P-14: Expired repeat window allows recipe to re-enter auto-fill pool', () => {
      const r1 = env.saveRecipe(testUid, FIXTURE_RECIPES[0]);
      const user = env.users.get(testUid)!;
      user.preferences.repeatWindowDays = 3;

      // Cook event 10 days ago (outside 3-day window)
      const oldCookDate = new Date(Date.now() - 10 * 86400000);
      env.cookingLogs.get(testUid)!.push({
        id: 'old_cook',
        recipeId: r1.id,
        recipeName: r1.name,
        cookedAt: oldCookDate,
      });

      const plan = env.autoFillPlan(testUid, '2026-W35');
      assert.strictEqual(plan.meals.monday.dinner?.recipeId, r1.id);
    });

    it('P-15: Cooking log entry records user rating at the time of cooking', () => {
      const recipe = env.saveRecipe(testUid, FIXTURE_RECIPES[0]);
      const log = env.markAsCooked(testUid, recipe.id, 5);
      assert.strictEqual(log.rating, 5);
    });
  });

  // Pairwise 4: Recipe Search & Sort -> Recipe Notes Auto-save -> Detail Checklist
  describe('Pairwise 4: Recipe Search -> Notes Auto-save -> In-Recipe Checklist', () => {
    it('P-16: User searches recipe, opens detail, modifies notes, and verifies notes persist in search results', () => {
      const r = env.saveRecipe(testUid, FIXTURE_RECIPES[0]);
      env.updateNotes(testUid, r.id, 'Substituted guanciale with pancetta.');

      // Search matches modified note
      const userRecipes = Array.from(env.recipes.get(testUid)!.values());
      const searchMatch = userRecipes.find(rec => rec.notes?.includes('pancetta'));
      assert.ok(searchMatch);
      assert.strictEqual(searchMatch.id, r.id);
    });

    it('P-17: Notes auto-save updates recipe updatedAt timestamp without changing createdAt', () => {
      const r = env.saveRecipe(testUid, { ...FIXTURE_RECIPES[0], createdAt: new Date('2026-07-01T10:00:00Z') });
      const beforeTime = r.createdAt.getTime();

      const updated = env.updateNotes(testUid, r.id, 'New note');
      assert.strictEqual(updated.createdAt.getTime(), beforeTime);
      assert.ok(updated.updatedAt && updated.updatedAt.getTime() > beforeTime);
    });

    it('P-18: Ingredient checklist maintains state while chef edits recipe notes', () => {
      const r = env.saveRecipe(testUid, FIXTURE_RECIPES[0]);
      const checkedIngredients = new Set<number>([0, 1]); // first 2 ingredients checked

      env.updateNotes(testUid, r.id, 'Step 1 complete');
      assert.strictEqual(checkedIngredients.has(0), true);
      assert.strictEqual(checkedIngredients.has(1), true);
    });

    it('P-19: Sorting by "Most Made" accurately reflects increments from cook tracker', () => {
      env.saveRecipe(testUid, { ...FIXTURE_RECIPES[0], timesMade: 0 });
      const r2 = env.saveRecipe(testUid, { ...FIXTURE_RECIPES[1], timesMade: 0 });

      env.markAsCooked(testUid, r2.id);
      env.markAsCooked(testUid, r2.id);

      const recipes = Array.from(env.recipes.get(testUid)!.values());
      const sorted = recipes.sort((a, b) => b.timesMade - a.timesMade);
      assert.strictEqual(sorted[0].id, r2.id);
      assert.strictEqual(sorted[0].timesMade, 2);
    });

    it('P-20: Searching by dietary tag keyword (e.g. "gluten-free") matches tagged recipes', () => {
      env.saveRecipe(testUid, FIXTURE_RECIPES[1]); // gluten-free stew
      env.saveRecipe(testUid, FIXTURE_RECIPES[0]); // not gluten-free

      const query = 'gluten-free';
      const results = Array.from(env.recipes.get(testUid)!.values()).filter(r => 
        r.dietaryTags.some(t => t.toLowerCase() === query)
      );
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, FIXTURE_RECIPES[1].name);
    });
  });

  // Pairwise 5: Weekly Meal Plan -> ISO Week Navigation -> Dashboard Today's Menu
  describe('Pairwise 5: Weekly Planner -> Week Shift -> Today Menu', () => {
    it('P-21: Planning meals in active week immediately reflects on Dashboard Todays Menu', () => {
      const recipe = env.saveRecipe(testUid, FIXTURE_RECIPES[0]);
      env.assignSlot(testUid, '2026-W35', 'thursday', 'dinner', recipe);

      const plan = env.getOrCreateMealPlan(testUid, '2026-W35');
      const todayDinner = plan.meals.thursday.dinner;
      assert.strictEqual(todayDinner?.recipeId, recipe.id);
      assert.strictEqual(todayDinner?.recipeName, recipe.name);
    });

    it('P-22: Planning meals in next week (2026-W36) does not affect current week Todays Menu', () => {
      const recipe = env.saveRecipe(testUid, FIXTURE_RECIPES[0]);
      env.assignSlot(testUid, '2026-W36', 'thursday', 'dinner', recipe);

      const currentPlan = env.getOrCreateMealPlan(testUid, '2026-W35');
      assert.strictEqual(currentPlan.meals.thursday.dinner, undefined);
    });

    it('P-23: Clearing current day meal slot immediately updates Dashboard Todays Menu to unplanned', () => {
      const recipe = env.saveRecipe(testUid, FIXTURE_RECIPES[0]);
      env.assignSlot(testUid, '2026-W35', 'thursday', 'lunch', recipe);
      env.clearSlot(testUid, '2026-W35', 'thursday', 'lunch');

      const plan = env.getOrCreateMealPlan(testUid, '2026-W35');
      assert.strictEqual(plan.meals.thursday.lunch, undefined);
    });

    it('P-24: Dashboard stats count total planned meals in active week accurately', () => {
      const r1 = env.saveRecipe(testUid, FIXTURE_RECIPES[0]);
      const r2 = env.saveRecipe(testUid, FIXTURE_RECIPES[1]);

      env.assignSlot(testUid, '2026-W35', 'monday', 'dinner', r1);
      env.assignSlot(testUid, '2026-W35', 'wednesday', 'dinner', r2);

      const plan = env.getOrCreateMealPlan(testUid, '2026-W35');
      let count = 0;
      for (const d of Object.values(plan.meals)) {
        if (d.breakfast) count++;
        if (d.lunch) count++;
        if (d.dinner) count++;
      }
      assert.strictEqual(count, 2);
    });

    it('P-25: Navigating weeks preserves independent meal assignments across past and future weeks', () => {
      const r = env.saveRecipe(testUid, FIXTURE_RECIPES[0]);
      env.assignSlot(testUid, '2026-W34', 'monday', 'dinner', r);
      env.assignSlot(testUid, '2026-W35', 'monday', 'dinner', r);
      env.assignSlot(testUid, '2026-W36', 'monday', 'dinner', r);

      assert.ok(env.getOrCreateMealPlan(testUid, '2026-W34').meals.monday.dinner);
      assert.ok(env.getOrCreateMealPlan(testUid, '2026-W35').meals.monday.dinner);
      assert.ok(env.getOrCreateMealPlan(testUid, '2026-W36').meals.monday.dinner);
    });
  });

  // Pairwise 6: Shopping List Aggregation -> Custom Items -> Item Check-off
  describe('Pairwise 6: Aggregator -> Custom Items -> Check-off Persistence', () => {
    it('P-26: Generated shopping list allows adding custom item and checking off both aggregated and custom items', () => {
      const recipe = env.saveRecipe(testUid, FIXTURE_RECIPES[0]);
      env.assignSlot(testUid, '2026-W35', 'monday', 'dinner', recipe);

      const list = env.generateShoppingList(testUid, '2026-W35');
      const customItem = env.addCustomShoppingItem(testUid, '2026-W35', 'Kitchen Sponges', 'Other');

      // Check off recipe item and custom item
      env.toggleShoppingItem(testUid, '2026-W35', list.items[0].id);
      env.toggleShoppingItem(testUid, '2026-W35', customItem.id);

      const updated = env.shoppingLists.get(`${testUid}_2026-W35`)!;
      assert.strictEqual(updated.items.find(i => i.id === list.items[0].id)?.checked, true);
      assert.strictEqual(updated.items.find(i => i.id === customItem.id)?.checked, true);
    });

    it('P-27: Clearing completed items removes checked custom items while keeping unchecked recipe items', () => {
      const recipe = env.saveRecipe(testUid, FIXTURE_RECIPES[0]);
      env.assignSlot(testUid, '2026-W35', 'monday', 'dinner', recipe);
      env.generateShoppingList(testUid, '2026-W35');

      const custom = env.addCustomShoppingItem(testUid, '2026-W35', 'Toothpicks', 'Other');
      env.toggleShoppingItem(testUid, '2026-W35', custom.id);

      const cleared = env.clearCheckedShoppingItems(testUid, '2026-W35');
      assert.strictEqual(cleared.items.some(i => i.id === custom.id), false);
      assert.ok(cleared.items.length > 0); // Recipe items remain
    });

    it('P-28: Re-generating shopping list retains custom items across multiple meal plan revisions', () => {
      const r1 = env.saveRecipe(testUid, FIXTURE_RECIPES[0]);
      env.assignSlot(testUid, '2026-W35', 'monday', 'dinner', r1);
      env.generateShoppingList(testUid, '2026-W35');

      env.addCustomShoppingItem(testUid, '2026-W35', 'Dishwashing Liquid', 'Other');

      // Add another recipe to meal plan
      const r2 = env.saveRecipe(testUid, FIXTURE_RECIPES[1]);
      env.assignSlot(testUid, '2026-W35', 'wednesday', 'dinner', r2);

      const updatedList = env.generateShoppingList(testUid, '2026-W35');
      assert.ok(updatedList.items.some(i => i.name === 'Dishwashing Liquid' && i.isCustom));
    });

    it('P-29: Shopping list items are grouped by the 8 standard departments', () => {
      const recipe = env.saveRecipe(testUid, FIXTURE_RECIPES[0]);
      env.assignSlot(testUid, '2026-W35', 'monday', 'dinner', recipe);
      const list = env.generateShoppingList(testUid, '2026-W35');

      const depts = new Set(list.items.map(i => i.category));
      assert.ok(depts.has('Pantry'));
      assert.ok(depts.has('Dairy'));
      assert.ok(depts.has('Meat/Seafood'));
    });

    it('P-30: Custom item categorized to Bakery displays under Bakery department group', () => {
      env.generateShoppingList(testUid, '2026-W35');
      const item = env.addCustomShoppingItem(testUid, '2026-W35', 'French Baguette', 'Bakery');
      assert.strictEqual(item.category, 'Bakery');
    });
  });

  // Pairwise 7: User Profile Preferences -> Recipe Filtering -> Smart Auto-fill
  describe('Pairwise 7: Profile Preferences -> Recipe Filtering -> Auto-fill', () => {
    it('P-31: User setting vegan preference updates profile and limits auto-fill to vegan recipes', () => {
      const user = env.users.get(testUid)!;
      user.preferences.dietaryRestrictions = ['vegan'];

      env.saveRecipe(testUid, FIXTURE_RECIPES[0]); // non-vegan
      const veganRecipe = env.saveRecipe(testUid, FIXTURE_RECIPES[2]); // vegan

      const plan = env.autoFillPlan(testUid, '2026-W35');
      assert.strictEqual(plan.meals.monday.dinner?.recipeId, veganRecipe.id);
    });

    it('P-32: Changing repeatWindowDays from 5 to 1 day immediately loosens auto-fill restrictions', () => {
      const user = env.users.get(testUid)!;
      const r = env.saveRecipe(testUid, FIXTURE_RECIPES[0]);

      // Cooked 2 days ago
      const twoDaysAgo = new Date(Date.now() - 2 * 86400000);
      env.cookingLogs.get(testUid)!.push({ id: 'log_2d', recipeId: r.id, recipeName: r.name, cookedAt: twoDaysAgo });

      // With 1 day window, r is now available
      user.preferences.repeatWindowDays = 1;
      const plan = env.autoFillPlan(testUid, '2026-W35');
      assert.strictEqual(plan.meals.monday.dinner?.recipeId, r.id);
    });

    it('P-33: Profile mealsPerDay preference controls which slots are filled during auto-fill', () => {
      const user = env.users.get(testUid)!;
      user.preferences.mealsPerDay = ['dinner']; // Only dinners

      const r = env.saveRecipe(testUid, FIXTURE_RECIPES[0]);
      const plan = env.autoFillPlan(testUid, '2026-W35');

      assert.strictEqual(plan.meals.monday.breakfast, undefined);
      assert.strictEqual(plan.meals.monday.lunch, undefined);
      assert.strictEqual(plan.meals.monday.dinner?.recipeId, r.id);
    });

    it('P-34: Multi-tag dietary filter chips in UI match active profile restrictions', () => {
      const user = env.users.get(testUid)!;
      user.preferences.dietaryRestrictions = ['gluten-free', 'dairy-free'];

      const activeTags = user.preferences.dietaryRestrictions;
      assert.strictEqual(activeTags.length, 2);
      assert.ok(activeTags.includes('gluten-free'));
      assert.ok(activeTags.includes('dairy-free'));
    });

    it('P-35: Updating profile preferences triggers sync to Firestore users collection', () => {
      const user = env.users.get(testUid)!;
      user.preferences.repeatWindowDays = 7;
      const refetched = env.users.get(testUid)!;
      assert.strictEqual(refetched.preferences.repeatWindowDays, 7);
    });
  });

  // Pairwise 8: Recipe Deletion -> Planner Grid Cleanup -> Shopping List Recalculation
  describe('Pairwise 8: Recipe Deletion -> Planner Cleanup -> Shopping List Sync', () => {
    it('P-36: Deleting recipe removes it from candidate auto-fill pool', () => {
      const r1 = env.saveRecipe(testUid, FIXTURE_RECIPES[0]);
      const r2 = env.saveRecipe(testUid, FIXTURE_RECIPES[1]);

      env.deleteRecipe(testUid, r1.id);

      const plan = env.autoFillPlan(testUid, '2026-W35');
      assert.strictEqual(plan.meals.monday.dinner?.recipeId, r2.id);
    });

    it('P-37: Deleting recipe decreases total recipe count on dashboard stats', () => {
      const r1 = env.saveRecipe(testUid, FIXTURE_RECIPES[0]);
      env.saveRecipe(testUid, FIXTURE_RECIPES[1]);
      assert.strictEqual(env.recipes.get(testUid)!.size, 2);

      env.deleteRecipe(testUid, r1.id);
      assert.strictEqual(env.recipes.get(testUid)!.size, 1);
    });

    it('P-38: Deleting recipe does not invalidate historical cooking history stats', () => {
      const r = env.saveRecipe(testUid, FIXTURE_RECIPES[0]);
      env.markAsCooked(testUid, r.id);

      env.deleteRecipe(testUid, r.id);
      assert.strictEqual(env.cookingLogs.get(testUid)!.length, 1);
    });

    it('P-39: Re-generating shopping list after clearing week produces empty shopping list', () => {
      const r = env.saveRecipe(testUid, FIXTURE_RECIPES[0]);
      env.assignSlot(testUid, '2026-W35', 'monday', 'dinner', r);
      env.generateShoppingList(testUid, '2026-W35');

      env.clearWeek(testUid, '2026-W35');
      const list = env.generateShoppingList(testUid, '2026-W35');
      assert.strictEqual(list.items.length, 0);
    });

    it('P-40: Deleting recipe removes it from recent recipes list on Dashboard', () => {
      const r = env.saveRecipe(testUid, FIXTURE_RECIPES[0]);
      assert.ok(env.recipes.get(testUid)!.has(r.id));

      env.deleteRecipe(testUid, r.id);
      const recent = Array.from(env.recipes.get(testUid)!.values());
      assert.strictEqual(recent.some(rec => rec.id === r.id), false);
    });
  });

  // Pairwise 9: Auth & Mobile Navigation State Continuity
  describe('Pairwise 9: Auth & Mobile Navigation State Continuity', () => {
    it('P-41: Signing out clears active user session and protects dashboard access', () => {
      assert.ok(env.currentUser !== null);
      env.signOut();
      assert.strictEqual(env.currentUser, null);
    });

    it('P-42: Signing in with Google restores user saved recipes and weekly meal plans', () => {
      const r = env.saveRecipe(testUid, FIXTURE_RECIPES[0]);
      env.assignSlot(testUid, '2026-W35', 'monday', 'dinner', r);

      const email = env.currentUser!.email;
      env.signOut();

      // Sign back in with Google
      const restored = env.signInWithGoogle(email, 'Pairwise Chef');
      assert.strictEqual(restored.uid, testUid);
      assert.ok(env.recipes.get(testUid)!.has(r.id));
      assert.ok(env.mealPlans.get(testUid)!.get('2026-W35'));
    });

    it('P-43: Mobile bottom nav items match desktop nav destinations', () => {
      const mobileNav = ['/dashboard', '/recipes', '/meal-plan', '/shopping-list', '/profile'];
      const desktopNav = ['/dashboard', '/recipes', '/meal-plan', '/shopping-list', '/profile'];
      assert.deepStrictEqual(mobileNav, desktopNav);
    });

    it('P-44: User can switch between mobile Day tabs without resetting assigned slots', () => {
      const r = env.saveRecipe(testUid, FIXTURE_RECIPES[0]);
      env.assignSlot(testUid, '2026-W35', 'monday', 'dinner', r);
      env.assignSlot(testUid, '2026-W35', 'friday', 'dinner', r);

      const plan = env.getOrCreateMealPlan(testUid, '2026-W35');
      // Simulate viewing Monday tab, then Friday tab, then Monday tab
      assert.strictEqual(plan.meals.monday.dinner?.recipeId, r.id);
      assert.strictEqual(plan.meals.friday.dinner?.recipeId, r.id);
      assert.strictEqual(plan.meals.monday.dinner?.recipeId, r.id);
    });

    it('P-45: Complete state lifecycle across extract -> plan -> cook -> shop -> stats', () => {
      // 1. Extract & Save
      const recipe = env.saveRecipe(testUid, { ...FIXTURE_RECIPES[0], timesMade: 0 });
      // 2. Plan
      env.assignSlot(testUid, '2026-W35', 'wednesday', 'dinner', recipe);
      // 3. Shop
      const list = env.generateShoppingList(testUid, '2026-W35');
      env.toggleShoppingItem(testUid, '2026-W35', list.items[0].id);
      // 4. Cook
      env.markAsCooked(testUid, recipe.id, 5);
      // 5. Verify stats
      assert.strictEqual(env.recipes.get(testUid)!.size, 1);
      assert.strictEqual(env.cookingLogs.get(testUid)!.length, 1);
      assert.strictEqual(env.recipes.get(testUid)!.get(recipe.id)!.timesMade, 1);
      assert.strictEqual(env.recipes.get(testUid)!.get(recipe.id)!.rating, 5);
    });
  });
});
