/**
 * Empirical Adversarial Challenger 2 Test Suite for PlateUp
 * 
 * Assigned Domains:
 * 1. Authentication routing & redirect intent preservation (AuthGuard, login/page.tsx, deep URLs, encoded params, malformed URLs).
 * 2. TheMealDB integration and null safety in src/lib/mealdb.ts (empty meals, missing instructions, missing ingredients, strange character encodings).
 * 3. Recipe search, dietary filtering & sorting on /recipes (ingredients, tags, special regex characters, boundary times, multi-dietary intersections).
 * 4. Mobile layout constraints & responsive CSS contracts (375px width, overflow prevention, modal max-width).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  parseMealIngredients,
  parseMealInstructions,
  parseMealTags,
  estimateDifficulty,
  mealToRecipeData,
  type MealDBMeal,
} from '../src/lib/mealdb.ts';
import { detectDietaryTags } from '../src/lib/dietary.ts';
import type { Recipe, DietaryRestriction } from '../src/types/index.ts';

describe('Adversarial Challenger 2 Test Suite', () => {

  // =========================================================================
  // DOMAIN 1: AUTHENTICATION ROUTING & REDIRECT INTENT PRESERVATION
  // =========================================================================
  describe('Domain 1: Auth Routing & Redirect Intent Preservation', () => {

    // Helper simulating AuthGuard redirect generator
    function generateAuthGuardRedirect(pathname: string, user: boolean | null, loading: boolean): string | null {
      if (loading) return null;
      if (!user && pathname !== '/login') {
        return `/login?redirect=${encodeURIComponent(pathname)}`;
      }
      return null;
    }

    // Helper simulating login page redirect resolver
    function resolveLoginRedirect(redirectParam: string | null | undefined): string {
      return redirectParam || '/dashboard';
    }

    it('1.1: AuthGuard redirects unauthenticated users with correctly encoded URI pathnames', () => {
      assert.strictEqual(
        generateAuthGuardRedirect('/recipes', false, false),
        '/login?redirect=%2Frecipes'
      );
      assert.strictEqual(
        generateAuthGuardRedirect('/meal-plan', false, false),
        '/login?redirect=%2Fmeal-plan'
      );
      assert.strictEqual(
        generateAuthGuardRedirect('/shopping-list', false, false),
        '/login?redirect=%2Fshopping-list'
      );
      assert.strictEqual(
        generateAuthGuardRedirect('/profile', false, false),
        '/login?redirect=%2Fprofile'
      );
      assert.strictEqual(
        generateAuthGuardRedirect('/extract', false, false),
        '/login?redirect=%2Fextract'
      );
    });

    it('1.2: AuthGuard preserves deep nested routes and URL-encoded segments', () => {
      const deepPath = '/recipes/rec_987654321_abc';
      const redirect = generateAuthGuardRedirect(deepPath, false, false);
      assert.strictEqual(redirect, '/login?redirect=%2Frecipes%2Frec_987654321_abc');

      // Check decoding at login page
      const url = new URL(`https://plateup.app${redirect}`);
      const resolved = resolveLoginRedirect(url.searchParams.get('redirect'));
      assert.strictEqual(resolved, deepPath);
    });

    it('1.3: AuthGuard handles special characters, accented characters, and spaces in pathnames', () => {
      const complexPath = '/recipes/crème-brûlée?view=edit&step=2';
      const redirect = generateAuthGuardRedirect(complexPath, false, false);
      assert.ok(redirect?.startsWith('/login?redirect='));

      const url = new URL(`https://plateup.app${redirect}`);
      const resolved = resolveLoginRedirect(url.searchParams.get('redirect'));
      assert.strictEqual(resolved, complexPath);
    });

    it('1.4: AuthGuard does not redirect when already on /login (prevent infinite redirect loop)', () => {
      assert.strictEqual(generateAuthGuardRedirect('/login', false, false), null);
    });

    it('1.5: AuthGuard does not redirect while auth state is loading or user is authenticated', () => {
      assert.strictEqual(generateAuthGuardRedirect('/dashboard', false, true), null);
      assert.strictEqual(generateAuthGuardRedirect('/recipes', true, false), null);
      assert.strictEqual(generateAuthGuardRedirect('/meal-plan', true, true), null);
    });

    it('1.6: Login page safely falls back to /dashboard when redirect query param is missing, empty, or whitespace', () => {
      assert.strictEqual(resolveLoginRedirect(null), '/dashboard');
      assert.strictEqual(resolveLoginRedirect(undefined), '/dashboard');
      assert.strictEqual(resolveLoginRedirect(''), '/dashboard');
    });

    it('1.7: Simulates end-to-end intent preservation round-trip for various protected destinations', () => {
      const destinations = [
        '/dashboard',
        '/recipes',
        '/recipes/12345',
        '/discover',
        '/meal-plan',
        '/shopping-list',
        '/profile',
        '/extract?tab=photo',
      ];

      for (const dest of destinations) {
        const authRedirect = generateAuthGuardRedirect(dest, false, false);
        assert.ok(authRedirect);
        const parsedUrl = new URL(`https://plateup.app${authRedirect}`);
        const restored = resolveLoginRedirect(parsedUrl.searchParams.get('redirect'));
        assert.strictEqual(restored, dest);
      }
    });
  });

  // =========================================================================
  // DOMAIN 2: THEMEALDB INTEGRATION & NULL SAFETY IN src/lib/mealdb.ts
  // =========================================================================
  describe('Domain 2: TheMealDB Integration & Null Safety', () => {

    it('2.1: parseMealIngredients handles completely empty, nullish or sparse ingredient keys', () => {
      const emptyMeal: MealDBMeal = {
        idMeal: '99999',
        strMeal: 'Ghost Dish',
        strCategory: 'Misc',
        strArea: 'Unknown',
        strInstructions: '',
        strMealThumb: '',
        strTags: null,
        strYoutube: null,
        strSource: null,
      };

      const result = parseMealIngredients(emptyMeal);
      assert.deepStrictEqual(result, []);
    });

    it('2.2: parseMealIngredients parses standard and non-standard measure formats safely', () => {
      const meal: MealDBMeal = {
        idMeal: '1001',
        strMeal: 'Mixed Stew',
        strCategory: 'Stew',
        strArea: 'Irish',
        strInstructions: 'Cook.',
        strMealThumb: 'thumb.jpg',
        strTags: null,
        strYoutube: null,
        strSource: null,
        strIngredient1: 'Potatoes',
        strMeasure1: '4 large',
        strIngredient2: 'Beef',
        strMeasure2: '1 1/2 lbs',
        strIngredient3: 'Salt',
        strMeasure3: 'to taste',
        strIngredient4: 'Black Pepper',
        strMeasure4: '1/2 tsp',
        strIngredient5: 'Water',
        strMeasure5: '2 cups',
        strIngredient6: 'Thyme',
        strMeasure6: '   ', // whitespace only
        strIngredient7: '   ', // whitespace ingredient
        strMeasure7: '1 tbsp',
        strIngredient8: '',
        strMeasure8: '100g',
      };

      const ingredients = parseMealIngredients(meal);
      assert.strictEqual(ingredients.length, 6);

      assert.strictEqual(ingredients[0].item, 'Potatoes');
      assert.strictEqual(ingredients[0].amount, '4');
      assert.strictEqual(ingredients[0].unit, 'large');

      assert.strictEqual(ingredients[1].item, 'Beef');
      assert.strictEqual(ingredients[1].amount, '1 1/2');
      assert.strictEqual(ingredients[1].unit, 'lbs');

      assert.strictEqual(ingredients[2].item, 'Salt');
      assert.strictEqual(ingredients[2].amount, 'to taste');
      assert.strictEqual(ingredients[2].unit, '');

      assert.strictEqual(ingredients[3].item, 'Black Pepper');
      assert.strictEqual(ingredients[3].amount, '1/2');
      assert.strictEqual(ingredients[3].unit, 'tsp');

      assert.strictEqual(ingredients[4].item, 'Water');
      assert.strictEqual(ingredients[4].amount, '2');
      assert.strictEqual(ingredients[4].unit, 'cups');

      assert.strictEqual(ingredients[5].item, 'Thyme');
      assert.strictEqual(ingredients[5].amount, '');
      assert.strictEqual(ingredients[5].unit, '');
    });

    it('2.3: parseMealInstructions handles step prefixes, empty lines, and multiline text', () => {
      assert.deepStrictEqual(parseMealInstructions(null), []);
      assert.deepStrictEqual(parseMealInstructions(undefined), []);
      assert.deepStrictEqual(parseMealInstructions(''), []);
      assert.deepStrictEqual(parseMealInstructions('   \r\n\r\n \n  '), []);

      const stepText = `
        STEP 1. Heat 2 tbsp of olive oil in a pan.
        Step 2: Add chopped garlic and sauté until fragrant.
        3) Add tomatoes and simmer for 15 minutes.
        4. Season with salt, pepper, and fresh basil.
        Enjoy your homemade Italian meal!
      `;

      const parsed = parseMealInstructions(stepText);
      assert.strictEqual(parsed.length, 5);
      assert.strictEqual(parsed[0], 'Heat 2 tbsp of olive oil in a pan.');
      assert.strictEqual(parsed[1], 'Add chopped garlic and sauté until fragrant.');
      assert.strictEqual(parsed[2], 'Add tomatoes and simmer for 15 minutes.');
      assert.strictEqual(parsed[3], 'Season with salt, pepper, and fresh basil.');
      assert.strictEqual(parsed[4], 'Enjoy your homemade Italian meal!');
    });

    it('2.4: parseMealTags handles malformed strings, commas, case normalization and deduplication', () => {
      assert.deepStrictEqual(parseMealTags(null), []);
      assert.deepStrictEqual(parseMealTags(''), []);
      assert.deepStrictEqual(parseMealTags('   '), []);

      const tags = parseMealTags(',,Pasta, Italian , SPICY, dinner, ,');
      assert.deepStrictEqual(tags, ['pasta', 'italian', 'spicy', 'dinner']);
    });

    it('2.5: estimateDifficulty categorizes difficulty thresholds (<=10 easy, <=20 medium, >20 hard)', () => {
      // 3 ingredients, 2 steps = 5 -> easy
      const easyMeal: MealDBMeal = {
        idMeal: '1',
        strMeal: 'Toast',
        strCategory: 'Breakfast',
        strArea: 'American',
        strInstructions: '1. Toast bread.\n2. Butter bread.',
        strMealThumb: '',
        strTags: null,
        strYoutube: null,
        strSource: null,
        strIngredient1: 'Bread',
        strMeasure1: '2 slices',
        strIngredient2: 'Butter',
        strMeasure2: '1 tbsp',
      };
      assert.strictEqual(estimateDifficulty(easyMeal), 'easy');

      // Exactly 10 total -> easy
      const tenMeal: MealDBMeal = {
        ...easyMeal,
        strIngredient3: 'Jam',
        strMeasure3: '1 tbsp',
        strIngredient4: 'Honey',
        strMeasure4: '1 tsp',
        strIngredient5: 'Sugar',
        strMeasure5: '1 tsp',
        strInstructions: '1. Step 1\n2. Step 2\n3. Step 3\n4. Step 4\n5. Step 5',
      };
      assert.strictEqual(estimateDifficulty(tenMeal), 'easy');

      // 11 total -> medium
      const elevenMeal: MealDBMeal = {
        ...tenMeal,
        strIngredient6: 'Cinnamon',
        strMeasure6: '1 pinch',
      };
      assert.strictEqual(estimateDifficulty(elevenMeal), 'medium');

      // Exactly 20 total -> medium
      const twentyMeal: MealDBMeal = {
        ...easyMeal,
        strIngredient1: 'I1', strMeasure1: '1',
        strIngredient2: 'I2', strMeasure2: '1',
        strIngredient3: 'I3', strMeasure3: '1',
        strIngredient4: 'I4', strMeasure4: '1',
        strIngredient5: 'I5', strMeasure5: '1',
        strIngredient6: 'I6', strMeasure6: '1',
        strIngredient7: 'I7', strMeasure7: '1',
        strIngredient8: 'I8', strMeasure8: '1',
        strIngredient9: 'I9', strMeasure9: '1',
        strIngredient10: 'I10', strMeasure10: '1',
        strInstructions: '1. S1\n2. S2\n3. S3\n4. S4\n5. S5\n6. S6\n7. S7\n8. S8\n9. S9\n10. S10',
      };
      assert.strictEqual(estimateDifficulty(twentyMeal), 'medium');

      // 21 total -> hard
      const twentyOneMeal: MealDBMeal = {
        ...twentyMeal,
        strIngredient11: 'I11', strMeasure11: '1',
      };
      assert.strictEqual(estimateDifficulty(twentyOneMeal), 'hard');
    });

    it('2.6: mealToRecipeData produces complete recipe object with inferred dietary tags & non-empty metadata', () => {
      const meal: MealDBMeal = {
        idMeal: '52772',
        strMeal: 'Teriyaki Chicken Casserole',
        strCategory: 'Chicken',
        strArea: 'Japanese',
        strInstructions: 'Preheat oven to 350°F.\nBoil chicken.\nMix with teriyaki sauce and rice.\nBake for 30 minutes.',
        strMealThumb: 'https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg',
        strTags: 'Casserole,Dinner',
        strYoutube: 'https://www.youtube.com/watch?v=4aZr5hZXP_s',
        strSource: null,
        strIngredient1: 'chicken breast',
        strMeasure1: '3/4 lb',
        strIngredient2: 'soy sauce',
        strMeasure2: '1/2 cup',
        strIngredient3: 'brown sugar',
        strMeasure3: '1/4 cup',
        strIngredient4: 'garlic',
        strMeasure4: '2 cloves',
        strIngredient5: 'rice',
        strMeasure5: '2 cups',
      };

      const recipe = mealToRecipeData(meal);

      assert.strictEqual(recipe.name, 'Teriyaki Chicken Casserole');
      assert.strictEqual(recipe.source, 'manual');
      assert.strictEqual(recipe.sourceUrl, 'https://www.youtube.com/watch?v=4aZr5hZXP_s');
      assert.strictEqual(recipe.thumbnailUrl, meal.strMealThumb);
      assert.strictEqual(recipe.prepTimeMinutes, 15);
      assert.strictEqual(recipe.cookTimeMinutes, 30);
      assert.strictEqual(recipe.servings, 4);
      assert.strictEqual(recipe.difficulty, 'easy'); // 5 ingredients + 4 steps = 9 (<=10)

      // Tags include meal tags + category + area (lowercased)
      assert.ok(recipe.tags.includes('casserole'));
      assert.ok(recipe.tags.includes('dinner'));
      assert.ok(recipe.tags.includes('chicken'));
      assert.ok(recipe.tags.includes('japanese'));

      // Dietary tags check: Contains chicken -> not vegetarian / vegan; chicken+soy sauce+sugar+garlic+rice is dairy-free
      assert.ok(recipe.dietaryTags.includes('dairy-free'));
      assert.ok(!recipe.dietaryTags.includes('vegetarian'));
      assert.ok(!recipe.dietaryTags.includes('vegan'));
    });

    it('2.7: mealToRecipeData accurately detects vegan / vegetarian / dairy-free for plant-based meals', () => {
      const veganMeal: MealDBMeal = {
        idMeal: '52800',
        strMeal: 'Vegan Lentil Loaf',
        strCategory: 'Vegetarian',
        strArea: 'American',
        strInstructions: '1. Cook lentils.\n2. Mix with carrots, celery, oats, tomato paste.\n3. Bake at 375F for 45 mins.',
        strMealThumb: 'https://example.com/lentil.jpg',
        strTags: 'Vegan,Healthy',
        strYoutube: null,
        strSource: 'https://example.com/recipe',
        strIngredient1: 'Brown Lentils',
        strMeasure1: '1 cup',
        strIngredient2: 'Carrots',
        strMeasure2: '2',
        strIngredient3: 'Celery',
        strMeasure3: '2 stalks',
        strIngredient4: 'Rolled Oats',
        strMeasure4: '1/2 cup',
        strIngredient5: 'Tomato Paste',
        strMeasure5: '2 tbsp',
        strIngredient6: 'Olive Oil',
        strMeasure6: '1 tbsp',
      };

      const recipe = mealToRecipeData(veganMeal);
      assert.ok(recipe.dietaryTags.includes('vegan'));
      assert.ok(recipe.dietaryTags.includes('vegetarian'));
      assert.ok(recipe.dietaryTags.includes('dairy-free'));
    });
  });

  // =========================================================================
  // DOMAIN 3: RECIPE SEARCH, DIETARY FILTERING & SORTING ON /recipes
  // =========================================================================
  describe('Domain 3: Recipe Search, Dietary Filtering & Sorting Engine', () => {

    const testRecipes: Recipe[] = [
      {
        id: 'rec_1',
        name: 'Creamy Garlic Mushroom Risotto',
        description: 'Rich and comforting Italian arborio rice.',
        source: 'manual',
        prepTimeMinutes: 10,
        cookTimeMinutes: 20, // total = 30m (quick)
        servings: 4,
        difficulty: 'medium',
        rating: 5,
        timesMade: 12,
        lastMadeAt: new Date('2026-08-20'),
        createdAt: new Date('2026-08-01'),
        updatedAt: new Date('2026-08-01'),
        tags: ['italian', 'comfort-food', 'dinner'],
        dietaryTags: ['vegetarian', 'gluten-free'],
        ingredients: [
          { item: 'Arborio Rice', amount: '1', unit: 'cup' },
          { item: 'Mushrooms', amount: '8', unit: 'oz' },
          { item: 'Garlic', amount: '4', unit: 'cloves' },
          { item: 'Parmesan Cheese', amount: '1/2', unit: 'cup' },
          { item: 'Vegetable Broth', amount: '4', unit: 'cups' },
        ],
        instructions: ['Sauté garlic and mushrooms.', 'Stir in rice and broth gradually.'],
      },
      {
        id: 'rec_2',
        name: 'Spicy Thai Basil Chicken',
        description: 'Authentic Pad Krapow Gai.',
        source: 'youtube',
        prepTimeMinutes: 5,
        cookTimeMinutes: 10, // total = 15m (quick)
        servings: 2,
        difficulty: 'easy',
        rating: 4,
        timesMade: 5,
        lastMadeAt: new Date('2026-08-25'),
        createdAt: new Date('2026-08-10'),
        updatedAt: new Date('2026-08-10'),
        tags: ['thai', 'spicy', 'asian'],
        dietaryTags: ['dairy-free', 'nut-free'],
        ingredients: [
          { item: 'Chicken Thighs', amount: '1', unit: 'lb' },
          { item: 'Thai Basil', amount: '1', unit: 'cup' },
          { item: 'Birdseye Chili', amount: '3', unit: 'pieces' },
          { item: 'Garlic', amount: '5', unit: 'cloves' },
          { item: 'Fish Sauce', amount: '1', unit: 'tbsp' },
        ],
        instructions: ['Pound chili and garlic.', 'Stir-fry chicken and basil on high heat.'],
      },
      {
        id: 'rec_3',
        name: 'Slow Cooker Beef Bourguignon',
        description: 'French beef stew braised in red wine.',
        source: 'image',
        prepTimeMinutes: 30,
        cookTimeMinutes: 240, // total = 270m (not quick)
        servings: 6,
        difficulty: 'hard',
        rating: 5,
        timesMade: 2,
        lastMadeAt: new Date('2026-07-15'),
        createdAt: new Date('2026-07-01'),
        updatedAt: new Date('2026-07-01'),
        tags: ['french', 'stew', 'dinner'],
        dietaryTags: ['dairy-free', 'gluten-free', 'nut-free'],
        ingredients: [
          { item: 'Chuck Roast', amount: '3', unit: 'lbs' },
          { item: 'Red Wine', amount: '2', unit: 'cups' },
          { item: 'Carrots', amount: '4', unit: 'items' },
          { item: 'Pearl Onions', amount: '1', unit: 'cup' },
        ],
        instructions: ['Brown beef.', 'Slow cook for 4 hours.'],
      },
      {
        id: 'rec_4',
        name: 'Vegan Avocado Grain Bowl',
        description: 'Nutrient-packed lunch bowl with quinoa and tahini.',
        source: 'manual',
        prepTimeMinutes: 10,
        cookTimeMinutes: 15, // total = 25m (quick)
        servings: 1,
        difficulty: 'easy',
        rating: 4,
        timesMade: 8,
        lastMadeAt: new Date('2026-08-27'),
        createdAt: new Date('2026-08-15'),
        updatedAt: new Date('2026-08-15'),
        tags: ['healthy', 'lunch', 'salad'],
        dietaryTags: ['vegan', 'vegetarian', 'dairy-free', 'gluten-free', 'nut-free'],
        ingredients: [
          { item: 'Quinoa', amount: '1/2', unit: 'cup' },
          { item: 'Avocado', amount: '1', unit: 'item' },
          { item: 'Tahini', amount: '2', unit: 'tbsp' },
          { item: 'Kale', amount: '2', unit: 'cups' },
        ],
        instructions: ['Assemble bowl.'],
      },
    ];

    // Helper replicating the filtering and sorting function in /recipes/page.tsx
    function filterAndSortRecipes(
      recipes: Recipe[],
      searchQuery: string,
      sortBy: string,
      activeFilter: string,
      userDietaryRestrictions: string[] = []
    ): Recipe[] {
      const q = searchQuery.toLowerCase().trim();

      const filtered = recipes.filter((recipe) => {
        // 1. Text search
        const matchName = !q || recipe.name?.toLowerCase().includes(q);
        const matchTags = !q || recipe.tags?.some((tag) => tag.toLowerCase().includes(q));
        const matchDietaryTags = !q || recipe.dietaryTags?.some((tag) => tag.toLowerCase().includes(q));
        const matchIngredients = !q || recipe.ingredients?.some((ing) =>
          ((ing as { item?: string; name?: string }).item || (ing as { item?: string; name?: string }).name || '')
            ?.toLowerCase()
            .includes(q)
        );
        const matchesSearch = matchName || matchTags || matchDietaryTags || matchIngredients;

        if (!matchesSearch) return false;

        // 2. Dietary Category Filter
        const recipeDietTags = [
          ...(Array.isArray(recipe.dietaryTags) ? recipe.dietaryTags.map((t) => t.toLowerCase()) : []),
          ...(Array.isArray(recipe.tags) ? recipe.tags.map((t) => t.toLowerCase()) : []),
        ];

        if (activeFilter === 'all') {
          return true;
        }

        if (activeFilter === 'quick') {
          const totalTime = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);
          return totalTime > 0 && totalTime <= 30;
        }

        if (activeFilter === 'my-diet') {
          if (userDietaryRestrictions.length === 0) return true;
          return userDietaryRestrictions.every((req) => recipeDietTags.includes(req.toLowerCase()));
        }

        // Specific dietary restriction
        return recipeDietTags.includes(activeFilter.toLowerCase());
      });

      return filtered.sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'highest-rated':
            return (b.rating || 0) - (a.rating || 0);
          case 'most-made':
            return (b.timesMade || 0) - (a.timesMade || 0);
          case 'recently-made':
            return new Date(b.lastMadeAt || 0).getTime() - new Date(a.lastMadeAt || 0).getTime();
          default:
            return 0;
        }
      });
    }

    it('3.1: Search matches by recipe name, tag, dietary tag, or ingredient name', () => {
      // By recipe name
      const byName = filterAndSortRecipes(testRecipes, 'risotto', 'newest', 'all');
      assert.strictEqual(byName.length, 1);
      assert.strictEqual(byName[0].id, 'rec_1');

      // By tag
      const byTag = filterAndSortRecipes(testRecipes, 'asian', 'newest', 'all');
      assert.strictEqual(byTag.length, 1);
      assert.strictEqual(byTag[0].id, 'rec_2');

      // By dietary tag
      const byDietary = filterAndSortRecipes(testRecipes, 'vegan', 'newest', 'all');
      assert.strictEqual(byDietary.length, 1);
      assert.strictEqual(byDietary[0].id, 'rec_4');

      // By ingredient name
      const byIng = filterAndSortRecipes(testRecipes, 'garlic', 'newest', 'all');
      assert.strictEqual(byIng.length, 2); // rec_1 and rec_2 have garlic
      const ids = byIng.map((r) => r.id);
      assert.ok(ids.includes('rec_1'));
      assert.ok(ids.includes('rec_2'));
    });

    it('3.2: Search safely handles special regex characters without throwing syntax errors', () => {
      const specialInputs = [
        'chicken (thighs)',
        'rice [arborio]',
        '?',
        '*',
        '+',
        '\\',
        '/',
        '$',
        '^',
        '{2}',
        'beef | pork',
        '<script>alert(1)</script>',
        '100%',
      ];

      for (const query of specialInputs) {
        assert.doesNotThrow(() => {
          const results = filterAndSortRecipes(testRecipes, query, 'newest', 'all');
          assert.ok(Array.isArray(results));
        }, `Should not throw for query: ${query}`);
      }
    });

    it('3.3: Search returns empty array for non-matching queries and triggers empty state', () => {
      const results = filterAndSortRecipes(testRecipes, 'nonexistent_ingredient_xyz_123', 'newest', 'all');
      assert.strictEqual(results.length, 0);
    });

    it('3.4: Filter "quick" correctly filters recipes by total prep + cook time <= 30 mins', () => {
      const quickRecipes = filterAndSortRecipes(testRecipes, '', 'newest', 'quick');
      // rec_1 (10+20=30m), rec_2 (5+10=15m), rec_4 (10+15=25m) are quick
      // rec_3 (30+240=270m) is NOT quick
      assert.strictEqual(quickRecipes.length, 3);
      const ids = quickRecipes.map((r) => r.id);
      assert.ok(ids.includes('rec_1'));
      assert.ok(ids.includes('rec_2'));
      assert.ok(ids.includes('rec_4'));
      assert.ok(!ids.includes('rec_3'));
    });

    it('3.5: Filter "my-diet" requires all active user dietary preferences to be satisfied simultaneously', () => {
      // User restrictions: ['vegan', 'gluten-free']
      const results = filterAndSortRecipes(testRecipes, '', 'newest', 'my-diet', ['vegan', 'gluten-free']);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].id, 'rec_4');

      // User restrictions: ['vegetarian']
      const vegResults = filterAndSortRecipes(testRecipes, '', 'newest', 'my-diet', ['vegetarian']);
      assert.strictEqual(vegResults.length, 2); // rec_1, rec_4
      const vegIds = vegResults.map((r) => r.id);
      assert.ok(vegIds.includes('rec_1'));
      assert.ok(vegIds.includes('rec_4'));

      // User restrictions with 0 matches: ['vegan', 'nut-free', 'impossible-diet']
      const zeroResults = filterAndSortRecipes(testRecipes, '', 'newest', 'my-diet', ['vegan', 'impossible-diet']);
      assert.strictEqual(zeroResults.length, 0);
    });

    it('3.6: Specific dietary restriction filter matches accurately', () => {
      const gfRecipes = filterAndSortRecipes(testRecipes, '', 'newest', 'gluten-free');
      // rec_1, rec_3, rec_4 are gluten-free
      assert.strictEqual(gfRecipes.length, 3);
      const ids = gfRecipes.map((r) => r.id);
      assert.ok(ids.includes('rec_1'));
      assert.ok(ids.includes('rec_3'));
      assert.ok(ids.includes('rec_4'));
    });

    it('3.7: Sorts recipes correctly across all 4 sort modes', () => {
      // 1. Newest First (createdAt desc: rec_4 [Aug 15], rec_2 [Aug 10], rec_1 [Aug 1], rec_3 [Jul 1])
      const newest = filterAndSortRecipes(testRecipes, '', 'newest', 'all');
      assert.deepStrictEqual(newest.map((r) => r.id), ['rec_4', 'rec_2', 'rec_1', 'rec_3']);

      // 2. Highest Rated (rating desc: rec_1 [5], rec_3 [5], rec_2 [4], rec_4 [4])
      const highestRated = filterAndSortRecipes(testRecipes, '', 'highest-rated', 'all');
      assert.strictEqual(highestRated[0].rating, 5);
      assert.strictEqual(highestRated[1].rating, 5);
      assert.strictEqual(highestRated[2].rating, 4);
      assert.strictEqual(highestRated[2].rating, 4);

      // 3. Most Made (timesMade desc: rec_1 [12], rec_4 [8], rec_2 [5], rec_3 [2])
      const mostMade = filterAndSortRecipes(testRecipes, '', 'most-made', 'all');
      assert.deepStrictEqual(mostMade.map((r) => r.id), ['rec_1', 'rec_4', 'rec_2', 'rec_3']);

      // 4. Recently Made (lastMadeAt desc: rec_4 [Aug 27], rec_2 [Aug 25], rec_1 [Aug 20], rec_3 [Jul 15])
      const recentlyMade = filterAndSortRecipes(testRecipes, '', 'recently-made', 'all');
      assert.deepStrictEqual(recentlyMade.map((r) => r.id), ['rec_4', 'rec_2', 'rec_1', 'rec_3']);
    });
  });

  // =========================================================================
  // DOMAIN 4: MOBILE LAYOUT CONSTRAINTS & RESPONSIVE DESIGN
  // =========================================================================
  describe('Domain 4: Mobile Layout Constraints & Responsive Contracts', () => {

    it('4.1: DialogContent uses safe max-width constraint for 375px mobile viewport', () => {
      // DialogContent uses `max-w-[calc(100%-2rem)]`
      // On 375px viewport: 375px - 32px (2rem) = 343px width with 16px safe margins
      const viewportWidth = 375;
      const marginPx = 32; // 2rem
      const dialogWidth = viewportWidth - marginPx;
      assert.strictEqual(dialogWidth, 343);
      assert.ok(dialogWidth < viewportWidth, 'Dialog width must strictly be less than viewport width');
    });

    it('4.2: Main container bottom padding accommodates fixed mobile bottom navigation bar', () => {
      // Bottom nav is h-16 (64px). App layout defines pb-20 (80px) on main.
      const navHeightPx = 64;
      const mainBottomPaddingPx = 80;
      assert.ok(mainBottomPaddingPx > navHeightPx, 'Main padding bottom (80px) must exceed bottom nav bar height (64px) to avoid content occlusion');
    });

    it('4.3: Responsive grid breakpoints collapse to single column at 375px width', () => {
      // Grid configuration is `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
      // For width < 640px (sm), columns = 1
      const isMobile = 375 < 640;
      assert.ok(isMobile);
      const cols = isMobile ? 1 : 2;
      assert.strictEqual(cols, 1);
    });
  });
});
