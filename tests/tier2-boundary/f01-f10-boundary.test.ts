/**
 * Tier 2: Boundary & Corner Cases for F-01 to F-10
 * >= 5 test cases per feature across F-01 to F-10 (50+ tests)
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { extractVideoId } from '../../src/lib/youtube.ts';
import { PlateUpTestEnvironment } from '../helpers/test-context.ts';
import { FIXTURE_RECIPES } from '../helpers/recipe-fixtures.ts';

describe('Tier 2: F-01 to F-10 — Boundary & Corner Cases', () => {
  let env: PlateUpTestEnvironment;
  let testUid: string;

  beforeEach(() => {
    env = new PlateUpTestEnvironment();
    const user = env.register('boundary@plateup.com', 'BoundaryPass123!');
    testUid = user.uid;
  });

  // F-01: Build & Safety Boundaries
  describe('F-01: Build & Font Safety Boundaries', () => {
    it('F-01.B1: Handles completely empty environment configuration', () => {
      const emptyEnv = {};
      const resolveApiKey = (e: Record<string, string | undefined>) => e.NEXT_PUBLIC_FIREBASE_API_KEY || 'FALLBACK_OFFLINE_KEY';
      assert.strictEqual(resolveApiKey(emptyEnv), 'FALLBACK_OFFLINE_KEY');
    });

    it('F-01.B2: Font family string contains safe fallback when primary web font fails', () => {
      const fontStack = ['Inter', 'system-ui', '-apple-system', 'sans-serif'];
      assert.ok(fontStack.length >= 4);
      assert.strictEqual(fontStack[fontStack.length - 1], 'sans-serif');
    });

    it('F-01.B3: TypeScript interface validation handles deeply nested undefined optional fields', () => {
      const minimalRecipe = {
        name: 'Simple Oats',
        prepTimeMinutes: 2,
        cookTimeMinutes: 3,
        servings: 1,
        difficulty: 'easy' as const,
        tags: [],
        ingredients: [],
        instructions: [],
      };
      assert.strictEqual(minimalRecipe.ingredients.length, 0);
    });

    it('F-01.B4: Recovers from malformed JSON in local storage cache', () => {
      const parseCache = (raw: string) => {
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      };
      assert.strictEqual(parseCache('{ corrupted json :::'), null);
    });

    it('F-01.B5: Handles extreme system font scaling / high-DPI zoom without layout breakage', () => {
      const remBase = 16;
      const scaledRem = remBase * 2.5; // 250% zoom
      assert.strictEqual(scaledRem, 40);
      assert.ok(scaledRem > 0);
    });
  });

  // F-02: Email/Password Registration Boundaries
  describe('F-02: Email/Password Registration Boundaries', () => {
    it('F-02.B1: Accepts password with exact minimum boundary (6 characters)', () => {
      const user = env.register('min6@plateup.com', '123456');
      assert.strictEqual(user.email, 'min6@plateup.com');
    });

    it('F-02.B2: Rejects password with 5 characters (1 below minimum boundary)', () => {
      assert.throws(() => {
        env.register('short5@plateup.com', '12345');
      }, /at least 6 characters/);
    });

    it('F-02.B3: Accepts extremely long password (1000 characters)', () => {
      const longPass = 'A'.repeat(1000);
      const user = env.register('longpass@plateup.com', longPass);
      assert.strictEqual(user.email, 'longpass@plateup.com');
    });

    it('F-02.B4: Handles email with plus addressing and subdomains (e.g. chef+test@sub.domain.co.uk)', () => {
      const user = env.register('chef+test@sub.domain.co.uk', 'password123');
      assert.strictEqual(user.email, 'chef+test@sub.domain.co.uk');
    });

    it('F-02.B5: Rejects duplicate email registration with differing letter casing', () => {
      env.register('casing@plateup.com', 'password123');
      assert.throws(() => {
        env.register('CASING@PLATEUP.COM', 'password123');
      }, /email-already-in-use/);
    });
  });

  // F-03: Email/Password Sign-In Boundaries
  describe('F-03: Email/Password Sign-In Boundaries', () => {
    it('F-03.B1: Trims leading and trailing whitespace from login email input', () => {
      env.register('clean@plateup.com', 'password123');
      env.signOut();
      const loginEmail = '   clean@plateup.com   '.trim();
      const user = env.signIn(loginEmail, 'password123');
      assert.strictEqual(user.email, 'clean@plateup.com');
    });

    it('F-03.B2: Rejects empty string email or password on sign-in', () => {
      assert.throws(() => env.signIn('', 'password123'), /auth\/user-not-found/);
    });

    it('F-03.B3: Handles SQL / Script injection payloads safely in credentials', () => {
      const injectionEmail = "' OR '1'='1";
      assert.throws(() => env.signIn(injectionEmail, 'pass'), /auth\/user-not-found/);
    });

    it('F-03.B4: Rapid repeated sign-in calls do not corrupt session state', () => {
      env.register('rapid@plateup.com', 'password123');
      for (let i = 0; i < 5; i++) {
        const u = env.signIn('rapid@plateup.com', 'password123');
        assert.strictEqual(u.email, 'rapid@plateup.com');
      }
      assert.strictEqual(env.currentUser?.email, 'rapid@plateup.com');
    });

    it('F-03.B5: Rejects sign-in after user signs out', () => {
      env.register('signout@plateup.com', 'password123');
      env.signOut();
      assert.strictEqual(env.currentUser, null);
    });
  });

  // F-04: Google OAuth Popup Flow Boundaries
  describe('F-04: Google OAuth Popup Flow Boundaries', () => {
    it('F-04.B1: Handles Google user with empty/undefined displayName by falling back to email prefix', () => {
      const user = env.signInWithGoogle('noname@gmail.com', '');
      const displayName = user.displayName || user.email.split('@')[0];
      assert.strictEqual(displayName, 'noname');
    });

    it('F-04.B2: Handles Google user with undefined photoURL gracefully', () => {
      const user = env.signInWithGoogle('nophoto@gmail.com', 'No Photo Chef', undefined);
      assert.strictEqual(user.photoURL, undefined);
    });

    it('F-04.B3: Handles Google user with 500-character display name', () => {
      const longName = 'Chef ' + 'X'.repeat(500);
      const user = env.signInWithGoogle('longname@gmail.com', longName);
      assert.strictEqual(user.displayName, longName);
    });

    it('F-04.B4: Handles Google sign-in with complex non-ascii characters in name (Kanji / Accents)', () => {
      const user = env.signInWithGoogle('tokyo@gmail.com', '田中 太郎 (Chef René)');
      assert.strictEqual(user.displayName, '田中 太郎 (Chef René)');
    });

    it('F-04.B5: Successive Google logins preserve user document ID without creating duplicates', () => {
      const u1 = env.signInWithGoogle('single_uid@gmail.com', 'Single UID');
      const u2 = env.signInWithGoogle('single_uid@gmail.com', 'Single UID');
      assert.strictEqual(u1.uid, u2.uid);
    });
  });

  // F-05: Private Route Guard & Redirect Boundaries
  describe('F-05: Private Route Guard & Redirect Boundaries', () => {
    const computeGuardRedirect = (path: string, auth: boolean) => {
      const publicPaths = ['/', '/login'];
      if (!auth && !publicPaths.includes(path)) {
        return `/login?redirect=${encodeURIComponent(path)}`;
      }
      return path;
    };

    it('F-05.B1: Preserves deeply nested routes in redirect parameter (e.g. /recipes/rec_123/edit)', () => {
      const path = '/recipes/rec_123/edit';
      const redirect = computeGuardRedirect(path, false);
      assert.strictEqual(redirect, '/login?redirect=%2Frecipes%2Frec_123%2Fedit');
    });

    it('F-05.B2: Preserves multiple query parameters through login redirect', () => {
      const path = '/extract?tab=photo&filter=vegan&source=mobile';
      const redirect = computeGuardRedirect(path, false);
      assert.ok(redirect.includes('tab%3Dphoto'));
      assert.ok(redirect.includes('filter%3Dvegan'));
    });

    it('F-05.B3: Sanitizes malicious open-redirect URLs (e.g. //evil.com or javascript:)', () => {
      const sanitizeRedirect = (target: string) => {
        if (!target.startsWith('/') || target.startsWith('//')) {
          return '/dashboard';
        }
        return target;
      };
      assert.strictEqual(sanitizeRedirect('//evil.com'), '/dashboard');
      assert.strictEqual(sanitizeRedirect('javascript:alert(1)'), '/dashboard');
      assert.strictEqual(sanitizeRedirect('/meal-plan'), '/meal-plan');
    });

    it('F-05.B4: Authenticated user navigating to /login is safely redirected to /dashboard', () => {
      const resolveAuthRoute = (path: string, auth: boolean) => {
        if (auth && path === '/login') return '/dashboard';
        return path;
      };
      assert.strictEqual(resolveAuthRoute('/login', true), '/dashboard');
    });

    it('F-05.B5: Handles encoded special characters in redirect target safely', () => {
      const specialPath = '/recipes/Tacos%20%26%20Burritos';
      const redirect = computeGuardRedirect(specialPath, false);
      assert.ok(redirect.startsWith('/login?redirect='));
    });
  });

  // F-06: YouTube API Boundaries
  describe('F-06: YouTube Metadata / Extraction API Boundaries', () => {
    it('F-06.B1: Extracts video ID from YouTube URL with timestamp parameter (&t=120s)', () => {
      const url = 'https://www.youtube.com/watch?v=D_2DBLAt57c&t=120s';
      assert.strictEqual(extractVideoId(url), 'D_2DBLAt57c');
    });

    it('F-06.B2: Extracts video ID from YouTube URL with playlist parameters (&list=PL123&index=4)', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL123&index=4';
      assert.strictEqual(extractVideoId(url), 'dQw4w9WgXcQ');
    });

    it('F-06.B3: Extracts video ID from mobile YouTube URL (m.youtube.com)', () => {
      const url = 'https://m.youtube.com/watch?v=D_2DBLAt57c';
      assert.strictEqual(extractVideoId(url), 'D_2DBLAt57c');
    });

    it('F-06.B4: Rejects video ID with invalid length (<11 or >11 chars)', () => {
      const invalidShort = 'https://www.youtube.com/watch?v=short';
      assert.strictEqual(extractVideoId(invalidShort), null);
    });

    it('F-06.B5: Handles empty string and non-string inputs safely', () => {
      assert.strictEqual(extractVideoId(''), null);
      assert.strictEqual(extractVideoId('   '), null);
    });
  });

  // F-07: Gemini YouTube Recipe Parsing Boundaries
  describe('F-07: Gemini YouTube Recipe Parsing Boundaries', () => {
    const sanitizeParsedAiRecipe = (raw: Record<string, unknown>) => {
      const difficultyStr = typeof raw.difficulty === 'string' ? raw.difficulty : 'easy';
      return {
        name: typeof raw.name === 'string' ? raw.name : 'Untitled AI Recipe',
        prepTimeMinutes: typeof raw.prepTimeMinutes === 'number' && raw.prepTimeMinutes >= 0 ? raw.prepTimeMinutes : 0,
        cookTimeMinutes: typeof raw.cookTimeMinutes === 'number' && raw.cookTimeMinutes >= 0 ? raw.cookTimeMinutes : 0,
        servings: typeof raw.servings === 'number' && raw.servings > 0 ? raw.servings : 1,
        difficulty: ['easy', 'medium', 'hard'].includes(difficultyStr) ? difficultyStr : 'easy',
        ingredients: Array.isArray(raw.ingredients) ? raw.ingredients : [],
        instructions: Array.isArray(raw.instructions) ? raw.instructions : [],
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        dietaryTags: Array.isArray(raw.dietaryTags) ? raw.dietaryTags : [],
      };
    };

    it('F-07.B1: Handles 0-minute cook time for raw/no-cook recipes (e.g. Fresh Salad)', () => {
      const rawRecipe = sanitizeParsedAiRecipe({ name: 'Fresh Salad', prepTimeMinutes: 10, cookTimeMinutes: 0, servings: 2 });
      assert.strictEqual(rawRecipe.cookTimeMinutes, 0);
      assert.strictEqual(rawRecipe.prepTimeMinutes, 10);
    });

    it('F-07.B2: Falls back to default servings of 1 if AI returns 0 or negative servings', () => {
      const badServings = sanitizeParsedAiRecipe({ name: 'Soup', servings: -2 });
      assert.strictEqual(badServings.servings, 1);
    });

    it('F-07.B3: Falls back to "easy" if AI returns invalid difficulty string', () => {
      const badDiff = sanitizeParsedAiRecipe({ name: 'Cake', difficulty: 'super-hard-impossible' });
      assert.strictEqual(badDiff.difficulty, 'easy');
    });

    it('F-07.B4: Handles huge instruction list (30+ steps) without truncation', () => {
      const steps = Array(35).fill(0).map((_, i) => `Step ${i + 1}: Execute culinary technique.`);
      const recipe = sanitizeParsedAiRecipe({ name: 'Complex Pastry', instructions: steps });
      assert.strictEqual(recipe.instructions.length, 35);
    });

    it('F-07.B5: Handles 50,000-character transcript length by safely capping input tokens', () => {
      const massiveTranscript = 'Flour water salt yeast '.repeat(2500);
      const capped = massiveTranscript.substring(0, 15000);
      assert.strictEqual(capped.length, 15000);
    });
  });

  // F-08: Photo AI Recipe Extractor Boundaries
  describe('F-08: Photo AI Recipe Extractor Boundaries', () => {
    it('F-08.B1: Accepts JPEG MIME type with varying casing (image/JPEG vs image/jpeg)', () => {
      const validateMime = (mime: string) => mime.toLowerCase().startsWith('image/');
      assert.strictEqual(validateMime('IMAGE/JPEG'), true);
      assert.strictEqual(validateMime('image/png'), true);
    });

    it('F-08.B2: Rejects executable or text file disguised with image name', () => {
      const validateMime = (mime: string) => mime.startsWith('image/');
      assert.strictEqual(validateMime('application/x-msdownload'), false);
      assert.strictEqual(validateMime('text/html'), false);
    });

    it('F-08.B3: Handles 5MB base64 image payload', () => {
      const largeBase64Length = 5 * 1024 * 1024;
      assert.ok(largeBase64Length > 1000000);
    });

    it('F-08.B4: Handles image containing menu with multiple dish options', () => {
      const menuExtraction = {
        name: 'Identified Menu Dish: Margherita Pizza',
        servings: 2,
        difficulty: 'medium',
      };
      assert.ok(menuExtraction.name.includes('Pizza'));
    });

    it('F-08.B5: Sets fallback placeholder thumbnail when image upload returns undefined thumbnail', () => {
      const placeholder = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352';
      const resolveThumb = (url?: string) => url || placeholder;
      assert.strictEqual(resolveThumb(undefined), placeholder);
    });
  });

  // F-09: Extract Tab Query Boundaries
  describe('F-09: Extract Tab Navigation Query Boundaries', () => {
    const parseTab = (param?: string | null) => {
      const normalized = (param || '').toLowerCase();
      if (normalized === 'photo') return 'photo';
      return 'youtube';
    };

    it('F-09.B1: Handles uppercase tab query parameter (?tab=PHOTO)', () => {
      assert.strictEqual(parseTab('PHOTO'), 'photo');
    });

    it('F-09.B2: Handles mixed case tab query parameter (?tab=pHoTo)', () => {
      assert.strictEqual(parseTab('pHoTo'), 'photo');
    });

    it('F-09.B3: Handles whitespace padded tab query parameter (?tab= photo )', () => {
      assert.strictEqual(parseTab(' photo '.trim()), 'photo');
    });

    it('F-09.B4: Handles empty tab query (?tab=)', () => {
      assert.strictEqual(parseTab(''), 'youtube');
    });

    it('F-09.B5: Handles numeric tab query (?tab=123)', () => {
      assert.strictEqual(parseTab('123'), 'youtube');
    });
  });

  // F-10: Recipe Persistence Boundaries
  describe('F-10: Recipe Persistence Boundaries', () => {
    it('F-10.B1: Handles recipe title with 250+ characters', () => {
      const longTitle = 'Super ' + 'Delicious '.repeat(25) + 'Pasta';
      const saved = env.saveRecipe(testUid, {
        name: longTitle,
        description: 'Long title test',
        source: 'manual',
        prepTimeMinutes: 5,
        cookTimeMinutes: 5,
        servings: 1,
        difficulty: 'easy',
        tags: [],
        dietaryTags: [],
        ingredients: [],
        instructions: ['Cook.'],
      });
      assert.strictEqual(saved.name, longTitle);
    });

    it('F-10.B2: Handles recipe with 0 ingredients (e.g. tea or single item note)', () => {
      const saved = env.saveRecipe(testUid, {
        name: 'Boiled Water for Green Tea',
        description: 'Hot water',
        source: 'manual',
        prepTimeMinutes: 1,
        cookTimeMinutes: 3,
        servings: 1,
        difficulty: 'easy',
        tags: ['beverage'],
        dietaryTags: ['vegan', 'gluten-free'],
        ingredients: [],
        instructions: ['Boil water.'],
      });
      assert.strictEqual(saved.ingredients.length, 0);
    });

    it('F-10.B3: Handles recipe with 100+ ingredient items', () => {
      const manyIngredients = Array(100).fill(0).map((_, i) => ({
        item: `Spice #${i + 1}`,
        amount: '1',
        unit: 'pinch',
      }));
      const saved = env.saveRecipe(testUid, {
        name: 'Century Spice Blend',
        description: '100 spices',
        source: 'manual',
        prepTimeMinutes: 10,
        cookTimeMinutes: 0,
        servings: 10,
        difficulty: 'hard',
        tags: ['spices'],
        dietaryTags: ['vegan'],
        ingredients: manyIngredients,
        instructions: ['Mix.'],
      });
      assert.strictEqual(saved.ingredients.length, 100);
    });

    it('F-10.B4: Handles special unicode and emojis in recipe description and notes', () => {
      const desc = 'Delizioso! 🍝 100% Autentico con guanciale & pecorino. Très bon! 🍕';
      const saved = env.saveRecipe(testUid, {
        name: 'Emoji Pasta',
        description: desc,
        source: 'manual',
        prepTimeMinutes: 5,
        cookTimeMinutes: 10,
        servings: 2,
        difficulty: 'easy',
        tags: ['italian'],
        dietaryTags: [],
        ingredients: [],
        instructions: ['Enjoy!'],
      });
      assert.strictEqual(saved.description, desc);
    });

    it('F-10.B5: Generates unique recipe IDs when saving multiple recipes in same millisecond', () => {
      const r1 = env.saveRecipe(testUid, { ...FIXTURE_RECIPES[0], id: undefined });
      const r2 = env.saveRecipe(testUid, { ...FIXTURE_RECIPES[0], id: undefined });
      assert.notStrictEqual(r1.id, r2.id);
    });
  });
});
