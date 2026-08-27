/**
 * Comprehensive Recipe and Data Fixtures for PlateUp E2E Tests
 */

export interface TestIngredient {
  item: string;
  name?: string;
  amount: string | number;
  unit: string;
  category?: string;
}

export interface TestRecipe {
  id: string;
  userId: string;
  name: string;
  title?: string;
  description: string;
  source: 'youtube' | 'image' | 'manual';
  sourceUrl?: string;
  thumbnailUrl?: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  dietaryTags: string[];
  ingredients: TestIngredient[];
  instructions: string[];
  rating?: number;
  notes?: string;
  timesMade: number;
  lastMadeAt?: Date | null;
  createdAt: Date;
  updatedAt?: Date;
}

export const FIXTURE_RECIPES: TestRecipe[] = [
  {
    id: 'rec_pasta_carbonara',
    userId: 'user_test_1',
    name: 'Classic Spaghetti Carbonara',
    title: 'Classic Spaghetti Carbonara',
    description: 'Silky authentic Roman pasta with guanciale, pecorino romano, and eggs.',
    source: 'youtube',
    sourceUrl: 'https://www.youtube.com/watch?v=D_2DBLAt57c',
    thumbnailUrl: 'https://img.youtube.com/vi/D_2DBLAt57c/hqdefault.jpg',
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    servings: 4,
    difficulty: 'medium',
    tags: ['italian', 'pasta', 'dinner', 'quick'],
    dietaryTags: ['nut-free'],
    ingredients: [
      { item: 'Spaghetti', name: 'Spaghetti', amount: '1', unit: 'lb', category: 'pantry' },
      { item: 'Guanciale', name: 'Guanciale', amount: '200', unit: 'g', category: 'meat' },
      { item: 'Large Eggs', name: 'Large Eggs', amount: '4', unit: 'items', category: 'dairy' },
      { item: 'Pecorino Romano Cheese', name: 'Pecorino Romano Cheese', amount: '1', unit: 'cup', category: 'dairy' },
      { item: 'Black Pepper', name: 'Black Pepper', amount: '1', unit: 'tsp', category: 'spices' },
      { item: 'Kosher Salt', name: 'Kosher Salt', amount: '1', unit: 'tbsp', category: 'spices' },
    ],
    instructions: [
      'Bring a large pot of salted water to a rolling boil.',
      'Crisp the guanciale in a wide skillet over medium heat until golden brown.',
      'Whisk whole eggs and egg yolks with freshly grated Pecorino Romano and cracked black pepper.',
      'Boil spaghetti until al dente, reserving 1 cup of starchy pasta water.',
      'Toss pasta in guanciale fat, remove skillet from direct heat, and vigorously stir in egg mixture with pasta water until glossy.',
      'Serve immediately with extra Pecorino and freshly cracked black pepper.'
    ],
    rating: 5,
    notes: 'Do not overheat the skillet when adding egg mixture to prevent scrambling!',
    timesMade: 8,
    lastMadeAt: new Date('2026-08-20T19:00:00Z'),
    createdAt: new Date('2026-07-01T12:00:00Z'),
    updatedAt: new Date('2026-08-20T19:30:00Z'),
  },
  {
    id: 'rec_grandmas_stew',
    userId: 'user_test_1',
    name: "Grandma's Hearty Beef Stew",
    title: "Grandma's Hearty Beef Stew",
    description: 'Slow-simmered beef chuck with carrots, potatoes, garlic, and fresh thyme.',
    source: 'image',
    sourceUrl: undefined,
    thumbnailUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd',
    prepTimeMinutes: 25,
    cookTimeMinutes: 120,
    servings: 6,
    difficulty: 'hard',
    tags: ['comfort food', 'stew', 'beef', 'dinner', 'slow-cook'],
    dietaryTags: ['gluten-free', 'dairy-free', 'nut-free'],
    ingredients: [
      { item: 'Beef Chuck Roast', name: 'Beef Chuck Roast', amount: '2', unit: 'lbs', category: 'meat' },
      { item: 'Yellow Onion', name: 'Yellow Onion', amount: '2', unit: 'items', category: 'produce' },
      { item: 'Carrots', name: 'Carrots', amount: '4', unit: 'items', category: 'produce' },
      { item: 'Yukon Gold Potatoes', name: 'Yukon Gold Potatoes', amount: '1.5', unit: 'lbs', category: 'produce' },
      { item: 'Garlic Cloves', name: 'Garlic Cloves', amount: '4', unit: 'cloves', category: 'produce' },
      { item: 'Beef Broth', name: 'Beef Broth', amount: '4', unit: 'cups', category: 'pantry' },
      { item: 'Tomato Paste', name: 'Tomato Paste', amount: '2', unit: 'tbsp', category: 'pantry' },
      { item: 'Fresh Thyme Sprigs', name: 'Fresh Thyme Sprigs', amount: '4', unit: 'sprigs', category: 'produce' },
      { item: 'Olive Oil', name: 'Olive Oil', amount: '2', unit: 'tbsp', category: 'pantry' },
    ],
    instructions: [
      'Cut beef chuck roast into 1.5-inch cubes and season generously with kosher salt and pepper.',
      'Brown beef in batches in a Dutch oven with olive oil.',
      'Sauté diced onions and carrots, then stir in garlic and tomato paste for 1 minute.',
      'Deglaze pot with beef broth, return beef, add thyme and potatoes, and simmer gently on low heat for 2 hours until fork tender.'
    ],
    rating: 5,
    notes: 'Great recipe for freezing batches ahead of time.',
    timesMade: 4,
    lastMadeAt: new Date('2026-08-15T18:30:00Z'),
    createdAt: new Date('2026-07-10T10:00:00Z'),
    updatedAt: new Date('2026-08-15T19:00:00Z'),
  },
  {
    id: 'rec_vegan_buddha_bowl',
    userId: 'user_test_1',
    name: 'Rainbow Quinoa Buddha Bowl',
    title: 'Rainbow Quinoa Buddha Bowl',
    description: 'Crispy roasted chickpeas, fluffy tricolor quinoa, avocado, and tahini lemon dressing.',
    source: 'manual',
    sourceUrl: undefined,
    thumbnailUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    servings: 2,
    difficulty: 'easy',
    tags: ['healthy', 'bowl', 'salad', 'lunch', 'high-protein'],
    dietaryTags: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free'],
    ingredients: [
      { item: 'Tricolor Quinoa', name: 'Tricolor Quinoa', amount: '1', unit: 'cup', category: 'pantry' },
      { item: 'Canned Chickpeas', name: 'Canned Chickpeas', amount: '1', unit: 'can', category: 'pantry' },
      { item: 'Hass Avocado', name: 'Hass Avocado', amount: '1', unit: 'items', category: 'produce' },
      { item: 'Baby Spinach', name: 'Baby Spinach', amount: '3', unit: 'cups', category: 'produce' },
      { item: 'Tahini', name: 'Tahini', amount: '3', unit: 'tbsp', category: 'pantry' },
      { item: 'Lemon Juice', name: 'Lemon Juice', amount: '2', unit: 'tbsp', category: 'produce' },
      { item: 'Ground Cumin', name: 'Ground Cumin', amount: '1/2', unit: 'tsp', category: 'spices' },
      { item: 'Smoked Paprika', name: 'Smoked Paprika', amount: '1/2', unit: 'tsp', category: 'spices' },
    ],
    instructions: [
      'Rinse quinoa and cook in 2 cups water for 15 minutes.',
      'Toss drained chickpeas with cumin, paprika, salt, and olive oil; roast at 400°F (200°C) for 20 minutes until crisp.',
      'Whisk tahini with lemon juice, warm water, salt, and garlic powder to form a smooth dressing.',
      'Assemble bowls with spinach, cooked quinoa, crispy chickpeas, and sliced avocado. Drizzle with tahini dressing.'
    ],
    rating: 4,
    notes: 'Super satisfying and rich in dietary fiber.',
    timesMade: 6,
    lastMadeAt: new Date('2026-08-25T12:30:00Z'),
    createdAt: new Date('2026-07-20T14:00:00Z'),
  },
  {
    id: 'rec_keto_salmon',
    userId: 'user_test_1',
    name: 'Pan-Seared Crispy Salmon with Garlic Herb Butter',
    title: 'Pan-Seared Crispy Salmon with Garlic Herb Butter',
    description: 'Golden skin salmon fillets basted in rosemary-garlic butter with asparagus.',
    source: 'youtube',
    sourceUrl: 'https://youtu.be/dQw4w9WgXcQ',
    thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    prepTimeMinutes: 10,
    cookTimeMinutes: 12,
    servings: 2,
    difficulty: 'easy',
    tags: ['seafood', 'keto', 'low-carb', 'dinner', 'pescatarian'],
    dietaryTags: ['keto', 'low-carb', 'gluten-free', 'pescatarian', 'nut-free'],
    ingredients: [
      { item: 'Fresh Salmon Fillets', name: 'Fresh Salmon Fillets', amount: '2', unit: 'items', category: 'meat' },
      { item: 'Unsalted Butter', name: 'Unsalted Butter', amount: '3', unit: 'tbsp', category: 'dairy' },
      { item: 'Garlic Cloves', name: 'Garlic Cloves', amount: '3', unit: 'cloves', category: 'produce' },
      { item: 'Fresh Rosemary', name: 'Fresh Rosemary', amount: '2', unit: 'sprigs', category: 'produce' },
      { item: 'Fresh Asparagus', name: 'Fresh Asparagus', amount: '1', unit: 'bunch', category: 'produce' },
      { item: 'Olive Oil', name: 'Olive Oil', amount: '1', unit: 'tbsp', category: 'pantry' },
      { item: 'Lemon Wedges', name: 'Lemon Wedges', amount: '2', unit: 'items', category: 'produce' },
    ],
    instructions: [
      'Pat salmon skin completely dry with paper towels and season fillets with sea salt and black pepper.',
      'Heat oil in a stainless steel skillet over medium-high heat until shimmering.',
      'Place salmon skin-side down and press gently for 30 seconds; sear for 5 minutes until skin is crackling crisp.',
      'Flip salmon, add butter, smashed garlic, and rosemary sprigs to pan.',
      'Baste salmon continuously with foaming butter for 3-4 minutes while searing asparagus spears alongside.'
    ],
    rating: 5,
    notes: 'Skin must be thoroughly dry to guarantee maximum crispiness.',
    timesMade: 10,
    lastMadeAt: new Date('2026-08-26T20:00:00Z'),
    createdAt: new Date('2026-06-15T09:00:00Z'),
  },
  {
    id: 'rec_avocado_toast',
    userId: 'user_test_1',
    name: 'Sourdough Avocado Toast with Poached Egg',
    title: 'Sourdough Avocado Toast with Poached Egg',
    description: 'Toasted artisan sourdough topped with crushed avocado, chili flakes, and a runny poached egg.',
    source: 'manual',
    sourceUrl: undefined,
    thumbnailUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8',
    prepTimeMinutes: 5,
    cookTimeMinutes: 5,
    servings: 1,
    difficulty: 'easy',
    tags: ['breakfast', 'quick', 'vegetarian'],
    dietaryTags: ['vegetarian', 'nut-free'],
    ingredients: [
      { item: 'Artisan Sourdough Bread', name: 'Artisan Sourdough Bread', amount: '2', unit: 'slices', category: 'bakery' },
      { item: 'Ripe Avocado', name: 'Ripe Avocado', amount: '1', unit: 'items', category: 'produce' },
      { item: 'Fresh Egg', name: 'Fresh Egg', amount: '1', unit: 'items', category: 'dairy' },
      { item: 'Red Pepper Flakes', name: 'Red Pepper Flakes', amount: '1/4', unit: 'tsp', category: 'spices' },
      { item: 'Flaky Sea Salt', name: 'Flaky Sea Salt', amount: '1/4', unit: 'tsp', category: 'spices' },
      { item: 'Extra Virgin Olive Oil', name: 'Extra Virgin Olive Oil', amount: '1', unit: 'tsp', category: 'pantry' },
    ],
    instructions: [
      'Toast sourdough slices until deep golden and crunchy.',
      'Poach egg in barely simmering water with a dash of white vinegar for 3 minutes.',
      'Mash avocado with olive oil, sea salt, and a squeeze of lemon.',
      'Spread avocado over toast, top with poached egg, and sprinkle with red pepper flakes.'
    ],
    rating: 4,
    notes: 'Breakfast staple.',
    timesMade: 12,
    lastMadeAt: new Date('2026-08-27T08:00:00Z'),
    createdAt: new Date('2026-05-01T07:00:00Z'),
  },
  {
    id: 'rec_beef_tacos',
    userId: 'user_test_1',
    name: 'Street-Style Beef Tacos with Cilantro Lime',
    title: 'Street-Style Beef Tacos with Cilantro Lime',
    description: 'Seared seasoned minced beef served on warm corn tortillas with chopped onions, cilantro, and salsa.',
    source: 'youtube',
    sourceUrl: 'https://youtube.com/shorts/abcdef12345',
    thumbnailUrl: 'https://img.youtube.com/vi/abcdef12345/hqdefault.jpg',
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    servings: 4,
    difficulty: 'easy',
    tags: ['mexican', 'tacos', 'dinner', 'beef'],
    dietaryTags: ['gluten-free', 'dairy-free', 'nut-free'],
    ingredients: [
      { item: 'Ground Beef', name: 'Ground Beef', amount: '1.5', unit: 'lbs', category: 'meat' },
      { item: 'White Onion', name: 'White Onion', amount: '1', unit: 'items', category: 'produce' },
      { item: 'Fresh Cilantro', name: 'Fresh Cilantro', amount: '1', unit: 'bunch', category: 'produce' },
      { item: 'Corn Tortillas', name: 'Corn Tortillas', amount: '12', unit: 'items', category: 'bakery' },
      { item: 'Lime', name: 'Lime', amount: '2', unit: 'items', category: 'produce' },
      { item: 'Ground Cumin', name: 'Ground Cumin', amount: '1', unit: 'tsp', category: 'spices' },
      { item: 'Chili Powder', name: 'Chili Powder', amount: '1', unit: 'tbsp', category: 'spices' },
      { item: 'Garlic Powder', name: 'Garlic Powder', amount: '1', unit: 'tsp', category: 'spices' },
    ],
    instructions: [
      'Brown ground beef in a skillet, breaking into small crumbles.',
      'Add cumin, chili powder, garlic powder, salt, and 1/4 cup water; simmer for 5 minutes until sauce thickens.',
      'Warm corn tortillas on a dry hot comal or pan.',
      'Fill tortillas with beef and top with finely diced onions, chopped cilantro, and fresh lime wedges.'
    ],
    rating: 5,
    timesMade: 7,
    lastMadeAt: new Date('2026-08-18T19:00:00Z'),
    createdAt: new Date('2026-07-05T18:00:00Z'),
  }
];

export const MOCK_YOUTUBE_TRANSCRIPTS = {
  pastaCarbonara: {
    videoId: 'D_2DBLAt57c',
    title: 'Authentic Roman Spaghetti Carbonara in 15 Minutes',
    description: 'Learn how to make true Italian Carbonara without cream, peas, or bacon.',
    transcript: 'Welcome back! Today we are making authentic Roman Carbonara. You need 1 pound of spaghetti, 200 grams of guanciale, 4 large eggs, and 1 cup of freshly grated pecorino romano cheese. First crisp the guanciale in a skillet. Whisk eggs with pecorino and plenty of black pepper. Cook pasta in boiling salted water until al dente. Mix pasta with guanciale fat off heat, stir in egg mixture with pasta water for a creamy sauce. Buon appetito!'
  },
  thaiGreenCurry: {
    videoId: 'THAI1234567',
    title: 'Easy Vegan Thai Green Curry with Tofu and Veggies',
    description: 'A creamy, fragrant 20-minute coconut green curry.',
    transcript: 'In this recipe we make a fast 100% vegan Thai green curry. Heat 2 tablespoons of coconut oil, add 3 tablespoons green curry paste. Pour in 1 can of coconut milk. Add 1 block of cubed firm tofu, 1 cup bamboo shoots, 1 bell pepper sliced, and 1 cup fresh basil. Simmer for 10 minutes. Season with soy sauce and lime juice. Serve over steamed jasmine rice.'
  }
};
