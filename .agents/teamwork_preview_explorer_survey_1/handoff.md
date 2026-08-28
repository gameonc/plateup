# Frontend & UI Architecture Investigation Report: PlateUp Monetization Features

## 1. Observation

### 1.1 Routing Architecture & Directory Layout
The application uses **Next.js 15 App Router** with React 19, TypeScript, Tailwind CSS v4, Base UI primitives (`@base-ui/react`), and Lucide icons (`lucide-react`).

The routing structure in `src/app/` is mapped as follows:
- `src/app/layout.tsx`: Root Layout providing `AuthProvider` from `@/hooks/useAuth` and `Toaster` from `@/components/ui/toast`.
- `src/app/page.tsx`: Public Landing Page with hero section, recipe extraction preview mockup, dietary features, FAQ accordion, header with Auth links, and footer.
- `src/app/login/page.tsx`: Auth Page with tabbed Sign In / Sign Up, Google OAuth popup trigger, and error handling with `redirect` search parameter preservation.
- `src/app/(app)/layout.tsx`: Authenticated App Layout wrapping children with `AuthGuard` and rendering `<Navbar />`. Includes `main.flex-1 pb-20 md:pb-8` to accommodate the mobile bottom nav.
- `src/app/(app)/dashboard/page.tsx`: Dashboard displaying quick actions (YouTube Extract, Photo Extract, Browse Recipes), Today's 3 Planned Meals, Recent Recipes, and User Cooking/Planning Stats.
- `src/app/(app)/extract/page.tsx`: Recipe Extraction UI with YouTube URL and Photo/Camera tabs, extraction animation, and `<RecipePreview />`.
- `src/app/(app)/discover/page.tsx`: TheMealDB Recipe Discovery with search, category filtering, "Surprise Me" randomizer, and direct saving to Firestore recipe collection (completely free / external API).
- `src/app/(app)/recipes/page.tsx`: Recipe Collection Library with text search, sorting (Newest, Highest Rated, Most Made, Recently Made), and interactive dietary filter pills (All, Matches My Preferences, Quick <30m, Vegetarian, Vegan, Keto, etc.).
- `src/app/(app)/recipes/[id]/page.tsx`: Recipe Detail Page with hero thumbnail, prep/cook metrics, star rating (1-5), dietary badges, interactive ingredient checklist, auto-saving notes textarea, "+ List" (Add to shopping list), and "I Made This!" cook logger.
- `src/app/(app)/meal-plan/page.tsx`: 7-day × 3-meal Planning Calendar (desktop grid + mobile segmented day selector), auto-fill engine respecting dietary restrictions and repeat windows, slot removal, and recipe picker modal.
- `src/app/(app)/shopping-list/page.tsx`: Aggregated Grocery Shopping List grouped into 8 supermarket departments, week switcher, checklist toggle with strikethrough, manual item dialog, and "Generate from Plan" button.
- `src/app/(app)/profile/page.tsx`: User Profile & Settings page with Display Name input, email display, dietary restriction checkboxes (8 standard options), repeat window slider (1-14 days), and planned meal slot selectors.
- `src/app/api/youtube-recipe/route.ts`: Next.js Route Handler extracting YouTube metadata and captions using `youtubei.js`.

### 1.2 UI Components & Design System Inventory
The design system is based on warm food tones (terracotta orange / amber `oklch(0.62 0.21 42)` primary, warm cream `stone-50` background, and `stone-900` text).

Component inventory in `src/components/ui/`:
1. `src/components/ui/button.tsx`: Exports `Button`, `buttonVariants` (`variant`: `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`; `size`: `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`).
2. `src/components/ui/badge.tsx`: Exports `Badge`, `badgeVariants` (`variant`: `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`).
3. `src/components/ui/card.tsx`: Exports `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
4. `src/components/ui/avatar.tsx`: Exports `Avatar`, `AvatarImage`, `AvatarFallback`, `AvatarGroup`, `AvatarGroupCount`, `AvatarBadge`.
5. `src/components/ui/dialog.tsx`: Exports `Dialog`, `DialogTrigger`, `DialogPortal`, `DialogClose`, `DialogOverlay`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`.
6. `src/components/ui/dropdown-menu.tsx`: Exports `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuGroup`, `DropdownMenuSub`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`.
7. `src/components/ui/input.tsx`: Exports `Input`.
8. `src/components/ui/label.tsx`: Exports `Label`.
9. `src/components/ui/select.tsx`: Exports `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`, `SelectGroup`, `SelectLabel`, `SelectSeparator`.
10. `src/components/ui/separator.tsx`: Exports `Separator`.
11. `src/components/ui/skeleton.tsx`: Exports `Skeleton`, `DashboardSkeleton`, `RecipeGridSkeleton`, `RecipeDetailSkeleton`, `MealPlanSkeleton`.
12. `src/components/ui/tabs.tsx`: Exports `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`.
13. `src/components/ui/textarea.tsx`: Exports `Textarea`.
14. `src/components/ui/toast.tsx`: Exports `Toaster`, `toast`, `useToastManager`, `createToastManager`.

Navigation & Layout components:
- `src/components/layout/Navbar.tsx`:
  - Desktop Navigation (`nav.hidden.md:flex`, lines 79-145): Left logo + link to `/dashboard`, Center navigation links (`/dashboard`, `/extract`, `/discover`, `/recipes`, `/meal-plan`, `/shopping-list`), Right user avatar dropdown menu (Profile link, Log out).
  - Mobile Top Header (`header.md:hidden`, lines 34-76): Logo + link to `/dashboard`, Right user avatar dropdown menu.
  - Mobile Bottom Bar (`nav.md:hidden.fixed.bottom-0`, lines 148-167): 6 nav icons with label (`Home`, `Extract`, `Discover`, `Recipes`, `Plan`, `Shop`).
- `src/components/auth/AuthGuard.tsx`: Intercepts unauthenticated users and redirects to `/login?redirect=<encodedPath>`.

Domain components:
- `src/components/recipe/RecipeCard.tsx`: Displays recipe card with thumbnail, prep/cook time, star rating, source badge, dietary pills, and links to `/recipes/${recipe.id}`. Exports `RecipeCard` and `getDietaryBadgeClass`.
- `src/components/recipe/RecipePreview.tsx`: Displays extracted recipe details before saving, with ingredient list, step-by-step instructions, and Save button.
- `src/components/shopping/AddItemDialog.tsx`: Dialog modal to create custom manual grocery items.

### 1.3 Shopping List & Recipe Detail Pages (Affiliate Integration Points)
1. **Shopping List Page (`src/app/(app)/shopping-list/page.tsx`)**:
   - Lines 67-79: Consumes `useShoppingList(currentWeekId)`, providing `items`, `uncheckedCount`, `checkedCount`, `addItem`, `toggleItemCheck`, `removeItem`, `clearCheckedItems`, `clearList`, `generateFromMealPlan`.
   - Lines 214-274: Action toolbar with `AddItemDialog`, `Generate from Plan` button, `Clear Done` button, and `Trash2` clear all dialog.
   - Lines 408-522: Renders grocery items partitioned by department (`Produce`, `Dairy`, `Meat/Seafood`, `Pantry`, `Spices/Seasonings`, `Bakery`, `Frozen`, `Other`).
   - Each item has `item.name`, `item.displayAmount` (`amount` + `unit`), `item.checked`, contributing `item.recipeTitles`.
   - **Integration Point**:
     - Add an **"Order Ingredients"** button in the Action Toolbar (or as an informative banner/card above the list).
     - The button can construct grocery search queries from active items (e.g. `items.filter(i => !i.checked).map(i => i.name)` or all items).
     - Provide support for partner links: **Amazon Fresh** (`https://www.amazon.com/s?k=${encodedQuery}&i=amazonfresh&tag=plateup-affiliate-20`) and **Instacart** (`https://www.instacart.com/store/search?query=${encodedQuery}&ref=plateup`).
     - Affiliate disclosure: place transparent disclosure text directly below the button/modal (`* Affiliate Link: PlateUp may earn a commission when you order through our grocery partners at no extra cost to you.`).

2. **Recipe Detail Page (`src/app/(app)/recipes/[id]/page.tsx`)**:
   - Lines 267-312: Left Column Ingredients Card rendering `recipe.ingredients` (with `item`, `amount`, `unit`) and header button `+ List` (`handleAddToList`).
   - Lines 356-412: Bottom action bar rendering `Delete Recipe`, `Add to Shopping List`, and `I Made This!`.
   - **Integration Point**:
     - In the Ingredients Card: Add an **"Order Ingredients"** button right next to `+ List` in the `CardHeader` or directly below the ingredient checklist.
     - In the Bottom Action Bar: Add "Order Ingredients" alongside "Add to Shopping List".
     - Clicking opens the partner grocery store URL with ingredient query strings pre-populated and affiliate tags.
     - Include affiliate disclosure subtitle: `* PlateUp earns referral commission from qualifying grocery partner purchases.`

### 1.4 Extract Page Implementation (Freemium Gate & Usage Display)
1. **Extract Page (`src/app/(app)/extract/page.tsx`)**:
   - Lines 30-32: Tabs for YouTube (`youtube`) and Photo/Camera (`photo`).
   - Lines 74-102: `handleExtractYoutube` invokes `extractRecipeFromYouTube(youtubeUrl)` from `@/lib/extract-recipe`.
   - Lines 119-146: `handleExtractImage` invokes `extractRecipeFromImage(base64Data, mimeType)` from `@/lib/extract-recipe`.
   - Lines 148-189: `handleSaveRecipe` adds recipe to Firestore via `addRecipe`.
   - Lines 209-429: Extraction forms with YouTube input and Photo upload/camera dropzone.
2. **Freemium Gate & Upgrade Prompt Integration**:
   - `useProfile()` or dedicated usage hook provides: `plan: 'free' | 'pro'`, `extractionsThisMonth: number` (0 to 5 for Free, unlimited for Pro), and `remainingExtractions` (`Math.max(0, 5 - extractionsThisMonth)`).
   - Usage Counter Banner: Display a prominent counter bar at the top of the Extract page (e.g. `Free Plan: 3 of 5 extractions remaining this month` with a subtle progress bar, or `✨ PlateUp Pro: Unlimited Extractions`).
   - Extraction Gate: When a Free user has `extractionsThisMonth >= 5`:
     - Replace or disable the "Extract Recipe" buttons on both YouTube and Photo tabs with a friendly upgrade prompt.
     - Render an encouraging card/banner:
       - Title: *"You've used all 5 free extractions this month!"*
       - Subtitle: *"Upgrade to PlateUp Pro for unlimited YouTube and Photo recipe extractions, or wait until your limit resets next month."*
       - Action: *"Unlock Unlimited Extractions ($4.99/mo)"* button linking to `/pricing`.
     - Non-punishing tone: Remind users they can still use the Discover tab (TheMealDB) and manually add recipes for free without limits.

### 1.5 Navbar, Landing & Profile Pages (Pro Badge, Pricing Links & Subscription Management)
1. **Navbar (`src/components/layout/Navbar.tsx`)**:
   - Current user avatar is rendered in:
     - Mobile header (lines 44-52)
     - Desktop top nav (lines 109-118)
   - When user has `plan === 'pro'`:
     - Render a golden crown icon `<Crown className="h-4 w-4 text-amber-500 fill-amber-500" />` or a `<Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-[10px] px-1.5 py-0.5 rounded-md shadow-xs">PRO</Badge>` next to the user's avatar/name in both desktop and mobile headers.
   - Pricing link:
     - Desktop nav items array (`navItems`, line 18) or as a dedicated "Go Pro / Pricing" button in the desktop top nav.
     - Mobile dropdown menu (line 60) and mobile bottom nav: add a "Pricing" link.
2. **Landing Page (`src/app/page.tsx`)**:
   - Header (line 66): Add a "Pricing" link between logo and Log In (`<Link href="/pricing">Pricing</Link>`).
   - Hero / FAQ / Footer (line 473): Add a "Pricing" link in the footer links.
3. **Profile Page (`src/app/(app)/profile/page.tsx`)**:
   - Currently contains:
     - Account Profile Card (lines 181-248): Display name, Email, Joined date.
     - Dietary Preferences Card (lines 251-337).
     - Smart Meal Planning Preferences Card (lines 339-431).
   - Subscription Management Integration:
     - Add a new **"Subscription & Membership" Card** (`Card`):
       - If `plan === 'pro'`:
         - Shows **PlateUp Pro Active** badge with crown icon.
         - Price: `$4.99 / month`.
         - Features unlocked: Unlimited AI Extractions, Priority Video Parsing, Meal Planning & Shopping.
         - Status: Active (Stripe Subscription ID snippet / test mode notice).
       - If `plan === 'free'` (or default):
         - Shows **Free Plan** badge.
         - Usage: `{extractionsThisMonth} / 5 AI Extractions used this month`.
         - Call-to-Action: *"Upgrade to Pro for $4.99/mo"* button leading to `/pricing`.

### 1.6 Pricing Page (`/pricing`) Architecture
- New route needed: `src/app/pricing/page.tsx` (accessible to both public guests and logged-in users, or wrapped with App Layout when logged in).
- Features comparison table between Free ($0/mo) and Pro ($4.99/mo):
  - AI Recipe Extractions (YouTube & Photo): 5/month vs Unlimited.
  - TheMealDB Recipe Discovery: Unlimited vs Unlimited.
  - Smart Meal Planning & Variety Engine: Included vs Included.
  - Smart Grocery Shopping Aggregator: Included vs Included.
  - Affiliate Grocery Ordering: Included vs Included.
  - Priority Processing & Pro Crown Badge: — vs Included.
- "Go Pro" button triggering Stripe Checkout session in test mode via Next.js API route (`/api/stripe/checkout`).

---

## 2. Logic Chain

1. **Routing & Component Alignment**:
   - Observation 1.1 shows that all in-app routes are nested under `src/app/(app)/` with `AuthGuard` and `Navbar`.
   - The `/pricing` route can either be a standalone page or nested, but making `/pricing` accessible to all users (both guests from the landing page and authenticated users from navbar/profile) aligns with Requirement R3 and R4.
2. **Data Flow & Firestore Schema**:
   - Observation 1.1 & 1.4 show that `UserProfile` in Firestore `users/{uid}` is the single source of truth for user preferences.
   - Extending `UserProfile` to include `plan?: 'free' | 'pro'`, `extractionsThisMonth?: number`, `extractionResetMonth?: string`, and `stripeSubscriptionId?: string` allows real-time synchronization across `useProfile()`, `Navbar.tsx`, `ExtractRecipePage`, `ProfilePage`, and `RecipeDetailPage`.
3. **Affiliate Link Mechanism**:
   - Observation 1.3 shows that both `ShoppingListPage` and `RecipeDetailPage` maintain lists of structured ingredient names (`item.name` or `ingredient.item`).
   - Constructing URL queries using standard affiliate search parameters (e.g. Amazon Fresh `https://www.amazon.com/s?k=...&i=amazonfresh&tag=...` or Instacart `https://www.instacart.com/store/search?query=...&ref=...`) satisfies Requirement R1 without disrupting existing CRUD and meal planning flows.
   - Displaying an explicit disclosure text next to the CTA adheres to FTC transparency standards and Requirement R1.
4. **Freemium AI Extraction Quota Enforcement**:
   - Observation 1.4 confirms that YouTube and Photo extractions happen in `ExtractRecipeContent` (`src/app/(app)/extract/page.tsx`).
   - Adding a monthly reset check (comparing `extractionResetMonth` e.g. `2026-08` with current month) ensures the 5 extractions reset automatically on the 1st of each calendar month.
   - If `plan === 'free'` and `extractionsThisMonth >= 5`, disabling the extraction form and showing the upgrade prompt satisfies Requirement R2.
   - Discover (`/discover`) uses TheMealDB directly via `lib/mealdb.ts` without touching `recipeModel`, naturally remaining unlimited and free.
5. **Pro Badge & Navigation Integration**:
   - Observation 1.2 and 1.5 show that `Navbar.tsx` already renders the user avatar using `useAuth()`.
   - By integrating `useProfile()` into `Navbar.tsx`, `profile?.plan === 'pro'` can conditionally render the Pro badge/crown on both desktop and mobile viewports, satisfying Requirement R4.

---

## 3. Caveats

- **Stripe Webhook vs Client Redirect**: In Stripe test mode, updating Firestore can happen via an API endpoint called upon successful checkout redirect or via a Stripe webhook route handler. The data model should support both `stripeSubscriptionId` and `plan: 'pro'`.
- **Month Formatting**: The monthly extraction count reset should use standard ISO month format (`YYYY-MM`, e.g. `2026-08`) to prevent timezone edge-case mismatches across users.
- **Affiliate Partner Selection**: Since both Amazon Fresh and Instacart are supported, the UI can either default to Amazon Fresh or allow users to choose their preferred grocery partner in a dropdown/dialog or settings.
- **Offline / Sandbox Test Mode**: All unit and build tests run in a mock/sandboxed environment; Stripe keys should default to dummy/mock values during build time so `npm run build` and `npx tsc --noEmit` succeed without network dependencies.

---

## 4. Conclusion

The PlateUp codebase is cleanly structured and well-modularized:
- **Routing**: Next.js 15 App Router with clear separation between public landing (`/`), auth (`/login`), and authenticated app routes (`/(app)/*`).
- **UI Components**: Modern shadcn/ui components built on `@base-ui/react` and Tailwind CSS v4, fully styled with an orange/amber food palette.
- **Shopping List & Recipe Details**: Ready for "Order Ingredients" affiliate CTAs with ingredient aggregation already in place in `useShoppingList` and `RecipeDetailPage`.
- **Extract Page**: Clean two-tab architecture (YouTube + Photo) ready for monthly quota tracking (5 free extractions/mo), remaining counter bar, and friendly upgrade prompt.
- **Navbar & Profile**: Avatar dropdown and profile settings ready for Pro crown badge, `/pricing` navigation links, and subscription management card.

All necessary extension points, file locations, component interfaces, and UI patterns have been surveyed and mapped in detail.

---

## 5. Verification Method

To independently verify this survey:
1. **TypeScript Type Safety**:
   ```bash
   npx tsc --noEmit
   ```
   (Expected: 0 errors)

2. **Existing Test Suite**:
   ```bash
   npm test
   ```
   (Expected: 22 test files, 766 tests pass, 0 failures)

3. **Inspect Key UI Files**:
   - Root & App Layouts: `src/app/layout.tsx`, `src/app/(app)/layout.tsx`
   - Navbar: `src/components/layout/Navbar.tsx`
   - Landing Page: `src/app/page.tsx`
   - Shopping List: `src/app/(app)/shopping-list/page.tsx`
   - Recipe Detail: `src/app/(app)/recipes/[id]/page.tsx`
   - Extract Page: `src/app/(app)/extract/page.tsx`
   - Profile Page: `src/app/(app)/profile/page.tsx`
   - Types: `src/types/index.ts`
   - Profile Hook: `src/hooks/useProfile.ts`

