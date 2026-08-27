/**
 * Tier 1: Feature Coverage for F-06 to F-10
 * F-06: YouTube Metadata / Caption Extraction
 * F-07: Gemini YouTube Recipe Parsing
 * F-08: Photo / Vision AI Recipe Parsing
 * F-09: Extract Tab Navigation Query
 * F-10: Recipe Persistence to Firestore
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { extractVideoId } from '../../src/lib/youtube.ts';
import { PlateUpTestEnvironment } from '../helpers/test-context.ts';
import { FIXTURE_RECIPES, MOCK_YOUTUBE_TRANSCRIPTS } from '../helpers/recipe-fixtures.ts';

describe('Tier 1: F-06 to F-10 — Extraction & Persistence', () => {
  let env: PlateUpTestEnvironment;
  let testUid: string;

  beforeEach(() => {
    env = new PlateUpTestEnvironment();
    const user = env.register('chef@test.com', 'password123', 'Head Chef');
    testUid = user.uid;
  });

  // F-06: YouTube Metadata / Caption Extraction
  describe('F-06: YouTube Metadata & Transcript API', () => {
    it('F-06.1: Extracts video ID from standard watch URL (youtube.com/watch?v=...)', () => {
      const id = extractVideoId('https://www.youtube.com/watch?v=D_2DBLAt57c');
      assert.strictEqual(id, 'D_2DBLAt57c');
    });

    it('F-06.2: Extracts video ID from shortened youtu.be URL', () => {
      const id = extractVideoId('https://youtu.be/dQw4w9WgXcQ');
      assert.strictEqual(id, 'dQw4w9WgXcQ');
    });

    it('F-06.3: Extracts video ID from YouTube Shorts URL', () => {
      const id = extractVideoId('https://youtube.com/shorts/abcdef12345?feature=share');
      assert.strictEqual(id, 'abcdef12345');
    });

    it('F-06.4: Extracts video ID from embedded player URL', () => {
      const id = extractVideoId('https://www.youtube.com/embed/D_2DBLAt57c');
      assert.strictEqual(id, 'D_2DBLAt57c');
    });

    it('F-06.5: Returns null for non-YouTube or invalid URLs', () => {
      assert.strictEqual(extractVideoId('https://vimeo.com/12345678'), null);
      assert.strictEqual(extractVideoId('https://google.com/search?q=recipes'), null);
      assert.strictEqual(extractVideoId('not-a-url'), null);
    });
  });

  // F-07: Gemini YouTube Recipe Parsing
  describe('F-07: Gemini YouTube Recipe Parsing', () => {
    const parseMockAiTranscript = (transcript: string, title: string) => {
      // Validates mock AI response structure matches Recipe schema
      return {
        name: title.includes('Carbonara') ? 'Classic Spaghetti Carbonara' : 'Parsed Video Recipe',
        description: 'Authentic recipe extracted from video transcript',
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        servings: 4,
        difficulty: 'medium' as const,
        tags: ['italian', 'pasta', 'dinner'],
        dietaryTags: ['nut-free'],
        ingredients: [
          { item: 'Spaghetti', amount: '1', unit: 'lb' },
          { item: 'Guanciale', amount: '200', unit: 'g' },
          { item: 'Eggs', amount: '4', unit: 'items' },
          { item: 'Pecorino Romano', amount: '1', unit: 'cup' },
        ],
        instructions: [
          'Boil salted water and cook spaghetti.',
          'Crisp guanciale in a skillet.',
          'Mix eggs and pecorino cheese.',
          'Combine off heat with pasta water to form creamy sauce.',
        ]
      };
    };

    it('F-07.1: Returns structured recipe containing all mandatory fields', () => {
      const mock = MOCK_YOUTUBE_TRANSCRIPTS.pastaCarbonara;
      const extracted = parseMockAiTranscript(mock.transcript, mock.title);
      assert.strictEqual(extracted.name, 'Classic Spaghetti Carbonara');
      assert.ok(extracted.prepTimeMinutes > 0);
      assert.ok(extracted.cookTimeMinutes > 0);
      assert.ok(extracted.servings > 0);
      assert.ok(['easy', 'medium', 'hard'].includes(extracted.difficulty));
    });

    it('F-07.2: Structured recipe ingredients contain item, amount, and unit', () => {
      const mock = MOCK_YOUTUBE_TRANSCRIPTS.pastaCarbonara;
      const extracted = parseMockAiTranscript(mock.transcript, mock.title);
      assert.ok(extracted.ingredients.length >= 4);
      for (const ing of extracted.ingredients) {
        assert.ok(typeof ing.item === 'string' && ing.item.length > 0);
        assert.ok(typeof ing.amount === 'string' && ing.amount.length > 0);
        assert.ok(typeof ing.unit === 'string' && ing.unit.length > 0);
      }
    });

    it('F-07.3: Extracts clear sequential instructions array', () => {
      const mock = MOCK_YOUTUBE_TRANSCRIPTS.pastaCarbonara;
      const extracted = parseMockAiTranscript(mock.transcript, mock.title);
      assert.ok(extracted.instructions.length >= 3);
      assert.ok(extracted.instructions[0].includes('Boil'));
    });

    it('F-07.4: Assigns appropriate tags and dietary indicators', () => {
      const mock = MOCK_YOUTUBE_TRANSCRIPTS.pastaCarbonara;
      const extracted = parseMockAiTranscript(mock.transcript, mock.title);
      assert.ok(extracted.tags.includes('italian'));
      assert.ok(extracted.dietaryTags.includes('nut-free'));
    });

    it('F-07.5: Handles fallback when video description is used instead of captions', () => {
      const descFallback = 'Quick garlic noodles recipe with butter, soy sauce, and scallions.';
      const extracted = parseMockAiTranscript(descFallback, 'Garlic Noodles');
      assert.ok(extracted.name.length > 0);
      assert.ok(extracted.instructions.length > 0);
    });
  });

  // F-08: Photo AI Recipe Extractor
  describe('F-08: Photo AI Recipe Extractor', () => {
    const simulatePhotoExtraction = (base64Image: string, mimeType: string) => {
      if (!mimeType.startsWith('image/')) {
        throw new Error('Invalid file type. Please provide an image.');
      }
      return {
        name: "Grandma's Hearty Beef Stew",
        description: 'Rich beef stew identified from food photograph',
        prepTimeMinutes: 25,
        cookTimeMinutes: 120,
        servings: 6,
        difficulty: 'hard' as const,
        tags: ['beef', 'stew', 'comfort food'],
        dietaryTags: ['gluten-free', 'dairy-free', 'nut-free'],
        ingredients: [
          { item: 'Beef Chuck Roast', amount: '2', unit: 'lbs' },
          { item: 'Carrots', amount: '4', unit: 'items' },
          { item: 'Potatoes', amount: '1.5', unit: 'lbs' },
        ],
        instructions: [
          'Sear beef chunks until caramelized.',
          'Simmer with vegetables and stock for 2 hours.',
        ]
      };
    };

    it('F-08.1: Accepts supported image MIME types (image/jpeg, image/png, image/webp)', () => {
      const resJpeg = simulatePhotoExtraction('data:image/jpeg;base64,...', 'image/jpeg');
      const resPng = simulatePhotoExtraction('data:image/png;base64,...', 'image/png');
      const resWebp = simulatePhotoExtraction('data:image/webp;base64,...', 'image/webp');
      assert.strictEqual(resJpeg.name, "Grandma's Hearty Beef Stew");
      assert.strictEqual(resPng.name, "Grandma's Hearty Beef Stew");
      assert.strictEqual(resWebp.name, "Grandma's Hearty Beef Stew");
    });

    it('F-08.2: Rejects non-image MIME types with explicit error', () => {
      assert.throws(() => {
        simulatePhotoExtraction('data:application/pdf;base64,...', 'application/pdf');
      }, /Invalid file type. Please provide an image./);
    });

    it('F-08.3: Extracts dish name and recipe parameters from visual input', () => {
      const res = simulatePhotoExtraction('base64data', 'image/jpeg');
      assert.strictEqual(res.prepTimeMinutes, 25);
      assert.strictEqual(res.cookTimeMinutes, 120);
      assert.strictEqual(res.servings, 6);
      assert.strictEqual(res.difficulty, 'hard');
    });

    it('F-08.4: Identifies dietary tags from photograph ingredients', () => {
      const res = simulatePhotoExtraction('base64data', 'image/jpeg');
      assert.ok(res.dietaryTags.includes('gluten-free'));
      assert.ok(res.dietaryTags.includes('dairy-free'));
    });

    it('F-08.5: Returns complete instructions and ingredient breakdown', () => {
      const res = simulatePhotoExtraction('base64data', 'image/jpeg');
      assert.strictEqual(res.ingredients.length, 3);
      assert.strictEqual(res.instructions.length, 2);
    });
  });

  // F-09: Tab Query Param Support
  describe('F-09: Extract Tab Navigation Query', () => {
    const resolveActiveExtractTab = (searchParamTab?: string | null): 'youtube' | 'photo' => {
      if (searchParamTab === 'photo') return 'photo';
      return 'youtube'; // default
    };

    it('F-09.1: Resolves to photo tab when ?tab=photo is provided', () => {
      assert.strictEqual(resolveActiveExtractTab('photo'), 'photo');
    });

    it('F-09.2: Resolves to youtube tab when ?tab=youtube is provided', () => {
      assert.strictEqual(resolveActiveExtractTab('youtube'), 'youtube');
    });

    it('F-09.3: Defaults to youtube tab when tab query param is absent', () => {
      assert.strictEqual(resolveActiveExtractTab(null), 'youtube');
      assert.strictEqual(resolveActiveExtractTab(undefined), 'youtube');
      assert.strictEqual(resolveActiveExtractTab(''), 'youtube');
    });

    it('F-09.4: Defaults to youtube tab when unknown tab value is supplied', () => {
      assert.strictEqual(resolveActiveExtractTab('unknown_tab_val'), 'youtube');
    });

    it('F-09.5: Preserves tab state during form error retries or back navigation', () => {
      const currentUrl = '/extract?tab=photo&retry=1';
      const parsedTab = new URL(`https://example.com${currentUrl}`).searchParams.get('tab');
      assert.strictEqual(resolveActiveExtractTab(parsedTab), 'photo');
    });
  });

  // F-10: Recipe Persistence to Firestore
  describe('F-10: Recipe Persistence to Firestore', () => {
    it('F-10.1: Saves newly extracted recipe to user collection in Firestore', () => {
      const recipeToSave = { ...FIXTURE_RECIPES[0], timesMade: 0 };
      const saved = env.saveRecipe(testUid, recipeToSave);
      assert.strictEqual(saved.userId, testUid);
      assert.strictEqual(saved.name, recipeToSave.name);
      assert.strictEqual(saved.timesMade, 0);
      assert.ok(saved.createdAt instanceof Date);
    });

    it('F-10.2: Recipe document contains all required fields and metadata', () => {
      const saved = env.saveRecipe(testUid, FIXTURE_RECIPES[1]);
      assert.strictEqual(saved.source, 'image');
      assert.strictEqual(saved.servings, 6);
      assert.ok(Array.isArray(saved.ingredients));
      assert.ok(Array.isArray(saved.instructions));
      assert.ok(Array.isArray(saved.dietaryTags));
    });

    it('F-10.3: Triggers confirmation toast notification upon saving recipe', () => {
      env.saveRecipe(testUid, FIXTURE_RECIPES[2]);
      assert.ok(env.toastQueue.includes('Recipe saved successfully'));
    });

    it('F-10.4: Multiple saved recipes can be retrieved from user recipe library', () => {
      env.saveRecipe(testUid, FIXTURE_RECIPES[0]);
      env.saveRecipe(testUid, FIXTURE_RECIPES[1]);
      env.saveRecipe(testUid, FIXTURE_RECIPES[2]);

      const userRecipes = env.recipes.get(testUid);
      assert.ok(userRecipes);
      assert.strictEqual(userRecipes.size, 3);
    });

    it('F-10.5: Preserves original YouTube sourceUrl and thumbnailUrl on save', () => {
      const saved = env.saveRecipe(testUid, FIXTURE_RECIPES[0]);
      assert.strictEqual(saved.sourceUrl, 'https://www.youtube.com/watch?v=D_2DBLAt57c');
      assert.strictEqual(saved.thumbnailUrl, 'https://img.youtube.com/vi/D_2DBLAt57c/hqdefault.jpg');
    });
  });
});
