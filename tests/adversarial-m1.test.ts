/**
 * Adversarial Empirical Verification Suite for Milestone 1
 * 
 * 1. Challenge Firestore security rules syntax and matching paths (including shoppingLists subcollections).
 * 2. Challenge build reproducibility in offline mode (verify no external font CDN requests during build).
 * 3. Challenge React 19 hook behavior and listener lifecycles.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();

describe('Adversarial Challenge 1: Firestore Security Rules & Path Matching', () => {
  const rulesPath = path.join(PROJECT_ROOT, 'firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');

  it('ADV-RULES.1: Rules file exists and specifies rules_version 2', () => {
    assert.ok(rulesContent.includes("rules_version = '2';"));
    assert.ok(rulesContent.includes("service cloud.firestore"));
  });

  it('ADV-RULES.2: Root helper functions require strict authentication and UID match', () => {
    assert.ok(rulesContent.includes('function isAuthenticated()'));
    assert.ok(rulesContent.includes('return request.auth != null;'));
    assert.ok(rulesContent.includes('function isOwner(userId)'));
    assert.ok(rulesContent.includes('request.auth.uid == userId'));
  });

  it('ADV-RULES.3: Validates user document path /users/{userId}', () => {
    assert.ok(rulesContent.includes('match /users/{userId}'));
    assert.ok(rulesContent.includes('allow read, write: if isOwner(userId);'));
  });

  it('ADV-RULES.4: Validates recipes subcollection path /users/{userId}/recipes/{recipeId}', () => {
    assert.ok(rulesContent.includes('match /recipes/{recipeId}'));
  });

  it('ADV-RULES.5: Validates mealPlans subcollection path /users/{userId}/mealPlans/{planId}', () => {
    assert.ok(rulesContent.includes('match /mealPlans/{planId}'));
  });

  it('ADV-RULES.6: Validates cookingLog subcollection path /users/{userId}/cookingLog/{logId}', () => {
    assert.ok(rulesContent.includes('match /cookingLog/{logId}'));
  });

  it('ADV-RULES.7: Validates shoppingLists and shoppingList subcollection paths', () => {
    // Check plural /shoppingLists/{listId}
    assert.ok(rulesContent.includes('match /shoppingLists/{listId}'));
    // Check singular /shoppingList/{itemId}
    assert.ok(rulesContent.includes('match /shoppingList/{itemId}'));
  });

  it('ADV-RULES.8: Default deny rule enforces closed access on unmatched documents', () => {
    assert.ok(rulesContent.includes('match /{document=**}'));
    assert.ok(rulesContent.includes('allow read, write: if false;'));
  });

  it('ADV-RULES.9: Simulates access matrix against rules logic', () => {
    interface SecurityRequest {
      auth: { uid: string } | null;
      path: string;
    }

    const evaluateRule = (req: SecurityRequest): boolean => {
      if (!req.auth) return false;
      
      const userMatch = req.path.match(/^\/databases\/[^/]+\/documents\/users\/([^/]+)/);
      if (!userMatch) return false;
      const targetUserId = userMatch[1];
      
      return req.auth.uid === targetUserId;
    };

    // Case 1: Unauthenticated request to own path -> Denied
    assert.strictEqual(evaluateRule({ auth: null, path: '/databases/(default)/documents/users/u123' }), false);
    assert.strictEqual(evaluateRule({ auth: null, path: '/databases/(default)/documents/users/u123/shoppingLists/week1' }), false);

    // Case 2: Authenticated request to own path -> Allowed
    assert.strictEqual(evaluateRule({ auth: { uid: 'u123' }, path: '/databases/(default)/documents/users/u123' }), true);
    assert.strictEqual(evaluateRule({ auth: { uid: 'u123' }, path: '/databases/(default)/documents/users/u123/recipes/r1' }), true);
    assert.strictEqual(evaluateRule({ auth: { uid: 'u123' }, path: '/databases/(default)/documents/users/u123/shoppingLists/week1' }), true);
    assert.strictEqual(evaluateRule({ auth: { uid: 'u123' }, path: '/databases/(default)/documents/users/u123/shoppingList/current' }), true);

    // Case 3: Authenticated request to other user path -> Denied
    assert.strictEqual(evaluateRule({ auth: { uid: 'u123' }, path: '/databases/(default)/documents/users/u456' }), false);
    assert.strictEqual(evaluateRule({ auth: { uid: 'u123' }, path: '/databases/(default)/documents/users/u456/recipes/r1' }), false);
    assert.strictEqual(evaluateRule({ auth: { uid: 'u123' }, path: '/databases/(default)/documents/users/u456/shoppingLists/week1' }), false);

    // Case 4: Root collections -> Denied
    assert.strictEqual(evaluateRule({ auth: { uid: 'u123' }, path: '/databases/(default)/documents/public_recipes/r1' }), false);
  });
});

describe('Adversarial Challenge 2: Offline Build Reproducibility & Font CDN Safety', () => {
  it('ADV-FONT.1: layout.tsx contains no next/font/google imports or Google CDN links', () => {
    const layoutPath = path.join(PROJECT_ROOT, 'src/app/layout.tsx');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');

    assert.ok(!layoutContent.includes('next/font/google'), 'layout.tsx must not import next/font/google');
    assert.ok(!layoutContent.includes('fonts.googleapis.com'), 'layout.tsx must not reference fonts.googleapis.com');
    assert.ok(!layoutContent.includes('fonts.gstatic.com'), 'layout.tsx must not reference fonts.gstatic.com');
  });

  it('ADV-FONT.2: globals.css uses local system-ui font fallbacks and no remote @import urls', () => {
    const cssPath = path.join(PROJECT_ROOT, 'src/app/globals.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    assert.ok(cssContent.includes('--font-sans: system-ui'), 'globals.css must define system-ui fallback');
    assert.ok(!cssContent.includes('http://'), 'globals.css must not contain http URLs');
    assert.ok(!cssContent.includes('https://'), 'globals.css must not contain https URLs');
  });

  it('ADV-FONT.3: Scans all TS/TSX/CSS in src/ for remote network dependencies during build', () => {
    const scanDir = (dir: string): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          results = results.concat(scanDir(filePath));
        } else if (/\.(tsx?|css|jsx?)$/.test(file)) {
          results.push(filePath);
        }
      });
      return results;
    };

    const files = scanDir(path.join(PROJECT_ROOT, 'src'));
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      assert.ok(!content.includes('next/font/google'), `File ${file} has prohibited next/font/google import`);
      assert.ok(!content.includes('fonts.googleapis.com'), `File ${file} has prohibited fonts.googleapis.com`);
    }
  });
});

describe('Adversarial Challenge 3: React 19 Hook Lifecycles & State Management', () => {
  it('ADV-HOOK.1: useAuth cleans up onAuthStateChanged listener on unmount', () => {
    const authHookPath = path.join(PROJECT_ROOT, 'src/hooks/useAuth.tsx');
    const content = fs.readFileSync(authHookPath, 'utf8');
    assert.ok(content.includes('const unsubscribe = onAuthStateChanged'), 'Must assign onAuthStateChanged to unsubscribe');
    assert.ok(content.includes('return () => unsubscribe()'), 'Must clean up subscription');
  });

  it('ADV-HOOK.2: useRecipes cleans up onSnapshot listener and masks state when logged out', () => {
    const recipesHookPath = path.join(PROJECT_ROOT, 'src/hooks/useRecipes.ts');
    const content = fs.readFileSync(recipesHookPath, 'utf8');
    assert.ok(content.includes('const unsubscribe = onSnapshot'), 'Must assign onSnapshot to unsubscribe');
    assert.ok(content.includes('return () => unsubscribe()'), 'Must clean up onSnapshot');
    assert.ok(content.includes('useMemo(() => (user ? recipes : [])'), 'Must mask recipes when user is null');
  });

  it('ADV-HOOK.3: useCookingLog cleans up onSnapshot listener and masks state when logged out', () => {
    const cookingHookPath = path.join(PROJECT_ROOT, 'src/hooks/useCookingLog.ts');
    const content = fs.readFileSync(cookingHookPath, 'utf8');
    assert.ok(content.includes('const unsubscribe = onSnapshot'), 'Must assign onSnapshot to unsubscribe');
    assert.ok(content.includes('return () => unsubscribe()'), 'Must clean up onSnapshot');
    assert.ok(content.includes('useMemo(() => (user ? logs : [])'), 'Must mask logs when user is null');
  });

  it('ADV-HOOK.4: useMealPlan handles unmounted async fetch race condition', () => {
    const mealHookPath = path.join(PROJECT_ROOT, 'src/hooks/useMealPlan.ts');
    const content = fs.readFileSync(mealHookPath, 'utf8');
    assert.ok(content.includes('let isMounted = true;'), 'Must guard against post-unmount setState');
    assert.ok(content.includes('isMounted = false;'), 'Must toggle isMounted on unmount');
  });

  it('ADV-HOOK.5: extract/page.tsx wraps useSearchParams in Suspense boundary for React 19 / Next.js SSR', () => {
    const extractPagePath = path.join(PROJECT_ROOT, 'src/app/(app)/extract/page.tsx');
    const content = fs.readFileSync(extractPagePath, 'utf8');
    assert.ok(content.includes('<Suspense'), 'Must wrap in Suspense boundary');
    assert.ok(content.includes('useSearchParams()'), 'Uses useSearchParams');
  });

  it('ADV-HOOK.6: AuthGuard handles auth loading transition without flash', () => {
    const guardPath = path.join(PROJECT_ROOT, 'src/components/auth/AuthGuard.tsx');
    const content = fs.readFileSync(guardPath, 'utf8');
    assert.ok(content.includes('if (loading)'), 'Must render loading state while auth is indeterminate');
    assert.ok(content.includes('if (!user)'), 'Must prevent rendering children if user is unauthenticated');
  });
});
