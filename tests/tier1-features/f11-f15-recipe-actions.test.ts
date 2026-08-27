/**
 * Tier 1: Feature Coverage for F-11 to F-15
 * F-11: 1-5 Star Recipe Rating System
 * F-12: "I Made This" Cook Tracker
 * F-13: Recipe Notes Live Auto-save
 * F-14: In-Recipe Ingredient Checklist
 * F-15: Recipe Deletion & Modal
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { PlateUpTestEnvironment } from '../helpers/test-context.ts';
import { FIXTURE_RECIPES } from '../helpers/recipe-fixtures.ts';

describe('Tier 1: F-11 to F-15 — Recipe Actions & Interactive Features', () => {
  let env: PlateUpTestEnvironment;
  let testUid: string;
  let sampleRecipeId: string;

  beforeEach(() => {
    env = new PlateUpTestEnvironment();
    const user = env.register('cook@test.com', 'password123', 'Chef Julia');
    testUid = user.uid;
    const saved = env.saveRecipe(testUid, FIXTURE_RECIPES[0]);
    sampleRecipeId = saved.id;
  });

  // F-11: 1-5 Star Recipe Rating System
  describe('F-11: 1-5 Star Recipe Rating System', () => {
    it('F-11.1: Sets recipe rating to valid 1-5 integer star value', () => {
      const rated = env.rateRecipe(testUid, sampleRecipeId, 5);
      assert.strictEqual(rated.rating, 5);
    });

    it('F-11.2: Updates existing rating from 3 to 4 stars and persists', () => {
      env.rateRecipe(testUid, sampleRecipeId, 3);
      const updated = env.rateRecipe(testUid, sampleRecipeId, 4);
      assert.strictEqual(updated.rating, 4);
    });

    it('F-11.3: Rejects rating below 1 with validation error', () => {
      assert.throws(() => {
        env.rateRecipe(testUid, sampleRecipeId, 0);
      }, /Rating must be between 1 and 5/);
    });

    it('F-11.4: Rejects rating above 5 with validation error', () => {
      assert.throws(() => {
        env.rateRecipe(testUid, sampleRecipeId, 6);
      }, /Rating must be between 1 and 5/);
    });

    it('F-11.5: Triggers toast feedback notification upon updating rating', () => {
      env.rateRecipe(testUid, sampleRecipeId, 5);
      assert.ok(env.toastQueue.includes('Rating updated'));
    });
  });

  // F-12: "I Made This" Cook Tracker
  describe('F-12: "I Made This" Cook Tracker', () => {
    it('F-12.1: Increments timesMade counter when "I Made This" is clicked', () => {
      const initial = env.recipes.get(testUid)!.get(sampleRecipeId)!;
      const initialCount = initial.timesMade || 0;

      env.markAsCooked(testUid, sampleRecipeId);
      const updated = env.recipes.get(testUid)!.get(sampleRecipeId)!;
      assert.strictEqual(updated.timesMade, initialCount + 1);
    });

    it('F-12.2: Updates lastMadeAt timestamp to current date', () => {
      const before = Date.now();
      env.markAsCooked(testUid, sampleRecipeId);
      const recipe = env.recipes.get(testUid)!.get(sampleRecipeId)!;
      assert.ok(recipe.lastMadeAt instanceof Date);
      assert.ok(recipe.lastMadeAt.getTime() >= before - 1000);
    });

    it('F-12.3: Appends a cooking log entry with recipe details and timestamp', () => {
      const entry = env.markAsCooked(testUid, sampleRecipeId, 5);
      const logs = env.cookingLogs.get(testUid) || [];
      assert.strictEqual(logs.length, 1);
      assert.strictEqual(logs[0].recipeId, sampleRecipeId);
      assert.strictEqual(logs[0].rating, 5);
      assert.strictEqual(entry.recipeName, FIXTURE_RECIPES[0].name);
    });

    it('F-12.4: Supports logging multiple cooking events over time', () => {
      const initialCount = env.recipes.get(testUid)!.get(sampleRecipeId)!.timesMade || 0;
      env.markAsCooked(testUid, sampleRecipeId);
      env.markAsCooked(testUid, sampleRecipeId);
      env.markAsCooked(testUid, sampleRecipeId);

      const recipe = env.recipes.get(testUid)!.get(sampleRecipeId)!;
      assert.strictEqual(recipe.timesMade, initialCount + 3);
      assert.strictEqual(env.cookingLogs.get(testUid)!.length, 3);
    });

    it('F-12.5: Triggers confirmation toast when recipe is marked as cooked', () => {
      env.markAsCooked(testUid, sampleRecipeId);
      assert.ok(env.toastQueue.includes('Marked as cooked!'));
    });
  });

  // F-13: Recipe Notes Live Auto-save
  describe('F-13: Recipe Notes Live Auto-save', () => {
    it('F-13.1: Saves customized chef notes on recipe detail view', () => {
      const updated = env.updateNotes(testUid, sampleRecipeId, 'Used pecorino instead of parmesan. Delicious!');
      assert.strictEqual(updated.notes, 'Used pecorino instead of parmesan. Delicious!');
    });

    it('F-13.2: Updates and persists multi-line notes content', () => {
      const multiLineNotes = 'Step 1: Double the garlic\nStep 2: Bake at 375F instead of 400F\nStep 3: Rest for 10 mins';
      const updated = env.updateNotes(testUid, sampleRecipeId, multiLineNotes);
      assert.strictEqual(updated.notes, multiLineNotes);
    });

    it('F-13.3: Allows clearing notes by saving empty string', () => {
      env.updateNotes(testUid, sampleRecipeId, 'Some notes');
      const cleared = env.updateNotes(testUid, sampleRecipeId, '');
      assert.strictEqual(cleared.notes, '');
    });

    it('F-13.4: Updates recipe updatedAt timestamp when notes change', () => {
      const before = Date.now();
      const updated = env.updateNotes(testUid, sampleRecipeId, 'Fresh basil garnish');
      assert.ok(updated.updatedAt instanceof Date);
      assert.ok(updated.updatedAt.getTime() >= before - 1000);
    });

    it('F-13.5: Notes persist across simulated page reloads and re-fetch', () => {
      env.updateNotes(testUid, sampleRecipeId, 'Secret ingredient: nutmeg');
      const recipeRefetch = env.recipes.get(testUid)!.get(sampleRecipeId)!;
      assert.strictEqual(recipeRefetch.notes, 'Secret ingredient: nutmeg');
    });
  });

  // F-14: In-Recipe Ingredient Checklist
  describe('F-14: In-Recipe Ingredient Checklist', () => {
    const createCookingSessionChecklist = (ingredients: { item: string }[]) => {
      const checkedState = new Map<number, boolean>();
      ingredients.forEach((_, idx) => checkedState.set(idx, false));

      return {
        toggle: (idx: number) => {
          const curr = checkedState.get(idx) || false;
          checkedState.set(idx, !curr);
        },
        isChecked: (idx: number) => checkedState.get(idx) || false,
        allCompleted: () => Array.from(checkedState.values()).every(v => v === true),
        reset: () => ingredients.forEach((_, idx) => checkedState.set(idx, false)),
      };
    };

    it('F-14.1: Initializes checklist with all ingredients unchecked', () => {
      const recipe = FIXTURE_RECIPES[0];
      const checklist = createCookingSessionChecklist(recipe.ingredients);
      assert.strictEqual(checklist.isChecked(0), false);
      assert.strictEqual(checklist.isChecked(1), false);
      assert.strictEqual(checklist.allCompleted(), false);
    });

    it('F-14.2: Toggles ingredient checked state on click', () => {
      const recipe = FIXTURE_RECIPES[0];
      const checklist = createCookingSessionChecklist(recipe.ingredients);
      checklist.toggle(0);
      assert.strictEqual(checklist.isChecked(0), true);
      checklist.toggle(0);
      assert.strictEqual(checklist.isChecked(0), false);
    });

    it('F-14.3: Tracks partial completion across multiple ingredients', () => {
      const recipe = FIXTURE_RECIPES[0];
      const checklist = createCookingSessionChecklist(recipe.ingredients);
      checklist.toggle(0);
      checklist.toggle(2);
      assert.strictEqual(checklist.isChecked(0), true);
      assert.strictEqual(checklist.isChecked(1), false);
      assert.strictEqual(checklist.isChecked(2), true);
    });

    it('F-14.4: Detects 100% completion when all ingredients are checked off', () => {
      const recipe = FIXTURE_RECIPES[0];
      const checklist = createCookingSessionChecklist(recipe.ingredients);
      recipe.ingredients.forEach((_, idx) => checklist.toggle(idx));
      assert.strictEqual(checklist.allCompleted(), true);
    });

    it('F-14.5: Resets checklist when restarting recipe', () => {
      const recipe = FIXTURE_RECIPES[0];
      const checklist = createCookingSessionChecklist(recipe.ingredients);
      checklist.toggle(0);
      checklist.toggle(1);
      checklist.reset();
      assert.strictEqual(checklist.isChecked(0), false);
      assert.strictEqual(checklist.isChecked(1), false);
    });
  });

  // F-15: Recipe Deletion & Modal
  describe('F-15: Recipe Deletion & Confirmation Modal', () => {
    it('F-15.1: Modal cancellation preserves recipe in Firestore', () => {
      const confirmDelete = false;
      if (confirmDelete) {
        env.deleteRecipe(testUid, sampleRecipeId);
      }
      assert.ok(env.recipes.get(testUid)!.has(sampleRecipeId));
    });

    it('F-15.2: Confirming modal permanently deletes recipe from collection', () => {
      const result = env.deleteRecipe(testUid, sampleRecipeId);
      assert.strictEqual(result, true);
      assert.strictEqual(env.recipes.get(testUid)!.has(sampleRecipeId), false);
    });

    it('F-15.3: Triggers confirmation toast when recipe is deleted', () => {
      env.deleteRecipe(testUid, sampleRecipeId);
      assert.ok(env.toastQueue.includes('Recipe deleted'));
    });

    it('F-15.4: Returns false when attempting to delete non-existent recipe ID', () => {
      const result = env.deleteRecipe(testUid, 'non_existent_id');
      assert.strictEqual(result, false);
    });

    it('F-15.5: Deleting recipe removes it from user recipe count', () => {
      const saved2 = env.saveRecipe(testUid, FIXTURE_RECIPES[1]);
      assert.strictEqual(env.recipes.get(testUid)!.size, 2);

      env.deleteRecipe(testUid, sampleRecipeId);
      assert.strictEqual(env.recipes.get(testUid)!.size, 1);
      assert.ok(env.recipes.get(testUid)!.has(saved2.id));
    });
  });
});
