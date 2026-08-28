# Original User Request

## 2026-08-28T04:53:50Z

QA-test the PlateUp app — an AI-powered recipe extraction and smart meal planning web app built with Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Firebase (Auth + Firestore), Google Generative AI (Gemini 3.6 Flash), and TheMealDB API. The app is deployed at https://plateup-two.vercel.app and the codebase is at /Users/CLD/.gemini/antigravity/scratch/plateup. This is a pre-release QA pass before real family users start testing. Find and fix any bugs, broken flows, or rough edges.

Working directory: /Users/CLD/.gemini/antigravity/scratch/plateup
Integrity mode: development

## Requirements

### R1. End-to-end functional verification
Every core user flow must work without errors from start to finish: sign up (email + Google), log in, extract a recipe from a YouTube URL, extract a recipe from a food photo, browse/search/save recipes from the Discover page (TheMealDB), view saved recipes, rate a recipe, mark a recipe as made, assign recipes to the weekly meal planner, auto-fill the meal plan, generate a shopping list from the meal plan, check off shopping list items, and set dietary preferences in the profile.

### R2. Fix any bugs discovered during testing
Any broken feature, runtime error, unhandled edge case, missing error state, or UI issue found during testing must be fixed. This includes: buttons that don't respond, pages that crash, data that doesn't persist to Firestore, forms that submit without validation, empty states that show raw errors, and mobile layout issues.

### R3. Build and type-safety verification
The app must build cleanly with zero errors (`npm run build` passes, `npx tsc --noEmit` passes). All existing tests must continue to pass.

## Acceptance Criteria

### Build Health
- [ ] `npx tsc --noEmit` completes with zero TypeScript errors
- [ ] `npm run build` completes with zero errors
- [ ] All existing tests pass (696/696 or more)

### Authentication
- [ ] Email sign-up creates account and redirects to dashboard
- [ ] Email sign-in works for existing accounts
- [ ] Error messages display correctly for wrong password, invalid email
- [ ] Sign out works and redirects to landing page

### Recipe Extraction
- [ ] YouTube extraction: pasting a cooking video URL and clicking Extract produces a complete recipe with name, ingredients, instructions, tags, and dietary tags
- [ ] Photo extraction: uploading a food image produces a complete recipe
- [ ] Extracted recipes can be saved to the user's collection
- [ ] Error states are shown clearly when extraction fails (not raw error objects)

### Discover (TheMealDB)
- [ ] Search returns relevant results
- [ ] Category filters work
- [ ] "Surprise Me" loads a random recipe
- [ ] Recipe detail dialog opens with full info
- [ ] Saving a discovered recipe adds it to the user's collection in Firestore

### Recipe Collection
- [ ] Saved recipes appear in the Recipes page
- [ ] Search and sort work correctly
- [ ] Dietary filter chips filter recipes
- [ ] Individual recipe detail page loads with all fields
- [ ] Rating (1-5 stars) persists
- [ ] "I Made This" increments cook count

### Meal Planner
- [ ] Weekly calendar displays 7 days × 3 meals
- [ ] Manual recipe assignment via picker works
- [ ] Auto-fill populates empty slots from saved recipes
- [ ] Week navigation (prev/next) works
- [ ] Removing a meal from a slot works

### Shopping List
- [ ] Generating from meal plan produces ingredient list
- [ ] Duplicate ingredients are combined
- [ ] Checking off items persists
- [ ] Clear checked and clear all work

### Dietary Preferences
- [ ] Profile page allows toggling dietary restrictions
- [ ] Select All / Clear All work
- [ ] Meal time preferences can be toggled

### Mobile Responsiveness
- [ ] All pages render correctly at 375px width with no horizontal overflow
- [ ] Navigation bar is usable on mobile
- [ ] No overlapping elements or cut-off text on mobile
