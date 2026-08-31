## 2026-08-30T17:57:12Z
Investigate all core user flows and features across the codebase:
1. Landing page -> Sign Up / Login -> Dashboard first-time experience
2. YouTube Recipe Extraction: regular URLs and Shorts URLs handling, Gemini extraction prompt, parsing logic
3. Photo Recipe Extraction: supported image formats (jpg, png, heic, webp), base64 encoding, Gemini vision API logic
4. Save recipe to My Recipes collection, Firestore data structures, queries, indexing
5. Rating system (1-5 stars) and persistence on reload; 'I Made This' cook count incrementing
6. Recipe deletion with confirmation dialog
7. Discover page: TheMealDB integration, search, saving to collection
8. Meal Plan: My Recipes tab, Discover tab with cuisine filters, Auto-fill week logic, slot clearing, clear all, week navigation
9. Shopping List: Generation from meal plan, item check-off persistence, affiliate links for ordering ingredients
10. Profile: Dietary preferences persistence and filtering, subscription status
11. Pricing page: Free vs Pro comparison, Go Pro Stripe checkout button flow
12. Servings adjuster on recipe detail: ingredient scaling math and fraction parsing
13. Navigation & Logout: Navbar, footer, redirects, auth state persistence

Document every bug, incomplete implementation, and flow break in /Users/CLD/.gemini/antigravity/scratch/plateup/.agents/explorer_survey_2/survey_user_journeys.md and write a structured handoff.md in your working directory. Then message your orchestrator when done.
