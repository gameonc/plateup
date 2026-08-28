## 2026-08-28T04:57:50Z

You are qa_worker_1, an implementation worker subagent for the PlateUp project.
Your Working Directory: /Users/CLD/.gemini/antigravity/scratch/plateup/.agents/qa_worker_1
You MUST read /Users/CLD/.gemini/antigravity/scratch/plateup/.agents/ORIGINAL_REQUEST.md and /Users/CLD/.gemini/antigravity/scratch/plateup/PROJECT.md before starting work.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Assigned Tasks:
Apply the 4 high-value QA improvements and 1 config refinement identified by the Explorers:

1. **Redirect Intent Preservation**:
   - In `src/components/auth/AuthGuard.tsx`: When redirecting an unauthenticated user (who is not on `/login`), preserve the current pathname using query params: `router.push(`/login?redirect=${encodeURIComponent(pathname)}`)`.
   - In `src/app/login/page.tsx`: When `user && !loading`, read `const searchParams = useSearchParams()` and redirect to `const redirectUrl = searchParams.get('redirect') || '/dashboard'`. Note: wrap the login page content in `<Suspense>` if required by Next.js App Router for `useSearchParams()`.

2. **TheMealDB Instructions Null Safety & Dietary Tagging**:
   - In `src/lib/mealdb.ts`: In `parseMealInstructions(instructions: string)`, guard against `null` or `undefined` by doing `(instructions || '').split(/\r?\n/)`.
   - In `mealToRecipeData(meal: MealDBMeal)`: If `meal.strInstructions` is null/empty, ensure fallback empty array; run `detectDietaryTags(ingredients, instructions)` from `src/lib/dietary.ts` or tag parsing so saved discovered recipes have accurate dietary tags.

3. **Recipe Search Ingredient Matching**:
   - In `src/app/(app)/recipes/page.tsx`: In `filteredAndSortedRecipes`, update the search filter predicate to also search across recipe ingredients:
     `const matchIngredients = !q || recipe.ingredients?.some((ing) => (ing.item || (ing as any).name || '')?.toLowerCase().includes(q));`
     `const matchesSearch = matchName || matchTags || matchDietaryTags || matchIngredients;`

4. **Recipe Delete Modal Dismissal**:
   - In `src/app/(app)/recipes/[id]/page.tsx`: Wrap the "Cancel" button in the delete confirmation modal with `<DialogClose asChild><Button variant="outline" ...>Cancel</Button></DialogClose>` (import `DialogClose` from `@/components/ui/dialog` if not already imported).

5. **ESLint Global Ignores**:
   - In `eslint.config.mjs`: Add `".vercel/**"` to `globalIgnores` array so build artifacts are ignored by eslint.

6. **Verification**:
   - Run `npx tsc --noEmit` and verify 0 errors.
   - Run `npm run build` and verify 0 errors.
   - Run `npm test` and ensure all tests pass (696/696 or more). Add tests in `tests/` if needed for redirect intent or ingredient search.

Document your changes, build/test execution output, and verification results in `/Users/CLD/.gemini/antigravity/scratch/plateup/.agents/qa_worker_1/handoff.md` and send a message back with your summary when complete.
