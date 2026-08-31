# Original User Request

## 2026-08-30T17:56:29Z

Perform a comprehensive QA audit of the PlateUp app — an AI-powered recipe extraction and smart meal planning web app built with Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Firebase (Auth + Firestore), Google Generative AI (Gemini), and Stripe. The app is deployed at https://plateup-two.vercel.app and the code is at /Users/CLD/.gemini/antigravity/scratch/plateup.

This is a pre-production audit. The app is about to launch to real users. Every bug matters.

## Audit Scope

### 1. Full User Journey Audit
Walk through every step a new user would take, from landing page to becoming a paying Pro subscriber. Check:
- Landing page → Sign Up → Dashboard (first-time experience)
- Extract recipe from YouTube URL (regular video AND Shorts URL)
- Extract recipe from photo upload (various image types: jpg, png, heic, webp)
- Save extracted recipe → appears in My Recipes collection
- Rate a recipe (1-5 stars) → rating persists on reload
- Mark recipe as 'I Made This' → cook count increments
- Delete a recipe → confirmation dialog → recipe removed
- Discover page → browse TheMealDB recipes → save one
- Meal Plan → add meal from My Recipes tab
- Meal Plan → add meal from Discover tab with cuisine filters
- Meal Plan → Auto-fill week
- Meal Plan → clear a slot, clear all
- Shopping List → generate from meal plan → check off items
- Shopping List → Order Ingredients button → affiliate links work
- Profile → set dietary preferences → filters work
- Profile → view subscription status
- Pricing page → Free vs Pro comparison → Go Pro button
- Servings adjuster on recipe detail → ingredients scale correctly
- Navigation: every link in navbar, footer, landing page
- Logout → redirect to landing page
- Login again → data persists

### 2. Edge Cases to Test
- Empty states: no recipes saved, no meal plan, empty shopping list, new user with nothing
- Invalid YouTube URL → proper error message
- Non-cooking YouTube video → graceful handling
- Uploading non-image file → proper error
- Very large image upload → handles gracefully
- Free user hitting 5 extraction limit → upgrade prompt shows
- Pro user → no limit, no upgrade prompts
- Servings adjuster: edge cases (1 serving, 20 servings, fractions like '1/2 cup')
- Mobile responsive: check all pages at 375px width
- Search on recipe collection with no matches
- Dietary filter with no matching recipes
- Meal plan navigation: next/previous week
- Double-clicking buttons (save, extract, rate) → no duplicate actions
- Network error handling on all API calls
- Auth state: accessing /dashboard without login → redirect to login
- Deep linking: /recipes/[id] with invalid ID → 404 or error handling

### 3. Code Quality Audit
- Run `npx tsc --noEmit` — zero errors
- Run `npm run build` — zero errors
- Run `npm test` — all tests pass
- Check for console.log statements that shouldn't be in production
- Check for hardcoded API keys or secrets in client-side code
- Check that GEMINI_API_KEY is NOT in any NEXT_PUBLIC_ variable
- Check that Firebase security rules are not wide open
- Check for unused imports, dead code
- Check all API routes have proper error handling
- Check Stripe webhook has signature verification

### 4. Accessibility & UX
- All buttons have proper labels
- All images have alt text
- Color contrast is sufficient
- Focus states on interactive elements
- Loading states on all async operations
- Error messages are user-friendly (not raw error objects)

### 5. Fix All Issues Found
Fix every bug you find. Do NOT skip any issue. This is the final audit before real users.

## Acceptance Criteria
- [ ] `npx tsc --noEmit` — 0 errors
- [ ] `npm run build` — 0 errors
- [ ] All existing tests pass
- [ ] Every user journey step works correctly
- [ ] No console errors in the browser
- [ ] No hardcoded secrets in client code
- [ ] All edge cases handled gracefully
- [ ] All empty states show helpful messages
- [ ] Mobile responsive on all pages
- [ ] All navigation links work

Working directory: /Users/CLD/.gemini/antigravity/scratch/plateup
