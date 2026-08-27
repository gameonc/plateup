## 2026-08-27T20:51:24Z
You are the Implementer Worker for Milestone 4 (Dietary Preferences & Filtering - R4) of PlateUp.
Your working directory is: /Users/CLD/.gemini/antigravity/scratch/plateup/.agents/worker_m4
Project workspace: /Users/CLD/.gemini/antigravity/scratch/plateup
Read the authoritative user request at: /Users/CLD/.gemini/antigravity/scratch/plateup/ORIGINAL_REQUEST.md
Read the Master Project Scope at: /Users/CLD/.gemini/antigravity/scratch/plateup/PROJECT.md
Read the Feature Specification at: /Users/CLD/.gemini/antigravity/scratch/plateup/.agents/survey_spec_miner/survey_specs.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Scope for Milestone 4 (Dietary Preferences and Recipe Filtering - R4):
1. **Dietary Taxonomy & Types (`src/types/index.ts`)**:
   - Ensure standard dietary taxonomy: 'vegetarian' | 'vegan' | 'gluten-free' | 'dairy-free' | 'keto' | 'low-carb' | 'pescatarian' | 'nut-free'.
   - Update UserPreferences and UserProfile interfaces to include dietaryRestrictions: DietaryRestriction[].
2. **Profile & Dietary Settings Page (`src/app/(app)/profile/page.tsx` & `src/hooks/useProfile.ts`)**:
   - Build a responsive /profile page:
     - User account info (Avatar, Display Name, Email).
     - Dietary Preferences card: toggleable switches/chips for all 8 dietary categories with icons/descriptions.
     - Meal Planning Preferences card: repeat window slider (1-14 days), default meals per day checkboxes (Breakfast, Lunch, Dinner).
     - Save button with toast notification and Firestore persistence (users/{userId}.preferences).
   - Create src/hooks/useProfile.ts or update useAuth.tsx to load and mutate user profile preferences in Firestore with real-time/optimistic sync.
   - Update src/components/layout/Navbar.tsx to link "Profile & Settings" in desktop avatar menu and mobile header avatar menu.
3. **AI Extraction Prompts Auto-Tagging (`src/lib/ai.ts` & `src/services/extract-recipe.ts`)**:
   - Update Gemini extraction instructions for YouTube transcript extraction and multimodal photo extraction to analyze ingredients and instructions and automatically populate dietaryTags matching the standard taxonomy (e.g. identify plant-based as vegan/vegetarian, dairy-free, gluten-free, low-carb/keto).
4. **Recipe Collection Filtering & Tag Badges (`src/app/(app)/recipes/page.tsx` & `RecipeCard.tsx` & `RecipePreview.tsx`)**:
   - On /recipes page, add interactive dietary filter chips (All, Vegetarian, Vegan, Gluten-Free, Dairy-Free, Keto, Low-Carb, Pescatarian, Nut-Free, Quick <30min).
   - Filter recipes in real-time based on selected dietary chip(s) and search text.
   - Display distinct colored dietary badges on recipe cards (RecipeCard.tsx), extraction preview (RecipePreview.tsx), and recipe detail page (recipes/[id]/page.tsx).
5. **Dietary-Compliant Meal Planner Auto-Fill (`src/lib/meal-planner.ts` & `src/app/(app)/meal-plan/page.tsx`)**:
   - Update generateMealPlan to strictly enforce user dietary preferences (filter available recipes so only recipes with matching dietary tags are selected for meal slots).
   - If available compliant recipes are fewer than the required slots, balance repeats gracefully and return clear metadata.
   - On /meal-plan/page.tsx, show an active dietary badge/banner if user has active dietary restrictions, and allow filtering the Recipe Picker modal by dietary category.
6. **Verification**:
   - Run npx tsc --noEmit -> 0 errors
   - Run npm run lint -> 0 errors
   - Run npm run build -> 0 errors
   - Run npm test -> 100% pass

Write your handoff report to /Users/CLD/.gemini/antigravity/scratch/plateup/.agents/worker_m4/handoff.md and notify the parent orchestrator.
