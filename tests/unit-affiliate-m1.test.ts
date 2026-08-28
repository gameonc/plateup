import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  cleanIngredientForSearch,
  extractCleanIngredientNames,
  buildAmazonFreshUrl,
  buildInstacartUrl,
  AFFILIATE_DISCLOSURE_TEXT,
  AFFILIATE_PARTNERS,
  getAffiliateLinks,
} from '../src/lib/affiliate.ts';

describe('Milestone 1: Affiliate Shopping Integration Unit Test Suite', () => {
  describe('1. cleanIngredientForSearch', () => {
    it('1.1: Handles empty, null, undefined, and non-string inputs safely', () => {
      // @ts-expect-error testing runtime safety
      assert.strictEqual(cleanIngredientForSearch(null), '');
      // @ts-expect-error testing runtime safety
      assert.strictEqual(cleanIngredientForSearch(undefined), '');
      assert.strictEqual(cleanIngredientForSearch(''), '');
      assert.strictEqual(cleanIngredientForSearch('   '), '');
      // @ts-expect-error testing runtime safety
      assert.strictEqual(cleanIngredientForSearch(12345), '');
    });

    it('1.2: Strips leading quantities, vulgar fractions, and mixed fractions', () => {
      assert.strictEqual(cleanIngredientForSearch('2 chicken breasts'), 'chicken breasts');
      assert.strictEqual(cleanIngredientForSearch('1 1/2 cups flour'), 'flour');
      assert.strictEqual(cleanIngredientForSearch('½ tsp cinnamon'), 'cinnamon');
      assert.strictEqual(cleanIngredientForSearch('¾ cup sugar'), 'sugar');
      assert.strictEqual(cleanIngredientForSearch('2-3 carrots'), 'carrots');
      assert.strictEqual(cleanIngredientForSearch('0.5 lb ground turkey'), 'ground turkey');
    });

    it('1.3: Strips measurement units (volume, weight, containers, counts)', () => {
      assert.strictEqual(cleanIngredientForSearch('3 tbsp olive oil'), 'olive oil');
      assert.strictEqual(cleanIngredientForSearch('2 teaspoons vanilla extract'), 'vanilla extract');
      assert.strictEqual(cleanIngredientForSearch('16 oz pasta'), 'pasta');
      assert.strictEqual(cleanIngredientForSearch('2 lbs russet potatoes'), 'russet potatoes');
      assert.strictEqual(cleanIngredientForSearch('4 cloves garlic'), 'garlic');
      assert.strictEqual(cleanIngredientForSearch('1 can tomatoes'), 'tomatoes');
      assert.strictEqual(cleanIngredientForSearch('2 packages cream cheese'), 'cream cheese');
      assert.strictEqual(cleanIngredientForSearch('1 bunch cilantro'), 'cilantro');
      assert.strictEqual(cleanIngredientForSearch('1 head broccoli'), 'broccoli');
      assert.strictEqual(cleanIngredientForSearch('1 pinch sea salt'), 'sea salt');
    });

    it('1.4: Strips preparation techniques and state adjectives', () => {
      assert.strictEqual(cleanIngredientForSearch('2 cups chopped onions'), 'onions');
      assert.strictEqual(cleanIngredientForSearch('3 cloves minced garlic'), 'garlic');
      assert.strictEqual(cleanIngredientForSearch('1 cup diced bell peppers'), 'bell peppers');
      assert.strictEqual(cleanIngredientForSearch('1/2 cup grated parmesan cheese'), 'parmesan cheese');
      assert.strictEqual(cleanIngredientForSearch('1 lb boneless skinless chicken breasts'), 'chicken breasts');
      assert.strictEqual(cleanIngredientForSearch('2 cups fresh spinach'), 'spinach');
      assert.strictEqual(cleanIngredientForSearch('1 bag frozen peas'), 'peas');
      assert.strictEqual(cleanIngredientForSearch('2 tbsp melted butter'), 'butter');
      assert.strictEqual(cleanIngredientForSearch('1 cup crushed tomatoes'), 'tomatoes');
    });

    it('1.5: Strips parenthetical specifications and comma clauses', () => {
      assert.strictEqual(cleanIngredientForSearch('2 (14.5 oz) cans black beans'), 'black beans');
      assert.strictEqual(cleanIngredientForSearch('1 tsp kosher salt, to taste'), 'kosher salt');
      assert.strictEqual(cleanIngredientForSearch('2 tbsp olive oil (divided)'), 'olive oil');
      assert.strictEqual(cleanIngredientForSearch('1/4 cup parsley, finely chopped'), 'parsley');
    });

    it('1.6: Preserves clean single ingredient names without changes', () => {
      assert.strictEqual(cleanIngredientForSearch('Eggs'), 'Eggs');
      assert.strictEqual(cleanIngredientForSearch('Milk'), 'Milk');
      assert.strictEqual(cleanIngredientForSearch('Sourdough Bread'), 'Sourdough Bread');
    });
  });

  describe('2. extractCleanIngredientNames', () => {
    it('2.1: Extracts and cleans string arrays', () => {
      const input = [
        '2 lbs chicken breast, cubed',
        '1/2 cup olive oil',
        '3 cloves minced garlic',
        '1 tsp salt, to taste',
        '1/2 tsp black pepper',
        '1 cup white rice',
      ];
      const result = extractCleanIngredientNames(input, 5);
      assert.strictEqual(result.length, 5);
      assert.deepStrictEqual(result, ['chicken breast', 'olive oil', 'garlic', 'salt', 'black pepper']);
    });

    it('2.2: Extracts and cleans object arrays ({ item } and { name })', () => {
      const input = [
        { item: '2 cups almond milk', amount: '2', unit: 'cups' },
        { name: '1 tbsp chia seeds', amount: '1', unit: 'tbsp' },
        { item: '1 cup frozen blueberries', amount: '1', unit: 'cup' },
      ];
      const result = extractCleanIngredientNames(input);
      assert.strictEqual(result.length, 3);
      assert.deepStrictEqual(result, ['almond milk', 'chia seeds', 'blueberries']);
    });

    it('2.3: Deduplicates identical cleaned names while preserving order', () => {
      const input = [
        '1 cup diced onions',
        '2 tbsp chopped onions',
        '1 clove garlic',
        '3 cloves garlic',
      ];
      const result = extractCleanIngredientNames(input);
      assert.deepStrictEqual(result, ['onions', 'garlic']);
    });

    it('2.4: Safely handles empty arrays and invalid input', () => {
      // @ts-expect-error testing runtime safety
      assert.deepStrictEqual(extractCleanIngredientNames(null), []);
      // @ts-expect-error testing runtime safety
      assert.deepStrictEqual(extractCleanIngredientNames(undefined), []);
      assert.deepStrictEqual(extractCleanIngredientNames([]), []);
    });
  });

  describe('3. buildAmazonFreshUrl', () => {
    it('3.1: Builds standard Amazon Fresh search URL with default affiliate tag', () => {
      const ingredients = ['2 lbs chicken breast', '1 cup jasmine rice', '1 head broccoli'];
      const url = buildAmazonFreshUrl(ingredients);

      assert.ok(url.startsWith('https://www.amazon.com/s?'));
      assert.ok(url.includes('i=amazonfresh'));
      assert.ok(url.includes('tag=plateup-20'));
      assert.ok(url.includes('k=chicken%20breast%20jasmine%20rice%20broccoli'));
    });

    it('3.2: Respects custom affiliate tag argument', () => {
      const ingredients = ['1 gallon whole milk'];
      const url = buildAmazonFreshUrl(ingredients, 'custom-tag-21');
      assert.ok(url.includes('tag=custom-tag-21'));
    });

    it('3.3: Falls back to store category when ingredient list is empty', () => {
      const url = buildAmazonFreshUrl([]);
      assert.ok(url.includes('amazon.com'));
      assert.ok(url.includes('tag=plateup-20'));
      assert.ok(url.includes('QW1hem9uIEZyZXNo'));
    });

    it('3.4: Limits search query to top 5 primary ingredients to maintain optimal query length', () => {
      const ingredients = [
        'apple',
        'banana',
        'cherry',
        'date',
        'elderberry',
        'fig',
        'grape',
      ];
      const url = buildAmazonFreshUrl(ingredients);
      assert.ok(url.includes('k=apple%20banana%20cherry%20date%20elderberry'));
      assert.ok(!url.includes('fig'));
      assert.ok(!url.includes('grape'));
    });
  });

  describe('4. buildInstacartUrl', () => {
    it('4.1: Builds standard Instacart search URL with affiliate parameters', () => {
      const ingredients = ['1 lb ground beef', '1 box spaghetti', '1 jar marinara sauce'];
      const url = buildInstacartUrl(ingredients);

      assert.ok(url.startsWith('https://www.instacart.com/store/search?'));
      assert.ok(url.includes('partner_tag=plateup_app'));
      assert.ok(url.includes('q=ground%20beef%20spaghetti%20marinara%20sauce'));
    });

    it('4.2: Respects custom partner tag argument', () => {
      const ingredients = ['1 loaf sourdough bread'];
      const url = buildInstacartUrl(ingredients, 'my-partner-id');
      assert.ok(url.includes('partner_tag=my-partner-id'));
    });

    it('4.3: Falls back to Instacart landing page when ingredient list is empty', () => {
      const url = buildInstacartUrl([]);
      assert.ok(url.startsWith('https://www.instacart.com/'));
      assert.ok(url.includes('partner_tag=plateup_app'));
    });
  });

  describe('5. Affiliate Disclosures & Metadata', () => {
    it('5.1: AFFILIATE_DISCLOSURE_TEXT contains mandatory transparency wording', () => {
      assert.ok(typeof AFFILIATE_DISCLOSURE_TEXT === 'string');
      assert.ok(AFFILIATE_DISCLOSURE_TEXT.length > 20);
      assert.ok(AFFILIATE_DISCLOSURE_TEXT.toLowerCase().includes('commission'));
      assert.ok(AFFILIATE_DISCLOSURE_TEXT.toLowerCase().includes('no extra cost') || AFFILIATE_DISCLOSURE_TEXT.toLowerCase().includes('no additional cost'));
    });

    it('5.2: AFFILIATE_PARTNERS defines Amazon Fresh and Instacart with valid buildUrl methods', () => {
      assert.strictEqual(AFFILIATE_PARTNERS.length, 2);
      
      const amazon = AFFILIATE_PARTNERS.find((p) => p.id === 'amazon-fresh');
      const instacart = AFFILIATE_PARTNERS.find((p) => p.id === 'instacart');

      assert.ok(amazon);
      assert.strictEqual(amazon.name, 'Amazon Fresh');
      assert.ok(amazon.buildUrl(['apple']).includes('amazonfresh'));

      assert.ok(instacart);
      assert.strictEqual(instacart.name, 'Instacart');
      assert.ok(instacart.buildUrl(['apple']).includes('instacart.com'));
    });

    it('5.3: getAffiliateLinks returns bundled urls and clean ingredient names', () => {
      const sample = ['2 cups diced potatoes', '1 lb carrots'];
      const bundle = getAffiliateLinks(sample);

      assert.ok(bundle.amazonFreshUrl.includes('amazonfresh'));
      assert.ok(bundle.instacartUrl.includes('instacart.com'));
      assert.deepStrictEqual(bundle.cleanIngredients, ['potatoes', 'carrots']);
    });
  });
});
