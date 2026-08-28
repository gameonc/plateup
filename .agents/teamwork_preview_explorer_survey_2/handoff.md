# Handoff Report: Data Layer, Firebase Auth, Firestore Schema, User Profile & AI Extraction Workflows

**Agent**: `teamwork_preview_explorer_survey_2`  
**Date**: 2026-08-28  
**Target Milestone**: PlateUp Monetization, Freemium Tier & Affiliate Integration

---

## 1. Observation

### 1.1 Firebase Configuration & Initialization
- **Client Configuration File**: `src/lib/firebase.ts` (lines 1–21)
  - Uses standard Firebase v12 client SDK (`firebase/app`, `firebase/auth`, `firebase/firestore`).
  - Exports singleton instances: `auth = getAuth(app)` and `db = getFirestore(app)`.
  - Config object reads from public env vars:
    ```typescript
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
    };
    ```
- **Environment Variables**: `.env.local` contains all 6 client-side `NEXT_PUBLIC_FIREBASE_*` keys pointing to project `plateup-ai-2026`.
- **Server-side / Admin SDK**:
  - `firebase-admin` is **not installed** in `package.json`.
  - All Firestore operations in the application currently run on the client side using the client SDK (`firebase/firestore`).
  - Next.js API route (`src/app/api/youtube-recipe/route.ts`) handles metadata scraping only and does not interact directly with Firestore.

### 1.2 Firebase Authentication & User State Flow
- **Auth Provider & Hook**: `src/hooks/useAuth.tsx` (lines 1–96)
  - Context `AuthContext` provides: `{ user, loading, signIn, signUp, signInWithGoogle, signOut }`.
  - Listens to auth state changes via `onAuthStateChanged(auth, (currentUser) => { setUser(currentUser); setLoading(false); })`.
  - User profile initialization in Firestore on sign-up / Google sign-in:
    `createUserProfile(user: User, displayName?: string)` at lines 41–60 writes document `users/{user.uid}` if `!userDoc.exists()`.
  - Current initial document fields written at `useAuth.tsx:48-59`:
    ```typescript
    {
      uid: user.uid,
      email: user.email,
      displayName: displayName || user.displayName || '',
      createdAt: serverTimestamp(),
      preferences: {
        repeatWindowDays: 5,
        mealsPerDay: ['breakfast', 'lunch', 'dinner'],
        dietaryRestrictions: [],
      },
    }
    ```
  - **Notice**: Currently, `plan: 'free'`, `extractionsThisMonth: 0`, and `extractionMonth: 'YYYY-MM'` are **not yet initialized** in `createUserProfile`.
- **Route Protection**:
  - `src/components/auth/AuthGuard.tsx` protects all routes inside `src/app/(app)/layout.tsx`.
  - Unauthenticated users are redirected to `/login?redirect=${encodeURIComponent(pathname)}`.
  - `src/app/login/page.tsx` supports email/password login, email/password signup, and Google OAuth popup (`signInWithGoogle`). Preserves redirect intent.

### 1.3 Firestore Collections, Security Rules, and Schema
- **Security Rules**: `firestore.rules` (lines 1–49)
  - Enforces `isOwner(userId)` (`request.auth != null && request.auth.uid == userId`) on `/users/{userId}` and all subcollections (`recipes`, `mealPlans`, `cookingLog`, `shoppingLists`, `shoppingList`).
  - Users have full read/write permission to their own root user document and subcollections.
- **Root Collection**: `/users/{userId}`
  - Managed by `src/hooks/useProfile.ts` via real-time `onSnapshot(doc(db, 'users', user.uid))` (lines 28–71).
  - TypeScript interface `UserProfile` in `src/types/index.ts` (lines 157–174):
    ```typescript
    export interface UserProfile {
      uid?: string;
      displayName: string;
      email: string;
      photoURL?: string;
      preferences: UserPreferences;
      createdAt: Date;
      updatedAt?: Date;
    }
    ```
  - Needs extension in `src/types/index.ts` and `src/hooks/useProfile.ts` for monetization fields:
    ```typescript
    plan?: 'free' | 'pro';
    extractionsThisMonth?: number;
    extractionMonth?: string; // Format: "YYYY-MM" (e.g. "2026-08")
    subscriptionId?: string;
    stripeCustomerId?: string;
    ```
- **Subcollections**:
  1. `/users/{userId}/recipes/{recipeId}`:
     - Managed by `src/hooks/useRecipes.ts`.
     - Types: `Recipe`, `Ingredient`, `DietaryRestriction` (`src/types/index.ts:42-71`).
     - Real-time listener `onSnapshot(query(recipesRef, orderBy('createdAt', 'desc')))` (lines 34–57).
     - Helpers: `addRecipe`, `updateRecipe`, `deleteRecipe`, `rateRecipe`, `markAsMade`.
  2. `/users/{userId}/shoppingLists/{weekId}` and `/users/{userId}/shoppingList/current`:
     - Managed by `src/hooks/useShoppingList.ts` (lines 51–121, 163–196).
     - Types: `ShoppingList`, `ShoppingListItem`, `GroceryDepartment` (`src/types/index.ts:74–110`).
     - Dual-persists to both `shoppingLists/{weekId}` and `shoppingList/current`.
  3. `/users/{userId}/mealPlans/{weekId}`:
     - Managed by `src/hooks/useMealPlan.ts` (lines 47–87).
     - Types: `MealPlan`, `WeekMeals`, `DayMeals`, `MealSlot` (`src/types/index.ts:113–145`).
  4. `/users/{userId}/cookingLog/{logId}`:
     - Managed by `src/hooks/useCookingLog.ts` (lines 23–53).
     - Type: `CookingLogEntry` (`src/types/index.ts:148–154`).

### 1.4 AI Recipe Extraction Workflows
- **Google Generative AI Setup**: `src/lib/ai.ts` (lines 1–58)
  - Uses `@google/generative-ai` package (`GoogleGenerativeAI`).
  - Initialized with `const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''`.
  - `recipeModel` uses `gemini-3.6-flash` with `responseMimeType: 'application/json'` and `responseSchema: recipeSchema`.
- **Extraction Implementation**: `src/lib/extract-recipe.ts`
  - **YouTube Extraction**:
    - Function: `extractRecipeFromYouTube(youtubeUrl, onEscalate)` (lines 228–260).
    - Flow:
      1. Calls `POST /api/youtube-recipe` with `{ url }`.
      2. Server route (`src/app/api/youtube-recipe/route.ts`) calls `extractYouTubeData(videoId)` (`src/lib/youtube.ts`), fetching oEmbed title and scraping HTML for `shortDescription`.
      3. If description has recipe measurements (`hasRecipeSignal` >= 3 measurement patterns), calls `extractRecipeFromTranscript()` using Gemini with `YOUTUBE_RECIPE_PROMPT`.
      4. If description has no recipe or produces a thin recipe (`isThinRecipe`), triggers `onEscalate()` ("AI is watching the video...") and calls `extractRecipeFromYouTubeUrl(youtubeUrl)` which sends `{ fileData: { fileUri: youtubeUrl, mimeType: 'video/*' } }` to Gemini directly.
  - **Photo Extraction**:
    - Function: `extractRecipeFromImage(base64Data, mimeType)` (lines 163–195).
    - Invoked directly from `src/app/(app)/extract/page.tsx:119-146`.
    - Sends base64 image data inline to Gemini with `IMAGE_RECIPE_PROMPT`.
- **Dietary Tagging**:
  - `detectDietaryTags` in `src/lib/extract-recipe.ts:24-50` provides deterministic validation of ingredients and instructions across 8 restrictions (`vegetarian`, `vegan`, `gluten-free`, `dairy-free`, `keto`, `low-carb`, `pescatarian`, `nut-free`).

### 1.5 TheMealDB Discover Page (Unrestricted Browsing)
- **Files**: `src/app/(app)/discover/page.tsx` & `src/lib/mealdb.ts`
- **Data Source**: TheMealDB public JSON API (`https://www.themealdb.com/api/json/v1/1`).
- **No AI / No Extraction Quota**:
  - Search, random suggestions, category filtering, and meal detail modal run completely free against TheMealDB API.
  - Clicking "Save to My Recipes" uses `mealToRecipeData(meal)` (a deterministic parsing helper in `src/lib/mealdb.ts:141-167`) and calls `addRecipe(recipeData)` in `useRecipes`.
  - **Requirement R2/Acceptance Criteria Confirmation**: Discover page has zero dependency on Gemini AI and must remain 100% free and ungated.

---

## 2. Logic Chain

1. **User Profile & Plan Schema Extension**:
   - `UserProfile` in `src/types/index.ts` is the single source of truth for user profile data.
   - Adding `plan: 'free' | 'pro'`, `extractionsThisMonth: number`, `extractionMonth: string`, and `subscriptionId?: string` directly aligns with Firestore document structure at `users/{userId}`.
   - `useProfile.ts` already listens to `users/{userId}` via `onSnapshot`. When `plan` and `extractionsThisMonth` are added to the snapshot mapper, any component (e.g. `Navbar.tsx`, `extract/page.tsx`, `profile/page.tsx`) calling `useProfile()` instantly receives real-time tier and usage updates.

2. **Default Fallback for Existing and New Users**:
   - In `useAuth.tsx:createUserProfile`, default `plan: 'free'`, `extractionsThisMonth: 0`, and `extractionMonth: new Date().toISOString().slice(0, 7)`.
   - In `useProfile.ts`, when reading `data.plan` from Firestore, if missing (e.g. existing user accounts), default gracefully to:
     ```typescript
     plan: data.plan || 'free',
     extractionsThisMonth: (data.extractionMonth === currentMonthKey) ? (data.extractionsThisMonth || 0) : 0,
     extractionMonth: data.extractionMonth || currentMonthKey,
     subscriptionId: data.subscriptionId || undefined,
     ```

3. **Monthly Reset and Quota Checking Logic**:
   - Format: Monthly tracking should use ISO year-month string: `const currentMonthKey = new Date().toISOString().slice(0, 7)` (e.g., `"2026-08"`).
   - If the user's stored `extractionMonth !== currentMonthKey`, their usage for the current calendar month is effectively `0`, even before any write occurs.
   - **Remaining Extractions Calculation**:
     ```typescript
     const isPro = profile?.plan === 'pro';
     const usedThisMonth = profile?.extractionMonth === currentMonthKey ? (profile.extractionsThisMonth ?? 0) : 0;
     const remainingExtractions = isPro ? Infinity : Math.max(0, 5 - usedThisMonth);
     const isQuotaExceeded = !isPro && remainingExtractions <= 0;
     ```

4. **Atomic Increment Strategy**:
   - Because `firestore.rules` grants authenticated users write access to their own `users/{userId}` document, extraction increments can be performed directly on `doc(db, 'users', user.uid)`.
   - **Concurrency / Atomicity**:
     Use Firestore `runTransaction` (or `updateDoc` with `increment(1)`):
     ```typescript
     export async function recordExtractionUsage(userId: string): Promise<{ remaining: number; plan: 'free' | 'pro' }> {
       const userRef = doc(db, 'users', userId);
       const currentMonth = new Date().toISOString().slice(0, 7);
       
       return await runTransaction(db, async (transaction) => {
         const userDoc = await transaction.get(userRef);
         if (!userDoc.exists()) throw new Error('User document not found');
         
         const data = userDoc.data();
         const plan = data.plan || 'free';
         if (plan === 'pro') {
           return { remaining: Infinity, plan: 'pro' };
         }
         
         const storedMonth = data.extractionMonth || '';
         const currentCount = storedMonth === currentMonth ? (data.extractionsThisMonth || 0) : 0;
         
         if (currentCount >= 5) {
           throw new Error('Monthly extraction limit reached (5/5). Upgrade to Pro for unlimited extractions.');
         }
         
         transaction.set(userRef, {
           extractionsThisMonth: currentCount + 1,
           extractionMonth: currentMonth,
           updatedAt: serverTimestamp(),
         }, { merge: true });
         
         return { remaining: 5 - (currentCount + 1), plan: 'free' };
       });
     }
     ```
   - **Execution Timing**:
     - Check quota **before** initiating AI call in `handleExtractYoutube` and `handleExtractImage`.
     - Execute the increment **upon successful recipe extraction** (before or alongside displaying `RecipePreview`).

5. **UI Integration Points**:
   - `src/app/(app)/extract/page.tsx`:
     - Display remaining badge / banner: e.g., `"3 of 5 free extractions remaining this month"` for Free tier, or `"Unlimited Pro Extractions 👑"` for Pro tier.
     - When `isQuotaExceeded` is true, replace the "Extract Recipe" button with an upgrade call-to-action button linking to `/pricing` or displaying an encouraging modal.
   - `src/components/layout/Navbar.tsx`:
     - Add a "Pro" badge (or crown icon) next to the user's avatar / username if `profile?.plan === 'pro'`.
     - Add a "Pricing" link in desktop navigation and profile dropdown.
   - `src/app/(app)/profile/page.tsx`:
     - Add a Subscription / Membership card displaying current tier (`Free` or `Pro`), monthly extraction usage count, and billing / upgrade management button.

---

## 3. Caveats

1. **Client-Side vs Server-Side Firestore Updates**:
   - `firebase-admin` is not installed, so all current Firestore operations run in the browser using the Firebase JS Client SDK authenticated via `request.auth.uid`.
   - For Stripe checkout completion: when the user completes payment on Stripe Checkout and redirects to `/pricing?success=true&session_id=...`, the client verifies the session via a Next.js API route (`/api/checkout/verify` or similar) and updates the user's Firestore profile to `plan: 'pro'` with `subscriptionId`.
2. **Stripe Test Mode Keys**:
   - `STRIPE_SECRET_KEY` (server-side only) and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (client-side) should be provided via environment variables.
3. **No Breaking Changes to Existing Test Suite**:
   - The test suite in `tests/runner.ts` tests 766 test cases across 22 test files. None of the proposed schema additions (`plan`, `extractionsThisMonth`, `extractionMonth`, `subscriptionId`) break existing tests since all new fields are optional or have sensible default fallbacks.

---

## 4. Conclusion & Architecture Blueprint

### 4.1 Interface & Type Definitions
Add to `src/types/index.ts`:
```typescript
export type SubscriptionPlan = 'free' | 'pro';

export interface UserProfile {
  uid?: string;
  displayName: string;
  email: string;
  photoURL?: string;
  plan?: SubscriptionPlan;
  extractionsThisMonth?: number;
  extractionMonth?: string; // e.g. "2026-08"
  subscriptionId?: string;
  stripeCustomerId?: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt?: Date;
}
```

### 4.2 Helper Module: `src/lib/usage.ts`
Implement a dedicated helper for usage calculations, checking, and transaction-safe increments:
```typescript
export const FREE_TIER_MONTHLY_LIMIT = 5;

export function getCurrentMonthKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getExtractionUsage(profile: UserProfile | null | undefined): {
  plan: 'free' | 'pro';
  used: number;
  limit: number;
  remaining: number;
  isLimitReached: boolean;
} {
  const currentMonth = getCurrentMonthKey();
  const plan = profile?.plan || 'free';
  
  if (plan === 'pro') {
    return {
      plan: 'pro',
      used: profile?.extractionMonth === currentMonth ? (profile?.extractionsThisMonth || 0) : 0,
      limit: Infinity,
      remaining: Infinity,
      isLimitReached: false,
    };
  }

  const used = profile?.extractionMonth === currentMonth ? (profile?.extractionsThisMonth || 0) : 0;
  const remaining = Math.max(0, FREE_TIER_MONTHLY_LIMIT - used);

  return {
    plan: 'free',
    used,
    limit: FREE_TIER_MONTHLY_LIMIT,
    remaining,
    isLimitReached: remaining <= 0,
  };
}
```

### 4.3 Summary Matrix of Touched Components & Roles

| Target File | Required Role & Additions |
| :--- | :--- |
| `src/types/index.ts` | Add `SubscriptionPlan`, update `UserProfile` with `plan`, `extractionsThisMonth`, `extractionMonth`, `subscriptionId`. |
| `src/hooks/useAuth.tsx` | In `createUserProfile`, initialize default `plan: 'free'`, `extractionsThisMonth: 0`, `extractionMonth: 'YYYY-MM'`. |
| `src/hooks/useProfile.ts` | Map `plan`, `extractionsThisMonth`, `extractionMonth`, `subscriptionId` in `onSnapshot` with default fallbacks. |
| `src/lib/usage.ts` (new) | Encapsulate monthly key calculation, remaining count logic, and atomic Firestore transaction increment. |
| `src/app/(app)/extract/page.tsx` | Show remaining count badge, block extraction on limit reach, present encouraging Pro upgrade banner/modal. |
| `src/components/layout/Navbar.tsx` | Add Pro crown/badge next to avatar; add Pricing link in nav items & user dropdown. |
| `src/app/(app)/profile/page.tsx` | Add "Subscription & Plan Status" card showing plan name, monthly usage bar, and upgrade/manage CTA. |
| `src/app/(app)/discover/page.tsx` | Verified completely free & ungated; no changes needed to TheMealDB integration. |

---

## 5. Verification Method

To independently verify all findings and confirm the codebase integrity:

1. **Verify Existing Test Suite Passing**:
   ```bash
   npm test
   ```
   *Expected outcome*: 766 tests pass across all 22 test files with 0 failures.

2. **Verify TypeScript Compilation**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected outcome*: Zero type errors.

3. **Verify Next.js Production Build**:
   ```bash
   npm run build
   ```
   *Expected outcome*: Clean build with zero route or compile errors.

4. **Verify Firestore Security Rules**:
   Inspect `firestore.rules` lines 15–41 to confirm `/users/{userId}` has `allow read, write: if isOwner(userId);`, permitting user profile writes including usage counter and plan state.
