# Original User Request

## 2026-08-27T20:26:32Z

Polish, extend, and QA the PlateUp app — an AI-powered recipe extraction and smart meal planning web app built with Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui, and Firebase (Auth, Firestore, AI Logic with Gemini). The app lets users extract recipes from YouTube videos or food photos via AI, save and rate recipes, and plan weekly meals. The codebase is functional but needs UI polish, new features, and thorough bug fixing to be ready for real users.

Working directory: /Users/CLD/.gemini/antigravity/scratch/plateup
Integrity mode: development

## Requirements

### R1. Fix all bugs and ensure end-to-end functionality
The app must work correctly from sign-up through all core flows: create account (email or Google), extract a recipe from a YouTube URL, extract a recipe from a photo upload, save recipes, rate recipes, mark recipes as made, search/sort the recipe collection, assign meals to the weekly planner, auto-fill the meal plan, and view today's menu on the dashboard. Any runtime errors, type errors, broken imports, or non-functional UI elements must be fixed.

### R2. Polish the UI for a modern, mobile-first experience
Improve the visual design across all pages to feel like a premium food app. This includes: smooth page transitions and loading states, consistent warm color theming (orange/amber), proper responsive layouts that work well on both mobile and desktop, polished empty states, and micro-interactions (hover effects, button feedback, animations). The landing page should be conversion-focused and beautiful. The login page must clearly show errors and handle all auth states gracefully.

### R3. Add a shopping list feature
Users should be able to generate a grocery/shopping list from their weekly meal plan. The shopping list should aggregate ingredients across all planned meals, combine duplicates intelligently (e.g., two recipes needing onions should show the combined amount), and allow users to check off items as they shop. The list should be saveable and accessible from the navigation.

### R4. Add dietary preferences and recipe filtering
Users should be able to set dietary preferences in their profile (e.g., vegetarian, vegan, keto, gluten-free, dairy-free). Recipes should be taggable with dietary categories. The recipe collection and meal planner should be filterable by these preferences. The AI extraction prompts should identify dietary attributes of extracted recipes automatically.

## Acceptance Criteria

### End-to-End Functionality
- [ ] `npm run build` completes with zero errors
- [ ] `npx tsc --noEmit` completes with zero TypeScript errors
- [ ] Sign up with email/password creates an account and redirects to dashboard
- [ ] Google Sign-In opens popup and successfully authenticates
- [ ] Extracting a recipe from a YouTube URL returns a complete recipe with ingredients and instructions
- [ ] Uploading a food photo extracts a recipe via AI
- [ ] Saving an extracted recipe persists it to Firestore and appears in the recipe collection
- [ ] Rating a recipe (1-5 stars) persists and displays correctly
- [ ] "I Made This" button increments the cook count and logs to cooking history
- [ ] Weekly meal planner displays 7 days × 3 meals and allows manual slot assignment
- [ ] Auto-fill populates empty slots from saved recipes while avoiding recent repeats
- [ ] Dashboard shows today's planned meals from the current week's plan

### UI Quality
- [ ] All pages render correctly on mobile viewport (375px width) with no horizontal overflow
- [ ] All pages render correctly on desktop viewport (1440px width)
- [ ] Loading states are shown during all async operations (auth, recipe extraction, data fetching)
- [ ] Empty states provide helpful messages and calls-to-action
- [ ] No layout shift or flash of unstyled content on page load

### Shopping List
- [ ] A "Shopping List" option is accessible from the main navigation
- [ ] Generating a shopping list from the current meal plan produces a list of all needed ingredients
- [ ] Duplicate ingredients across recipes are combined with summed quantities
- [ ] Individual items can be checked off
- [ ] The shopping list persists across page reloads

### Dietary Preferences
- [ ] Users can set dietary preferences in a settings/profile area
- [ ] Recipes display dietary tags (vegetarian, vegan, keto, gluten-free, etc.)
- [ ] AI extraction automatically identifies and tags dietary attributes
- [ ] Recipe collection can be filtered by dietary category
- [ ] Meal planner respects dietary preferences when auto-filling
