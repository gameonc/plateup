import { GROCERY_DEPARTMENTS, type GroceryDepartment } from '../types/index.ts';

export { GROCERY_DEPARTMENTS, type GroceryDepartment };

/**
 * Map of vulgar fractions to their decimal equivalents.
 */
const VULGAR_FRACTIONS: Record<string, number> = {
  '½': 0.5,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '¼': 0.25,
  '¾': 0.75,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
  '⅙': 1 / 6,
  '⅚': 5 / 6,
  '⅑': 1 / 9,
  '⅒': 0.1,
};

/**
 * Parses fraction strings, mixed fractions, ranges, vulgar fractions, decimals, and numbers.
 * Safe fallback is 1 (except for explicit 0).
 */
export function parseFractionOrAmount(input: string | number | null | undefined): number {
  if (input === null || input === undefined) return 1;
  if (typeof input === 'number') {
    return isNaN(input) ? 1 : input;
  }

  const trimmed = input.toString().trim();
  if (!trimmed) return 1;

  // Handle explicit zero
  if (trimmed === '0') return 0;

  // Mixed fraction e.g. "1 1/2" or "1-1/2" or "2 3/4"
  const mixedMatch = trimmed.match(/^(\d+)\s*[- ]\s*(\d+)\s*\/\s*(\d+)$/);
  if (mixedMatch) {
    const whole = parseFloat(mixedMatch[1]);
    const num = parseFloat(mixedMatch[2]);
    const den = parseFloat(mixedMatch[3]);
    if (den !== 0) return whole + num / den;
  }

  // Check for vulgar fractions
  for (const [symbol, val] of Object.entries(VULGAR_FRACTIONS)) {
    if (trimmed.includes(symbol)) {
      const parts = trimmed.split(symbol);
      const wholeStr = parts[0].trim();
      const whole = wholeStr ? parseFloat(wholeStr) : 0;
      if (!isNaN(whole)) {
        return whole + val;
      }
      return val;
    }
  }

  // Handle range e.g. "2-3" or "2 to 3" -> take upper bound (3) for conservative shopping
  const rangeMatch = trimmed.match(/^([\d./\s½⅓⅔¼¾⅛⅜⅝⅞]+)\s*(?:-|to)\s*([\d./\s½⅓⅔¼¾⅛⅜⅝⅞]+)$/i);
  if (rangeMatch && rangeMatch[2]) {
    return parseFractionOrAmount(rangeMatch[2]);
  }

  // Simple fraction e.g. "1/2", "3/4", "1/16", "5/8"
  const fractionMatch = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fractionMatch) {
    const num = parseFloat(fractionMatch[1]);
    const den = parseFloat(fractionMatch[2]);
    if (den !== 0) return num / den;
  }

  // Decimal or integer string e.g. "2", "1.5", "0.25"
  const parsed = parseFloat(trimmed);
  return isNaN(parsed) ? 1 : parsed;
}

/**
 * Scales an ingredient amount string by a multiplier (e.g., "2" * 2 → "4", "½" * 2 → "1", "1 1/2" * 2 → "3")
 * Handles Unicode vulgar fractions, standard fractions, mixed fractions, decimals, and preserves unparseable strings.
 */
export function scaleIngredientAmount(amount: string | null | undefined, scale: number): string {
  if (!amount || typeof amount !== 'string') return amount ? String(amount) : '';
  if (scale === 1 || !amount.trim()) return amount;
  if (!/\d|[½⅓⅔¼¾⅛⅜⅝⅞⅙⅚⅑⅒]/.test(amount)) return amount;

  const num = parseFractionOrAmount(amount);
  const scaled = num * scale;
  return formatQuantityDisplay(scaled);
}

/**
 * Formats numeric quantities back to clean human-friendly strings with fractions where appropriate.
 */
export function formatQuantityDisplay(amount: number | null | undefined, unit?: string): string {
  const u = (unit || '').trim();

  if (amount === null || amount === undefined || isNaN(amount)) {
    return u;
  }

  if (amount === 0) {
    return u ? `0 ${u}` : '0';
  }

  // Round floating-point errors
  const rounded = Math.round(amount * 1000) / 1000;
  const whole = Math.floor(rounded);
  const frac = Math.round((rounded - whole) * 1000) / 1000;

  let fracStr = '';
  if (Math.abs(frac - 0.5) < 0.03) fracStr = '1/2';
  else if (Math.abs(frac - 0.25) < 0.03) fracStr = '1/4';
  else if (Math.abs(frac - 0.75) < 0.03) fracStr = '3/4';
  else if (Math.abs(frac - 1 / 3) < 0.03) fracStr = '1/3';
  else if (Math.abs(frac - 2 / 3) < 0.03) fracStr = '2/3';
  else if (Math.abs(frac - 0.125) < 0.03) fracStr = '1/8';
  else if (Math.abs(frac - 0.375) < 0.03) fracStr = '3/8';
  else if (Math.abs(frac - 0.625) < 0.03) fracStr = '5/8';
  else if (Math.abs(frac - 0.875) < 0.03) fracStr = '7/8';
  else if (Math.abs(frac - 0.0625) < 0.02) fracStr = '1/16';

  let qtyStr = '';
  if (fracStr) {
    qtyStr = whole > 0 ? `${whole} ${fracStr}` : fracStr;
  } else if (rounded % 1 === 0) {
    qtyStr = `${rounded}`;
  } else {
    // If not a standard fraction, format to 1 or 2 decimals
    const roundedDec = Math.round(rounded * 100) / 100;
    qtyStr = `${roundedDec}`;
  }

  return u ? `${qtyStr} ${u}`.trim() : qtyStr;
}

export type UnitType = 'volume' | 'weight' | 'count' | 'other';

export interface NormalizedUnitInfo {
  normalizedUnit: string;
  type: UnitType;
}

/**
 * Normalizes raw unit variations to canonical abbreviations and unit types.
 */
export function normalizeUnit(unitStr: string | null | undefined): NormalizedUnitInfo {
  const u = (unitStr || '').trim().toLowerCase();

  // Volume (US / Imperial)
  if (['tsp', 'teaspoon', 'teaspoons', 't'].includes(u)) return { normalizedUnit: 'tsp', type: 'volume' };
  if (['tbsp', 'tablespoon', 'tablespoons', 'tbs', 'tb', 't.'].includes(u)) return { normalizedUnit: 'tbsp', type: 'volume' };
  if (['cup', 'cups', 'c'].includes(u)) return { normalizedUnit: 'cups', type: 'volume' };
  if (['fl oz', 'fluid ounce', 'fluid ounces', 'floz'].includes(u)) return { normalizedUnit: 'fl oz', type: 'volume' };
  if (['pint', 'pints', 'pt'].includes(u)) return { normalizedUnit: 'pints', type: 'volume' };
  if (['quart', 'quarts', 'qt'].includes(u)) return { normalizedUnit: 'quarts', type: 'volume' };
  if (['gal', 'gallon', 'gallons'].includes(u)) return { normalizedUnit: 'gallons', type: 'volume' };

  // Volume (Metric)
  if (['ml', 'milliliter', 'milliliters'].includes(u)) return { normalizedUnit: 'ml', type: 'volume' };
  if (['l', 'liter', 'liters'].includes(u)) return { normalizedUnit: 'liters', type: 'volume' };

  // Weight (US / Imperial)
  if (['oz', 'ounce', 'ounces'].includes(u)) return { normalizedUnit: 'oz', type: 'weight' };
  if (['lb', 'lbs', 'pound', 'pounds'].includes(u)) return { normalizedUnit: 'lbs', type: 'weight' };

  // Weight (Metric)
  if (['g', 'gram', 'grams'].includes(u)) return { normalizedUnit: 'g', type: 'weight' };
  if (['kg', 'kilogram', 'kilograms'].includes(u)) return { normalizedUnit: 'kg', type: 'weight' };

  // Discrete counts
  if ([
    'item', 'items', 'piece', 'pieces', 'clove', 'cloves',
    'slice', 'slices', 'can', 'cans', 'head', 'heads',
    'bunch', 'bunches', 'sprig', 'sprigs', 'stalk', 'stalks',
    'pinch', 'pinches', 'dash', 'dashes', 'pack', 'packs',
    'bag', 'bags', 'roll', 'rolls', 'bottle', 'bottles', 'jar', 'jars'
  ].includes(u)) {
    return { normalizedUnit: u, type: 'count' };
  }

  return { normalizedUnit: u, type: 'other' };
}

/**
 * Categorizes an ingredient into one of the 8 standard store departments.
 */
export function categorizeIngredientDepartment(ingredientName: string, category?: string): GroceryDepartment {
  if (category) {
    const c = category.toLowerCase().trim();
    if (c.includes('produce') || c.includes('veg') || c.includes('fruit') || c.includes('herb')) return 'Produce';
    if (c.includes('dairy') || c.includes('cheese') || c.includes('milk') || c.includes('egg')) return 'Dairy';
    if (c.includes('meat') || c.includes('seafood') || c.includes('poultry') || c.includes('fish')) return 'Meat/Seafood';
    if (c.includes('spice') || c.includes('season')) return 'Spices/Seasonings';
    if (c.includes('bakery') || c.includes('bread')) return 'Bakery';
    if (c.includes('frozen')) return 'Frozen';
    if (c.includes('pantry') || c.includes('grain') || c.includes('oil') || c.includes('can')) return 'Pantry';
  }

  const name = (ingredientName || '').toLowerCase().trim();
  if (!name) return 'Other';

  // 1. Bakery
  if (name.match(/\b(bread|sourdough|tortilla|tortillas|bun|buns|pita|bagel|bagels|croissant|croissants|roll|rolls|baguette|naan|english muffin)\b/)) {
    return 'Bakery';
  }

  // 2. Produce
  if (name.match(/\b(onion|garlic|tomato|tomatoes|potato|potatoes|carrot|carrots|spinach|avocado|avocados|lemon|lemons|lime|limes|cilantro|basil|parsley|thyme|rosemary|pepper|peppers|bell pepper|jalapeño|jalapeno|asparagus|broccoli|lettuce|cucumber|cucumbers|apple|apples|banana|bananas|berry|berries|strawberry|blueberry|ginger|mushroom|mushrooms|shallot|shallots|scallion|scallions|green onion|green onions|celery|zucchini|kale|cauliflower|cabbage|mint|dill|squash|corn|orange|oranges)\b/)) {
    return 'Produce';
  }

  // 3. Dairy
  if (name.match(/\b(milk|cream|heavy cream|sour cream|butter|cheese|egg|eggs|yogurt|parmesan|pecorino|cheddar|mozzarella|ricotta|feta|brie|gouda|cottage cheese|half and half)\b/)) {
    return 'Dairy';
  }

  // 4. Meat & Seafood
  if (name.match(/\b(beef|ground beef|chuck roast|chicken|chicken breast|chicken thigh|pork|pork chop|bacon|pancetta|guanciale|steak|ribeye|sirloin|salmon|fish|shrimp|turkey|sausage|lamb|tuna|cod|halibut|crab|lobster|tofu|tempeh)\b/)) {
    return 'Meat/Seafood';
  }

  // 5. Spices & Seasonings
  if (name.match(/\b(salt|kosher salt|sea salt|black pepper|white pepper|cumin|paprika|smoked paprika|chili powder|oregano|cinnamon|nutmeg|bay leaf|bay leaves|garlic powder|onion powder|red pepper flakes|cayenne|turmeric|cardamom|cloves|vanilla extract|curry powder)\b/)) {
    return 'Spices/Seasonings';
  }

  // 6. Frozen
  if (name.match(/\b(frozen|ice cream|puff pastry|phyllo dough|frozen peas|frozen corn|frozen berries)\b/)) {
    return 'Frozen';
  }

  // 7. Pantry & Baking
  if (name.match(/\b(flour|sugar|brown sugar|powdered sugar|rice|jasmine rice|pasta|spaghetti|penne|fettuccine|noodle|noodles|oil|olive oil|vegetable oil|canola oil|sesame oil|coconut oil|vinegar|balsamic|quinoa|chickpeas|beans|black beans|broth|beef broth|chicken broth|stock|tomato paste|canned tomatoes|canned|tahini|honey|maple syrup|soy sauce|tamari|mustard|mayo|mayonnaise|peanut butter|almond butter|oats|rolled oats|yeast|baking powder|baking soda|cornstarch)\b/)) {
    return 'Pantry';
  }

  return 'Other';
}
