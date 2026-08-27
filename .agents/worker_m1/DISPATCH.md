## 2026-08-27T20:31:19Z

You are the Implementer Worker for Milestone 1 of PlateUp.
Your working directory is: /Users/CLD/.gemini/antigravity/scratch/plateup/.agents/worker_m1
Project workspace: /Users/CLD/.gemini/antigravity/scratch/plateup
Read the authoritative user request at: /Users/CLD/.gemini/antigravity/scratch/plateup/ORIGINAL_REQUEST.md
Read the Master Project Scope at: /Users/CLD/.gemini/antigravity/scratch/plateup/PROJECT.md
Read the Survey Reports at:
- /Users/CLD/.gemini/antigravity/scratch/plateup/.agents/survey_explorer_codebase/survey_codebase.md
- /Users/CLD/.gemini/antigravity/scratch/plateup/.agents/survey_explorer_ui/survey_ui.md
- /Users/CLD/.gemini/antigravity/scratch/plateup/.agents/survey_spec_miner/survey_specs.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Scope for Milestone 1 (Core Bug Fixes, Type Safety & Auth/Data Flow):
1. **Photo Recipe Thumbnail Persistence**: In src/app/(app)/extract/page.tsx, ensure thumbnailUrl is set and saved to Firestore for image extractions (selectedImage / Base64 data URL).
2. **Tab Query Param Handling**: In src/app/(app)/extract/page.tsx, read searchParams.get('tab') and default active tab to 'photo' if ?tab=photo is provided in URL.
3. **Mobile Layout Z-Index Collision**: In src/app/(app)/recipes/[id]/page.tsx, fix the fixed-bottom action bar so it does not collide with or get obscured by Navbar.tsx on mobile (375px) viewports. Ensure clean spacing and proper bottom padding.
4. **Mobile Navigation Profile / Logout**: In src/components/layout/Navbar.tsx, ensure mobile users have clear access to user profile and sign out.
5. **Google Font Build Fallback**: In src/app/layout.tsx, ensure fonts use reliable system font fallbacks (system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif) so npm run build succeeds reliably in sandboxed/offline environments.
6. **Firestore Rules**: In firestore.rules, add security rules for users/{userId}/shoppingLists/{listId} and users/{userId}/shoppingList/{itemId} allowing authenticated owners read/write access.
7. **ESLint / React 19 Fixes**: Fix the ESLint errors and warnings across src/hooks/useRecipes.ts, src/hooks/useCookingLog.ts, src/app/page.tsx, src/app/(app)/recipes/[id]/page.tsx, src/app/login/page.tsx, src/app/api/youtube-recipe/route.ts, and src/lib/meal-planner.ts.
8. **Verification**: Run npx tsc --noEmit and npm run build to verify zero compilation or build errors.
