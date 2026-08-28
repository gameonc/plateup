/**
 * Unit Tests: Affiliate Shopping Link Generation & Keyword Sanitization
 * Specification: ORIGINAL_REQUEST.md §R1 & PROJECT.md F-41
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  cleanIngredientForSearch,
  buildAmazonFreshUrl,
  buildInstacartUrl,
  AFFILIATE_DISCLOSURE_TEXT,
  AMAZON_FRESH_DEFAULT_TAG,
  INSTACART_DEFAULT_TAG,
} from './helpers/monetization-helpers.ts';

describe('Unit: Affiliate Shopping Integration & Sanitization', () => {
  describe('1. cleanIngredientForSearch', () => {
    it('1.1: Removes unit measurements and standard numbers (e.g. "2 cups yellow onions" -> "yellow onions")', () => {
      assert.strictEqual(cleanIngredientForSearch('2 cups yellow onions'), 'yellow onions');
      assert.strictEqual(cleanIngredientForSearch('1 lb ground beef'), 'ground beef');
      assert.strictEqual(cleanIngredientForSearch('3 tablespoons olive oil'), 'olive oil');
      assert.strictEqual(cleanIngredientForSearch('500g spaghetti'), 'spaghetti');
      assert.strictEqual(cleanIngredientForSearch('4 cloves garlic'), 'garlic');
    });

    it('1.2: Removes mixed, simple, and unicode fractions', () => {
      assert.strictEqual(cleanIngredientForSearch('1 1/2 cups whole milk'), 'whole milk');
      assert.strictEqual(cleanIngredientForSearch('1/2 tsp kosher salt'), 'kosher salt');
      assert.strictEqual(cleanIngredientForSearch('¾ cup all purpose flour'), 'all purpose flour');
      assert.strictEqual(cleanIngredientForSearch('⅓ cup grated parmesan'), 'parmesan');
      assert.strictEqual(cleanIngredientForSearch('2 ½ tbsp butter'), 'butter');
    });

    it('1.3: Strips preparation verbs and culinary descriptors', () => {
      assert.strictEqual(cleanIngredientForSearch('freshly grated Pecorino Romano cheese'), 'Pecorino Romano cheese');
      assert.strictEqual(cleanIngredientForSearch('boneless skinless chicken breasts, diced'), 'chicken breasts');
      assert.strictEqual(cleanIngredientForSearch('carrots, peeled and finely chopped'), 'carrots');
      assert.strictEqual(cleanIngredientForSearch('melted unsalted butter'), 'unsalted butter');
      assert.strictEqual(cleanIngredientForSearch('toasted sesame seeds, optional'), 'sesame seeds');
    });

    it('1.4: Strips parenthetical notes and modifiers (e.g. "(about 2 cups)", "(divided)")', () => {
      assert.strictEqual(cleanIngredientForSearch('heavy cream (about 1 cup)'), 'heavy cream');
      assert.strictEqual(cleanIngredientForSearch('olive oil (divided)'), 'olive oil');
      assert.strictEqual(cleanIngredientForSearch('salmon fillets (skin removed, cut into portions)'), 'salmon fillets');
    });

    it('1.5: Handles empty, whitespace, and non-string inputs gracefully', () => {
      assert.strictEqual(cleanIngredientForSearch(''), '');
      assert.strictEqual(cleanIngredientForSearch('   '), '');
      assert.strictEqual(cleanIngredientForSearch(null as unknown as string), '');
      assert.strictEqual(cleanIngredientForSearch(undefined as unknown as string), '');
    });

    it('1.6: Cleans multi-ingredient list items with punctuation and redundant spacing', () => {
      const input = '1 1/2 lbs. fresh, wild-caught Alaskan salmon fillets - skinless & boneless (to taste)';
      const cleaned = cleanIngredientForSearch(input);
      assert.ok(cleaned.includes('salmon fillets') || cleaned.includes('Alaskan salmon'));
      assert.ok(!cleaned.includes('1 1/2'));
      assert.ok(!cleaned.includes('lbs'));
      assert.ok(!cleaned.includes('skinless'));
    });
  });

  describe('2. buildAmazonFreshUrl', () => {
    it('2.1: Constructs valid Amazon Fresh URL with default affiliate tag and search query', () => {
      const ingredients = ['2 cups yellow onions', '1 lb ground beef'];
      const url = buildAmazonFreshUrl(ingredients);

      assert.ok(url.startsWith('https://www.amazon.com/s?'));
      assert.ok(url.includes('i=amazonfresh'));
      assert.ok(url.includes(`tag=${AMAZON_FRESH_DEFAULT_TAG}`));
      assert.ok(url.includes('k='));
      assert.ok(url.includes('onions') || url.includes('yellow%20onions'));
    });

    it('2.2: Accepts custom affiliate tag parameter', () => {
      const customTag = 'custompartner-20';
      const url = buildAmazonFreshUrl(['spaghetti', 'eggs'], customTag);
      assert.ok(url.includes(`tag=${customTag}`));
    });

    it('2.3: Handles object array with item or name properties', () => {
      const ingredients = [
        { item: '1 cup heavy cream', category: 'dairy' },
        { name: '4 cloves minced garlic', category: 'produce' },
      ];
      const url = buildAmazonFreshUrl(ingredients);
      assert.ok(url.includes('i=amazonfresh'));
      assert.ok(url.includes('heavy%20cream') || url.includes('cream'));
      assert.ok(url.includes('garlic'));
    });

    it('2.4: Returns Amazon Fresh storefront URL when ingredient list is empty', () => {
      const emptyUrl = buildAmazonFreshUrl([]);
      assert.ok(emptyUrl.includes('amazon.com'));
      assert.ok(emptyUrl.includes('tag=plateup-20'));
      assert.ok(emptyUrl.includes('amazonfresh') || emptyUrl.includes('QW1hem9uIEZyZXNo'));
    });

    it('2.5: Properly encodes special characters and spaces in search terms', () => {
      const url = buildAmazonFreshUrl(['half & half milk', 'jalapeño peppers']);
      assert.ok(!url.includes(' ')); // No raw unencoded spaces
      assert.ok(url.includes('tag='));
    });
  });

  describe('3. buildInstacartUrl', () => {
    it('3.1: Constructs valid Instacart search URL with partner tag and sanitized query', () => {
      const ingredients = ['2 heads broccoli', '1 block cheddar cheese'];
      const url = buildInstacartUrl(ingredients);

      assert.ok(url.startsWith('https://www.instacart.com/store/search?'));
      assert.ok(url.includes('q='));
      assert.ok(url.includes(`partner_tag=${INSTACART_DEFAULT_TAG}`));
      assert.ok(url.includes('broccoli'));
      assert.ok(url.includes('cheddar%20cheese') || url.includes('cheese'));
    });

    it('3.2: Accepts custom partner tag override', () => {
      const customPartner = 'my_partner_id';
      const url = buildInstacartUrl(['avocados', 'lime'], customPartner);
      assert.ok(url.includes(`partner_tag=${customPartner}`));
    });

    it('3.3: Handles object array inputs with item/name fields', () => {
      const ingredients = [
        { item: '1 lb fresh salmon fillets' },
        { name: '2 tbsp extra virgin olive oil' },
      ];
      const url = buildInstacartUrl(ingredients);
      assert.ok(url.includes('salmon'));
      assert.ok(url.includes('olive%20oil') || url.includes('oil'));
    });

    it('3.4: Returns Instacart landing page when ingredient list is empty', () => {
      const emptyUrl = buildInstacartUrl([]);
      assert.ok(emptyUrl.startsWith('https://www.instacart.com/'));
      assert.ok(emptyUrl.includes('partner_tag='));
    });
  });

  describe('4. Disclosure Text & FTC Compliance', () => {
    it('4.1: AFFILIATE_DISCLOSURE_TEXT is a non-empty string', () => {
      assert.strictEqual(typeof AFFILIATE_DISCLOSURE_TEXT, 'string');
      assert.ok(AFFILIATE_DISCLOSURE_TEXT.length > 20);
    });

    it('4.2: Disclosure contains clear affiliate partnership and commission transparency', () => {
      const text = AFFILIATE_DISCLOSURE_TEXT.toLowerCase();
      assert.ok(text.includes('affiliate'), 'Must mention affiliate');
      assert.ok(text.includes('commission'), 'Must disclose commission');
      assert.ok(text.includes('no extra cost') || text.includes('free'), 'Must clarify no extra cost to user');
    });
  });
});
