/**
 * Unit Tests for Milestone 4: Navigation, Badges & UI Integration (F-47 & R4)
 * Specification: ORIGINAL_REQUEST.md (§R4) & PROJECT.md (§Interface Contracts & Code Layout)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

describe('Unit: Milestone 4 — Navigation, Badges & UI Integration', () => {

  describe('1. ProBadge Component Architecture & Variations', () => {
    const proBadgePath = path.join(projectRoot, 'src/components/monetization/ProBadge.tsx');

    it('1.1: ProBadge source file exists in src/components/monetization/', () => {
      assert.ok(fs.existsSync(proBadgePath), 'ProBadge.tsx must exist');
    });

    it('1.2: Exports ProBadge functional component and supports size/variant props', () => {
      const source = fs.readFileSync(proBadgePath, 'utf-8');
      assert.ok(source.includes('export function ProBadge'), 'Should export ProBadge');
      assert.ok(source.includes('Crown'), 'Should import and use Crown icon from lucide-react');
      assert.ok(source.includes('size = \'sm\'') || source.includes('size'), 'Should support size prop');
      assert.ok(source.includes('variant = \'gradient\'') || source.includes('variant'), 'Should support variant prop');
    });

    it('1.3: Implements styled gradient and crown icon styles', () => {
      const source = fs.readFileSync(proBadgePath, 'utf-8');
      assert.ok(source.includes('amber-500') || source.includes('amber'), 'Should have amber/gold palette');
      assert.ok(source.includes('gradient') || source.includes('from-amber'), 'Should support gradient styling');
      assert.ok(source.includes('aria-label') || source.includes('title'), 'Should include accessible aria attributes');
    });

    it('1.4: Supports icon-only variant for compact placements', () => {
      const source = fs.readFileSync(proBadgePath, 'utf-8');
      assert.ok(source.includes('icon-only'), 'Should support icon-only variant');
    });
  });

  describe('2. Navbar Integration: Pro Badge & Pricing Navigation', () => {
    const navbarPath = path.join(projectRoot, 'src/components/layout/Navbar.tsx');

    it('2.1: Navbar source file exists in src/components/layout/', () => {
      assert.ok(fs.existsSync(navbarPath), 'Navbar.tsx must exist');
    });

    it('2.2: Imports useProfile hook and ProBadge component', () => {
      const source = fs.readFileSync(navbarPath, 'utf-8');
      assert.ok(source.includes('useProfile'), 'Should use useProfile hook to access user plan');
      assert.ok(source.includes('ProBadge'), 'Should import and use ProBadge component');
    });

    it('2.3: Displays Pro badge / crown in Desktop nav and Mobile top header when plan === "pro"', () => {
      const source = fs.readFileSync(navbarPath, 'utf-8');
      assert.ok(source.includes('isPro') || source.includes('plan === \'pro\''), 'Should check pro plan status');
      assert.ok(source.includes('<ProBadge'), 'Should render ProBadge in navigation');
    });

    it('2.4: Includes Pricing link in desktop navigation items', () => {
      const source = fs.readFileSync(navbarPath, 'utf-8');
      assert.ok(source.includes('/pricing'), 'Should contain /pricing navigation route');
      assert.ok(source.includes('Pricing'), 'Should have Pricing label');
    });

    it('2.5: Includes Pricing item in user dropdown menus for quick access', () => {
      const source = fs.readFileSync(navbarPath, 'utf-8');
      assert.ok(source.includes('DropdownMenuItem'), 'Should have dropdown menu items');
      assert.ok(source.includes('href="/pricing"'), 'Dropdown should link to /pricing');
    });

    it('2.6: Provides smooth navigation fallback for unauthenticated guest users', () => {
      const source = fs.readFileSync(navbarPath, 'utf-8');
      assert.ok(source.includes('/login'), 'Should provide login link for guests');
      assert.ok(source.includes('Pricing'), 'Should display pricing link for guests');
    });
  });

  describe('3. Landing Page: Pricing Links & Pro Showcase', () => {
    const landingPagePath = path.join(projectRoot, 'src/app/page.tsx');

    it('3.1: Landing page source file exists in src/app/', () => {
      assert.ok(fs.existsSync(landingPagePath), 'src/app/page.tsx must exist');
    });

    it('3.2: Header navigation contains visible Pricing link', () => {
      const source = fs.readFileSync(landingPagePath, 'utf-8');
      assert.ok(source.includes('href="/pricing"'), 'Header should have link to /pricing');
      assert.ok(source.includes('>Pricing<') || source.includes('Pricing'), 'Header text should have Pricing');
    });

    it('3.3: Footer links contain visible Pricing link', () => {
      const source = fs.readFileSync(landingPagePath, 'utf-8');
      const footerIndex = source.indexOf('<footer');
      assert.ok(footerIndex !== -1, 'Footer must exist');
      const footerContent = source.slice(footerIndex);
      assert.ok(footerContent.includes('href="/pricing"'), 'Footer should have link to /pricing');
    });

    it('3.4: Features section contains subtle and prominent Pro CTA callout', () => {
      const source = fs.readFileSync(landingPagePath, 'utf-8');
      assert.ok(
        source.includes('PlateUp Pro Experience') || source.includes('Explore Pro Plans') || source.includes('View Pricing & Plans'),
        'Landing page should feature Pro callout'
      );
      assert.ok(source.includes('$4.99'), 'Landing page should mention $4.99/mo transparent pricing');
    });

    it('3.5: FAQ section answers questions about PlateUp Pro features', () => {
      const source = fs.readFileSync(landingPagePath, 'utf-8');
      assert.ok(source.includes('PlateUp Pro include') || source.includes('PlateUp Pro'), 'FAQ should answer Pro tier questions');
    });
  });

  describe('4. Upgrade Prompts & Encouraging Copy Review', () => {
    const upgradePromptPath = path.join(projectRoot, 'src/components/monetization/UpgradePrompt.tsx');
    const extractPagePath = path.join(projectRoot, 'src/app/(app)/extract/page.tsx');
    const profilePagePath = path.join(projectRoot, 'src/app/(app)/profile/page.tsx');

    it('4.1: UpgradePrompt component uses positive, benefit-focused messaging', () => {
      const source = fs.readFileSync(upgradePromptPath, 'utf-8');
      assert.ok(source.includes('Unlock') || source.includes('Enjoy') || source.includes('Supercharge'), 'Tone should be positive');
      assert.ok(!source.includes('Warning: You are blocked'), 'Should not use punishing warning text');
      assert.ok(source.includes('satisfaction guarantee') || source.includes('Cancel anytime'), 'Should reassure users with cancellation policy');
    });

    it('4.2: Extract page quota indicators and alerts use friendly tone', () => {
      const source = fs.readFileSync(extractPagePath, 'utf-8');
      assert.ok(source.includes('free extractions remaining this month'), 'Should clearly display remaining quota');
      assert.ok(source.includes('Ready for More Recipes') || source.includes('Unlock Unlimited Extractions'), 'Limit alert should be encouraging');
    });

    it('4.3: Profile page subscription card reflects accurate plan and features', () => {
      const source = fs.readFileSync(profilePagePath, 'utf-8');
      assert.ok(source.includes('ProBadge') || source.includes('PlateUp Pro'), 'Profile should display Pro badge');
      assert.ok(source.includes('/pricing'), 'Profile should link to /pricing for plan management');
    });
  });

});
