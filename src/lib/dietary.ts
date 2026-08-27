import type { DietaryRestriction, DietaryOptionInfo, Recipe } from '@/types';

export const STANDARD_DIETARY_RESTRICTIONS: DietaryRestriction[] = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'keto',
  'low-carb',
  'pescatarian',
  'nut-free',
];

export const DIETARY_OPTIONS: DietaryOptionInfo[] = [
  {
    id: 'vegetarian',
    label: 'Vegetarian',
    description: 'No meat, poultry, or seafood',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    id: 'vegan',
    label: 'Vegan',
    description: '100% plant-based, no animal products or dairy',
    badgeClass: 'bg-green-100 text-green-800 border-green-200',
  },
  {
    id: 'gluten-free',
    label: 'Gluten-Free',
    description: 'Free from wheat, barley, rye, and gluten grains',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    id: 'dairy-free',
    label: 'Dairy-Free',
    description: 'No milk, cheese, butter, or lactose products',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    id: 'keto',
    label: 'Keto',
    description: 'High-fat, very low carb (<20g net carbs)',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    id: 'low-carb',
    label: 'Low-Carb',
    description: 'Reduced carbohydrate meals',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  {
    id: 'pescatarian',
    label: 'Pescatarian',
    description: 'Plant-based plus fish and seafood (no meat/poultry)',
    badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  },
  {
    id: 'nut-free',
    label: 'Nut-Free',
    description: 'Free from peanuts and tree nuts',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
  },
];

export function getDietaryBadgeClass(tag: string): string {
  const normalized = tag.toLowerCase().trim();
  const option = DIETARY_OPTIONS.find((opt) => opt.id === normalized);
  if (option) return option.badgeClass;

  if (normalized.includes('veg')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (normalized.includes('gluten')) return 'bg-amber-100 text-amber-800 border-amber-200';
  if (normalized.includes('dairy')) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (normalized.includes('keto')) return 'bg-purple-100 text-purple-800 border-purple-200';
  if (normalized.includes('carb')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
  if (normalized.includes('fish') || normalized.includes('pesc')) return 'bg-cyan-100 text-cyan-800 border-cyan-200';
  if (normalized.includes('nut')) return 'bg-rose-100 text-rose-800 border-rose-200';

  return 'bg-stone-100 text-stone-700 border-stone-200';
}

/**
 * Deterministic fallback dietary tag detector based on ingredients and instructions.
 */
export function detectDietaryTags(
  ingredients: { item: string; amount?: string; unit?: string }[],
  instructions: string[] = []
): DietaryRestriction[] {
  const text = [
    ...ingredients.map((i) => i.item.toLowerCase()),
    ...instructions.map((ins) => ins.toLowerCase()),
  ].join(' ');

  const tags: DietaryRestriction[] = [];

  const meatKeywords = [
    'beef', 'pork', 'chicken', 'turkey', 'lamb', 'steak', 'bacon', 'pancetta',
    'prosciutto', 'sausage', 'ham', 'meatball', 'ribeye', 'veal', 'duck', 'poultry'
  ];
  const seafoodKeywords = [
    'salmon', 'tuna', 'shrimp', 'prawn', 'fish', 'cod', 'halibut', 'crab',
    'lobster', 'scallop', 'anchov', 'sardine', 'tilapia', 'trout', 'mussel', 'clam'
  ];
  const dairyKeywords = [
    'milk', 'cheese', 'butter', 'cream', 'yogurt', 'parmesan', 'cheddar',
    'mozzarella', 'ricotta', 'ghee', 'whey', 'sour cream', 'half-and-half'
  ];
  const glutenKeywords = [
    'flour', 'wheat', 'bread', 'pasta', 'spaghetti', 'noodle', 'soy sauce',
    'barley', 'rye', 'couscous', 'semolina', 'breadcrumb', 'tortilla'
  ];
  const nutKeywords = [
    'peanut', 'almond', 'walnut', 'cashew', 'pecan', 'hazelnut', 'pistachio',
    'macadamia', 'nut butter', 'peanut butter', 'almond butter'
  ];

  const hasMeat = meatKeywords.some((w) => text.includes(w));
  const hasSeafood = seafoodKeywords.some((w) => text.includes(w));
  const hasDairy = dairyKeywords.some((w) => text.includes(w));
  const hasGluten = glutenKeywords.some((w) => text.includes(w));
  const hasNuts = nutKeywords.some((w) => text.includes(w));

  // Vegetarian: No meat, poultry, or seafood
  if (!hasMeat && !hasSeafood) {
    tags.push('vegetarian');
  }

  // Vegan: Vegetarian and no dairy or eggs or animal products
  const hasEgg = text.includes('egg');
  if (!hasMeat && !hasSeafood && !hasDairy && !hasEgg && !text.includes('honey')) {
    tags.push('vegan');
  }

  // Pescatarian: No meat, but allows fish/seafood or vegetarian base
  if (!hasMeat) {
    tags.push('pescatarian');
  }

  // Dairy-Free: No dairy
  if (!hasDairy) {
    tags.push('dairy-free');
  }

  // Gluten-Free: No gluten
  if (!hasGluten) {
    tags.push('gluten-free');
  }

  // Nut-Free: No nuts
  if (!hasNuts) {
    tags.push('nut-free');
  }

  // Keto / Low-Carb indicators
  const isHighCarb = text.includes('sugar') || text.includes('rice') || text.includes('potato') || hasGluten;
  if (!isHighCarb && (hasMeat || hasSeafood || hasEgg || text.includes('avocado') || text.includes('olive oil'))) {
    tags.push('keto');
    tags.push('low-carb');
  }

  return tags;
}

/**
 * Filter recipes by active dietary restrictions
 */
export function filterRecipesByDietary(
  recipes: Recipe[],
  restrictions: DietaryRestriction[] | string[]
): Recipe[] {
  if (!restrictions || restrictions.length === 0) {
    return recipes;
  }

  return recipes.filter((recipe) => {
    const allTags = [
      ...(Array.isArray(recipe.dietaryTags) ? recipe.dietaryTags.map((t) => t.toLowerCase()) : []),
      ...(Array.isArray(recipe.tags) ? recipe.tags.map((t) => t.toLowerCase()) : []),
    ];
    return restrictions.every((req) => allTags.includes(req.toLowerCase()));
  });
}
