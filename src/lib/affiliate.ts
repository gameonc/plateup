/**
 * Affiliate Shopping Integration Engine (Milestone 1 / Feature F-41)
 *
 * Generates partner grocery search URLs (Amazon Fresh, Instacart) with clean ingredient
 * queries and referral affiliate parameters, along with FTC-compliant disclosure text.
 */

export const AFFILIATE_DISCLOSURE_TEXT =
  'Disclosure: As an affiliate partner, PlateUp may earn a small referral commission on grocery orders placed through these links at no extra cost to you.';

export const AMAZON_FRESH_DEFAULT_TAG = 'plateup-20';
export const INSTACART_DEFAULT_TAG = 'plateup_app';

export type IngredientSearchItem = { item?: string; name?: string } | string | null | undefined;

export interface AffiliatePartner {
  id: 'amazon-fresh' | 'instacart';
  name: string;
  tagline: string;
  description: string;
  badge: string;
  buildUrl: (ingredients: IngredientSearchItem[]) => string;
}

const PREPARATION_WORDS = [
  'diced', 'chopped', 'minced', 'sliced', 'julienned', 'grated', 'shredded', 'crushed',
  'peeled', 'seeded', 'melted', 'softened', 'toasted', 'roasted', 'cubed', 'cubes', 'halved',
  'quartered', 'sifted', 'whisked', 'beaten', 'drained', 'rinsed', 'packed', 'finely',
  'coarsely', 'roughly', 'thinly', 'fresh', 'freshly', 'dried', 'cooked',
  'uncooked', 'divided', 'optional', 'to taste', 'plus more', 'room temperature',
  'warm', 'cold', 'hot', 'chilled', 'frozen', 'canned', 'skinless', 'boneless',
  'skin removed', 'trimmed', 'soft', 'hard', 'large', 'medium', 'small', 'extra large',
  'seasoned', 'lightly', 'coarse', 'cracked', 'sustainably', 'wild-caught', 'serving',
  'portions', 'pieces', 'inch'
];

const UNIT_WORDS = [
  'cups?', 'tablespoons?', 'tbsp', 'tbs', 'teaspoons?', 'tsp', 'ounces?', 'oz',
  'fluid ounces?', 'fl oz', 'pounds?', 'lbs?', 'lb', 'grams?', 'g', 'kilograms?',
  'kg', 'milliliters?', 'ml', 'liters?', 'l', 'quarts?', 'qt', 'pints?', 'pt',
  'gallons?', 'gal', 'pinches?', 'pinch', 'dashes?', 'dash', 'cloves?', 'heads?',
  'bunches?', 'bunch', 'sprigs?', 'cans?', 'bottles?', 'packages?', 'pkg', 'slices?',
  'pieces?', 'stalks?', 'sticks?', 'boxes?', 'box', 'bags?', 'bag', 'jars?', 'jar', 'items?', 'item'
];

const STOP_WORDS = [
  'and', 'or', 'with', 'of', 'for', 'to', 'into', 'at', 'plus', 'extra', 'about', 'as'
];

/**
 * Strips measurements, units, preparation instructions, and vulgar/ASCII fractions
 * from a raw ingredient string to yield a clean grocery store search term.
 *
 * @example
 * cleanIngredientForSearch("2 lbs boneless skinless chicken breasts, diced") => "chicken breasts"
 * cleanIngredientForSearch("1/2 cup extra virgin olive oil") => "extra virgin olive oil"
 * cleanIngredientForSearch("3 cloves garlic, finely minced") => "garlic"
 */
export function cleanIngredientForSearch(raw: string): string {
  if (!raw || typeof raw !== 'string') {
    return '';
  }

  let cleaned = raw.trim();

  // 1. Remove parenthetical instructions e.g. "(about 2 cups)", "(optional)"
  cleaned = cleaned.replace(/\([^)]*\)/g, ' ');

  // 2. Remove numeric fractions (1/2, 3/4, 1 1/2) and decimals/integers with attached units (e.g. 100g, 200ml)
  cleaned = cleaned.replace(/\b\d+\s+\d+\/\d+\b/g, ' ');
  cleaned = cleaned.replace(/\b\d+\/\d+\b/g, ' ');
  cleaned = cleaned.replace(/[\u00BC-\u00BE\u2150-\u215E]/g, ' '); // Vulgar unicode fractions
  cleaned = cleaned.replace(/\b\d+(\.\d+)?[a-zA-Z]*\b/g, ' ');

  // 3. Remove standalone unit words
  const unitRegex = new RegExp(`\\b(${UNIT_WORDS.join('|')})\\b`, 'gi');
  cleaned = cleaned.replace(unitRegex, ' ');

  // 4. Remove preparation and descriptor words
  const prepRegex = new RegExp(`\\b(${PREPARATION_WORDS.join('|')})\\b`, 'gi');
  cleaned = cleaned.replace(prepRegex, ' ');

  // 5. Remove connector and stop words
  const stopRegex = new RegExp(`\\b(${STOP_WORDS.join('|')})\\b`, 'gi');
  cleaned = cleaned.replace(stopRegex, ' ');

  // 6. Remove punctuation, extra symbols, and redundant commas
  cleaned = cleaned.replace(/[,\-_/*+~;:!@#$%^&()=[\]{}|\\<>?.]/g, ' ');

  // 7. Normalize multiple spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Fallback if over-stripped
  if (!cleaned) {
    cleaned = raw.replace(/[,\-_/*+~;:!@#$%^&()=[\]{}|\\<>?.]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  return cleaned;
}

/**
 * Extracts and sanitizes an array of ingredient names from either object or string arrays.
 */
export function extractCleanIngredientNames(
  ingredients: IngredientSearchItem[],
  maxItems = 5
): string[] {
  if (!Array.isArray(ingredients)) {
    return [];
  }

  const items: string[] = [];
  for (const entry of ingredients) {
    if (!entry) continue;
    const rawName = typeof entry === 'string' ? entry : (entry.item || entry.name || '');
    const clean = cleanIngredientForSearch(rawName);
    if (clean) {
      items.push(clean);
    }
  }

  // Deduplicate while preserving order
  const uniqueItems = Array.from(new Set(items));
  return uniqueItems.slice(0, maxItems);
}

/**
 * Generates an Amazon Fresh search URL with sanitized ingredient search terms and referral tag.
 *
 * @param ingredients List of ingredients (objects or strings)
 * @param affiliateTag Amazon Associate tag (defaults to env or 'plateup-20')
 */
export function buildAmazonFreshUrl(
  ingredients: IngredientSearchItem[],
  affiliateTag: string = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || AMAZON_FRESH_DEFAULT_TAG
): string {
  const items = extractCleanIngredientNames(ingredients, 5);
  const tag = encodeURIComponent(affiliateTag || AMAZON_FRESH_DEFAULT_TAG);

  if (items.length === 0) {
    return `https://www.amazon.com/alm/category?almBrandId=QW1hem9uIEZyZXNo&tag=${tag}`;
  }

  const query = encodeURIComponent(items.join(' '));
  return `https://www.amazon.com/s?k=${query}&i=amazonfresh&tag=${tag}`;
}

/**
 * Generates an Instacart search URL with sanitized ingredient search terms and referral partner tag.
 *
 * @param ingredients List of ingredients (objects or strings)
 * @param partnerTag Instacart partner ID (defaults to env or 'plateup_app')
 */
export function buildInstacartUrl(
  ingredients: IngredientSearchItem[],
  partnerTag: string = process.env.NEXT_PUBLIC_INSTACART_AFFILIATE_ID || INSTACART_DEFAULT_TAG
): string {
  const items = extractCleanIngredientNames(ingredients, 5);
  const tag = encodeURIComponent(partnerTag || INSTACART_DEFAULT_TAG);

  if (items.length === 0) {
    return `https://www.instacart.com/?partner_tag=${tag}`;
  }

  const query = encodeURIComponent(items.join(' '));
  return `https://www.instacart.com/store/search?q=${query}&partner_tag=${tag}`;
}

/**
 * Pre-configured affiliate partner definitions.
 */
export const AFFILIATE_PARTNERS: AffiliatePartner[] = [
  {
    id: 'amazon-fresh',
    name: 'Amazon Fresh',
    tagline: 'Same-day grocery delivery',
    description: 'Order fresh ingredients directly from Amazon Fresh with Prime delivery.',
    badge: 'Amazon Fresh',
    buildUrl: (ingredients) => buildAmazonFreshUrl(ingredients),
  },
  {
    id: 'instacart',
    name: 'Instacart',
    tagline: 'Local supermarket delivery',
    description: 'Shop your local grocery stores and get ingredients delivered in as fast as an hour.',
    badge: 'Instacart',
    buildUrl: (ingredients) => buildInstacartUrl(ingredients),
  },
];

/**
 * Helper to get all affiliate links for a given set of ingredients.
 */
export function getAffiliateLinks(
  ingredients: IngredientSearchItem[]
): { amazonFreshUrl: string; instacartUrl: string; cleanIngredients: string[] } {
  return {
    amazonFreshUrl: buildAmazonFreshUrl(ingredients),
    instacartUrl: buildInstacartUrl(ingredients),
    cleanIngredients: extractCleanIngredientNames(ingredients, 5),
  };
}
