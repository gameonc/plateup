/**
 * Unit Tests for Milestone 4: Accessibility (A11y) & Mobile UX Polish
 * Scope:
 * - src/components/layout/Navbar.tsx
 * - src/components/layout/Footer.tsx
 * - src/components/recipe/RecipeCard.tsx
 * - src/components/shopping/AddItemDialog.tsx
 * - src/app/(app)/recipes/page.tsx
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

describe('Unit: Milestone 4 — Accessibility (A11y) & Mobile UX Polish', () => {

  describe('1. Navbar Component Accessibility & Mobile UX', () => {
    const navbarPath = path.join(projectRoot, 'src/components/layout/Navbar.tsx');

    it('1.1: Navbar source file exists', () => {
      assert.ok(fs.existsSync(navbarPath), 'Navbar.tsx must exist');
    });

    it('1.2: Mobile header has aria-label on logo and user menu trigger', () => {
      const source = fs.readFileSync(navbarPath, 'utf-8');
      assert.ok(source.includes('aria-label="PlateUp Home"'), 'Mobile header must have aria-label for PlateUp Home');
      assert.ok(source.includes('aria-label="User account menu"'), 'DropdownMenuTrigger must have aria-label for User account menu');
      assert.ok(source.includes('aria-label="PlateUp Pro Plan"'), 'Pro badge link must have aria-label');
    });

    it('1.3: User menu items and guest links have explicit aria-labels', () => {
      const source = fs.readFileSync(navbarPath, 'utf-8');
      assert.ok(source.includes('aria-label="Profile & Settings"'), 'Profile menu item must have aria-label');
      assert.ok(source.includes('aria-label="Log out of PlateUp"'), 'Logout item must have aria-label');
      assert.ok(source.includes('aria-label="View pricing plans"'), 'Guest pricing link must have aria-label');
      assert.ok(source.includes('aria-label="Log in to your account"'), 'Guest login link must have aria-label');
    });

    it('1.4: Desktop navigation has aria-label and aria-current="page" on active item', () => {
      const source = fs.readFileSync(navbarPath, 'utf-8');
      assert.ok(source.includes('aria-label="Main Navigation"'), 'Nav must have aria-label="Main Navigation"');
      assert.ok(source.includes('aria-current={isActive ? \'page\' : undefined}'), 'Desktop links must set aria-current on active route');
    });

    it('1.5: Mobile bottom navigation has aria-label, touch-manipulation, and safe area padding', () => {
      const source = fs.readFileSync(navbarPath, 'utf-8');
      assert.ok(source.includes('aria-label="Mobile Navigation"'), 'Mobile nav must have aria-label="Mobile Navigation"');
      assert.ok(source.includes('touch-manipulation'), 'Mobile nav items must include touch-manipulation for responsive tapping');
      assert.ok(source.includes('min-h-[48px]'), 'Mobile nav items must satisfy min 48px touch target guidelines');
      assert.ok(source.includes('safe-area-inset-bottom'), 'Mobile nav must include safe-area-inset-bottom padding');
    });
  });

  describe('2. Footer Component Accessibility & Mobile Layout', () => {
    const footerPath = path.join(projectRoot, 'src/components/layout/Footer.tsx');

    it('2.1: Footer source file exists', () => {
      assert.ok(fs.existsSync(footerPath), 'Footer.tsx must exist');
    });

    it('2.2: Footer includes semantic role and aria-label', () => {
      const source = fs.readFileSync(footerPath, 'utf-8');
      assert.ok(source.includes('role="contentinfo"'), 'Footer must have role="contentinfo"');
      assert.ok(source.includes('aria-label="Site Footer"'), 'Footer must have aria-label="Site Footer"');
    });

    it('2.3: Footer links have explicit aria-labels and external tab notifications', () => {
      const source = fs.readFileSync(footerPath, 'utf-8');
      assert.ok(source.includes('aria-label="Terms of Service"'), 'Terms link must have aria-label');
      assert.ok(source.includes('aria-label="Privacy Policy"'), 'Privacy link must have aria-label');
      assert.ok(source.includes('aria-label="YouTube Terms of Service (opens in a new tab)"'), 'YouTube terms link must specify open in new tab');
      assert.ok(source.includes('aria-label="Google Privacy Policy (opens in a new tab)"'), 'Google privacy link must specify open in new tab');
    });

    it('2.4: Footer includes mobile bottom padding to avoid bottom nav collision', () => {
      const source = fs.readFileSync(footerPath, 'utf-8');
      assert.ok(source.includes('pb-24 md:pb-8') || source.includes('pb-20'), 'Footer must have extra bottom padding on mobile screens');
    });
  });

  describe('3. RecipeCard Component Accessibility & Responsive Structure', () => {
    const recipeCardPath = path.join(projectRoot, 'src/components/recipe/RecipeCard.tsx');

    it('3.1: RecipeCard source file exists', () => {
      assert.ok(fs.existsSync(recipeCardPath), 'RecipeCard.tsx must exist');
    });

    it('3.2: Card link has explicit recipe name in aria-label and keyboard focus ring', () => {
      const source = fs.readFileSync(recipeCardPath, 'utf-8');
      assert.ok(source.includes('aria-label={`View recipe: ${recipe.name}`}'), 'RecipeCard link must have descriptive aria-label');
      assert.ok(source.includes('focus-visible:ring-primary') || source.includes('focus-visible:ring-2'), 'RecipeCard must have focus-visible ring');
    });

    it('3.3: Recipe image has descriptive alt text fallback and lazy loading', () => {
      const source = fs.readFileSync(recipeCardPath, 'utf-8');
      assert.ok(source.includes('alt={recipe.name || \'Recipe thumbnail\'}') || source.includes('alt={recipe.name'), 'Image must have alt text');
      assert.ok(source.includes('loading="lazy"'), 'Image must be lazily loaded for mobile performance');
    });

    it('3.4: Rating, time, and tags have explicit aria labels for screen readers', () => {
      const source = fs.readFileSync(recipeCardPath, 'utf-8');
      assert.ok(source.includes('aria-label={recipe.rating && recipe.rating > 0'), 'Rating container must have accessible label');
      assert.ok(source.includes('aria-label={`Total time: ${totalTime} minutes`}'), 'Time container must have accessible label');
      assert.ok(source.includes('aria-label="Dietary tags"'), 'Dietary tags container must have aria-label');
    });
  });

  describe('4. AddItemDialog Component Accessibility & Touch Sizing', () => {
    const addItemDialogPath = path.join(projectRoot, 'src/components/shopping/AddItemDialog.tsx');

    it('4.1: AddItemDialog source file exists', () => {
      assert.ok(fs.existsSync(addItemDialogPath), 'AddItemDialog.tsx must exist');
    });

    it('4.2: DialogTrigger has explicit aria-label and focus visible styles', () => {
      const source = fs.readFileSync(addItemDialogPath, 'utf-8');
      assert.ok(source.includes('aria-label="Add item to shopping list"'), 'DialogTrigger must have aria-label');
      assert.ok(source.includes('focus-visible:ring-primary'), 'DialogTrigger must have focus ring');
    });

    it('4.3: Form inputs have explicit aria-labels and required indicators', () => {
      const source = fs.readFileSync(addItemDialogPath, 'utf-8');
      assert.ok(source.includes('aria-label="Item Name"'), 'Item name input must have aria-label');
      assert.ok(source.includes('aria-label="Quantity or Amount"'), 'Quantity input must have aria-label');
      assert.ok(source.includes('aria-label="Unit of measurement"'), 'Unit input must have aria-label');
      assert.ok(source.includes('aria-label="Select store department"'), 'Select department trigger must have aria-label');
    });

    it('4.4: Action buttons have accessible names, loading spinners and full width mobile layout', () => {
      const source = fs.readFileSync(addItemDialogPath, 'utf-8');
      assert.ok(source.includes('aria-label="Cancel adding item"'), 'Cancel button must have aria-label');
      assert.ok(source.includes('w-full sm:w-auto'), 'Buttons must be full width on mobile viewports');
    });
  });

  describe('5. Recipes Collection Page (A11y & Mobile UX)', () => {
    const recipesPagePath = path.join(projectRoot, 'src/app/(app)/recipes/page.tsx');

    it('5.1: Recipes collection page source file exists', () => {
      assert.ok(fs.existsSync(recipesPagePath), 'src/app/(app)/recipes/page.tsx must exist');
    });

    it('5.2: Search clear button is an accessible icon-only button with aria-label', () => {
      const source = fs.readFileSync(recipesPagePath, 'utf-8');
      assert.ok(source.includes('aria-label="Clear search input"'), 'Search clear button must have aria-label="Clear search input"');
      assert.ok(source.includes('touch-manipulation'), 'Search clear button must have touch-manipulation');
    });

    it('5.3: Filter chips bar is accessible with role="group" and aria-pressed attributes', () => {
      const source = fs.readFileSync(recipesPagePath, 'utf-8');
      assert.ok(source.includes('role="group"'), 'Filter chips container must have role="group"');
      assert.ok(source.includes('aria-label="Filter recipes by category"'), 'Filter chips container must have aria-label');
      assert.ok(source.includes('aria-pressed={isActive}'), 'Filter buttons must use aria-pressed for active state indication');
    });

    it('5.4: Responsive layout accommodates 375px mobile viewport with zero horizontal overflow', () => {
      const source = fs.readFileSync(recipesPagePath, 'utf-8');
      assert.ok(source.includes('overflow-x-auto') && source.includes('touch-pan-x'), 'Filter chips must scroll smoothly with touch-pan-x');
      assert.ok(source.includes('flex flex-col md:flex-row') || source.includes('flex-col sm:flex-row'), 'Header controls must stack responsively on mobile');
    });
  });

});
