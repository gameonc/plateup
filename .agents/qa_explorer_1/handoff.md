# QA Investigation & Verification Report: PlateUp
**Agent**: `qa_explorer_1`  
**Date**: 2026-08-28  
**Working Directory**: `/Users/CLD/.gemini/antigravity/scratch/plateup/.agents/qa_explorer_1`  
**Scope**: 
1. Authentication & Route Protection
2. Discover (TheMealDB)
3. Recipe Collection

---

## 1. Observation

Direct code observations from the codebase (`src/`):

### 1.1 Authentication & Route Protection
- **`src/components/auth/AuthGuard.tsx` (lines 13-17)**:
  ```typescript
  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, loading, router, pathname]);
  ```
  *Finding*: Unauthenticated users accessing deep routes (`/recipes/xyz`, `/meal-plan`, etc.) are redirected to `/login` without preserving the target path in query parameters (`/login?redirect=...`).
- **`src/app/login/page.tsx` (lines 24-28)**:
  ```typescript
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);
  ```
  *Finding*: Upon authentication, the login page unconditionally pushes `/dashboard` rather than checking `useSearchParams()` for a `redirect` or `next` URL.
- **`src/app/login/page.tsx` (lines 30-70, 72-95)**:
  *Finding*: Robust client-side validation and 10 Firebase Auth error code translations (`auth/invalid-credential`, `auth/email-already-in-use`, `auth/weak-password`, `auth/invalid-email`, `auth/user-not-found`, `auth/wrong-password`, `auth/too-many-requests`, `auth/popup-closed-by-user`, `auth/unauthorized-domain`, `auth/network-request-failed`). Form validation properly guards empty/invalid email, short passwords (<6 chars), and empty display names.
- **`src/hooks/useAuth.tsx` (lines 41-80)**:
  *Finding*: `signUp`, `signIn`, `signInWithGoogle`, and `signOut` correctly handle Firestore profile creation at `users/{uid}` with default preferences (`repeatWindowDays: 5`, `mealsPerDay: ['breakfast', 'lunch', 'dinner']`, `dietaryRestrictions: []`).

---

### 1.2 Discover (TheMealDB)
- **`src/lib/mealdb.ts` (lines 56-64)**:
  ```typescript
  export function parseMealInstructions(instructions: string): string[] {
    return instructions
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => s.replace(/^(?:STEP\s*)?\d+[\.\)\:]?\s*/i, '').trim())
      .filter(s => s.length > 0);
  }
  ```
  *Finding*: `instructions` parameter is not guarded with a fallback (e.g. `(instructions || '')`). If TheMealDB returns `null` or `undefined` for `strInstructions`, calling `parseMealInstructions` directly throws a `TypeError: Cannot read properties of undefined (reading 'split')`. This affects `estimateDifficulty(meal)` (line 74), `mealToRecipeData(meal)` (line 141), and `DiscoverPage` dialog rendering (line 442).
- **`src/app/(app)/discover/page.tsx` (lines 170-181)**:
  ```typescript
  const handleSaveMeal = useCallback(async (meal: MealDBMeal) => {
    setSavingMealId(meal.idMeal);
    try {
      const recipeData = mealToRecipeData(meal);
      await addRecipe(recipeData);
      setSavedMealIds(prev => new Set(prev).add(meal.idMeal));
    } catch (err) { ... }
  ```
  *Finding*: If a user bookmarks a recipe directly from category list items where only summary data was loaded, `mealToRecipeData(meal)` is invoked without ensuring full meal details (instructions, ingredients) were fetched via `getMealById(meal.idMeal)`.
- **`src/lib/mealdb.ts` (lines 139-162)**:
  *Finding*: `mealToRecipeData(meal)` extracts ingredients and instructions and adds category and area to `tags`, but does not call `detectDietaryTags` to populate `dietaryTags`. As a result, discovered recipes are saved without explicit dietary tags.
- **`src/app/(app)/discover/page.tsx` (lines 86-148, 191-360)**:
  *Finding*: Search, category filtering, "Surprise Me" randomizer, and responsive recipe card grid are fully implemented and functional.

---

### 1.3 Recipe Collection
- **`src/app/(app)/recipes/page.tsx` (lines 47-56 & line 150)**:
  - Line 150:
    ```typescript
    placeholder="Search recipes, ingredients, or tags..."
    ```
  - Lines 49-55:
    ```typescript
    const q = searchQuery.toLowerCase().trim();
    const matchName = !q || recipe.name?.toLowerCase().includes(q);
    const matchTags = !q || recipe.tags?.some((tag) => tag.toLowerCase().includes(q));
    const matchDietaryTags = !q || recipe.dietaryTags?.some((tag) => tag.toLowerCase().includes(q));
    const matchesSearch = matchName || matchTags || matchDietaryTags;
    ```
  *Finding*: The filter predicate does NOT check `recipe.ingredients` (e.g. `recipe.ingredients?.some(i => i.item?.toLowerCase().includes(q) || i.name?.toLowerCase().includes(q))`), despite the input placeholder and test spec F-16.2 asserting search by ingredient name.
- **`src/app/(app)/recipes/[id]/page.tsx` (lines 356-376)**:
  ```typescript
  <Dialog>
    <DialogTrigger ...>Delete Recipe</DialogTrigger>
    <DialogContent className="rounded-2xl">
      <DialogHeader>
        <DialogTitle>Delete Recipe</DialogTitle>
        <DialogDescription>Are you sure you want to delete...</DialogDescription>
      </DialogHeader>
      <DialogFooter className="mt-4">
        <Button variant="outline" className="rounded-xl" disabled={isDeleting}>Cancel</Button>
        <Button variant="destructive" className="rounded-xl" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Yes, delete it
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  ```
  *Finding*: The "Cancel" button is a plain `<Button>` without a `<DialogClose>` wrapper or `onClick` handler. Clicking "Cancel" inside the delete recipe confirmation modal does not dismiss the dialog.
- **`src/app/(app)/recipes/[id]/page.tsx` (lines 65-115)**:
  *Finding*: 
  - 1-5 star rating correctly calls `rateRecipe(id, rating)` and triggers toast.
  - "I Made This" correctly increments `timesMade`, sets `lastMadeAt`, and writes an event to `users/{uid}/cookingLog`.
  - Notes correctly auto-save on blur via `updateRecipe(id, { notes })` and trigger toast.
  - Interactive ingredient checklist cross-off state works locally during cooking.
  - "Add to Shopping List" aggregates recipe ingredients and syncs to `users/{uid}/shoppingList/current`.

---

## 2. Logic Chain

1. **Redirect Intent**:
   - `ORIGINAL_REQUEST.md` (R1) & `PROJECT.md` Feature F-05 require route protection with redirect intent preservation.
   - Observation shows `AuthGuard.tsx` navigates to `/login` without query parameters, and `login/page.tsx` always redirects to `/dashboard`.
   - Inference: Deep links (e.g., sharing a recipe link `/recipes/xyz`) will drop the user on `/dashboard` after login instead of their target destination.

2. **Discover / TheMealDB Instructions Null Safety**:
   - `parseMealInstructions` in `mealdb.ts` calls `instructions.split(/\r?\n/)`.
   - TheMealDB API can return `null` for `strInstructions` on non-standard entries or category summary objects.
   - Inference: Unchecked `.split()` calls will throw unhandled exceptions and break UI rendering. Adding `(instructions || '')` prevents any runtime crash.

3. **Discover Saving Optimization**:
   - In `DiscoverPage`, clicking save on a card from category filter results may pass a partial meal object.
   - Inference: Checking if `meal.strInstructions` is present, and fetching `getMealById(meal.idMeal)` if missing, guarantees that saved recipes always possess full ingredients and instructions.

4. **Recipe Search Completeness**:
   - The search input in `src/app/(app)/recipes/page.tsx` promises search across "recipes, ingredients, or tags".
   - The filter logic only evaluated `name`, `tags`, and `dietaryTags`.
   - Inference: Users searching for recipes by pantry ingredients (e.g., "mozzarella", "avocado") will receive 0 results unless that ingredient happened to be manually added as a tag. Adding `recipe.ingredients?.some(...)` fixes this discrepancy.

5. **Recipe Delete Modal Dismissal**:
   - In Base UI dialog primitive (`@base-ui/react/dialog`), dialog dismissal requires triggers wrapped in `DialogClose` or programmatic open control.
   - In `RecipeDetailPage`, the Cancel button lacks `DialogClose`.
   - Inference: Users clicking "Cancel" in the delete confirmation modal will be unable to dismiss the modal via the button. Wrapping with `<DialogClose>` resolves the issue.

---

## 3. Caveats
- No modifications were made to source code during this QA investigation (strict read-only explorer mandate).
- Firebase Authentication and Firestore real-time listeners were verified via architecture audit and test harnesses; live end-to-end cloud calls require active Firebase project credentials.
- TheMealDB external endpoints rely on public API availability (`themealdb.com/api/json/v1/1`).

---

## 4. Conclusion

The core implementations for Authentication & Route Protection, Discover (TheMealDB), and Recipe Collection are well-architected and comply with the project standards, design system, and data schemas.

Four specific actionable fixes are identified for the implementation team:
1. **Preserve Redirect Intent**: Update `AuthGuard.tsx` to push `/login?redirect=${encodeURIComponent(pathname)}` and update `login/page.tsx` to redirect to `searchParams.get('redirect') || '/dashboard'`.
2. **Defensive Parsing in `mealdb.ts`**: Update `parseMealInstructions` to handle null/undefined `instructions` (`(instructions || '').split(/\r?\n/)`).
3. **Include Ingredients in Recipe Search**: Add ingredient item check to `filteredAndSortedRecipes` filter predicate in `recipes/page.tsx`.
4. **Fix Cancel Button in Delete Modal**: Wrap the Cancel button in `<DialogClose>` within `recipes/[id]/page.tsx`.

---

## 5. Verification Method

To verify the findings and any applied fixes:

1. **TypeScript Build & Type Check**:
   ```bash
   npx tsc --noEmit
   ```
2. **Next.js Production Build**:
   ```bash
   npm run build
   ```
3. **Automated Test Suite**:
   ```bash
   npm test
   ```
4. **Manual / Component Verification**:
   - Inspect `/login` with `?redirect=%2Fmeal-plan` to confirm post-login redirection.
   - Search for ingredient name "avocado" on `/recipes` to confirm recipes with avocado are matched.
   - Open delete modal on `/recipes/[id]` and click "Cancel" to verify modal closes.
   - Trigger TheMealDB meal parse with null instructions to verify no crash occurs.
