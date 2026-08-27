# Project: PlateUp

## Architecture & Tech Stack
- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui, Lucide Icons
- **Backend / APIs**: Next.js Route Handler (`/api/youtube-recipe`) powered by `youtubei.js`
- **Firebase Services**:
  - **Firebase Auth**: Email/Password + Google OAuth Popup
  - **Cloud Firestore**: Collections:
    - `users/{uid}` (profile, preferences, dietaryRestrictions, repeatWindowDays)
    - `users/{uid}/recipes/{id}` (recipe docs with ingredients, instructions, dietaryTags, rating, timesMade, notes)
    - `users/{uid}/mealPlans/{weekId}` (21 slots: 7 days x 3 meals)
    - `users/{uid}/cookingLog/{id}` (cooking history events)
    - `users/{uid}/shoppingList/current` (aggregated grocery items, checked states, custom items)
  - **Firebase AI Logic**: Gemini 2.5 Flash (`GoogleAIBackend`) for YouTube transcript extraction and multimodal photo recipe parsing with structured JSON schema
- **Design System**: Warm food aesthetic (terracotta orange / amber primary `oklch(0.62 0.21 42)`, warm cream / stone neutrals, responsive 375px mobile bottom nav + 1440px desktop header)

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---|---|---|---|
| F-01 | Build & Font Safety | Build succeeds in sandboxed/offline envs with system font fallbacks | M1 | Survey |
| F-02 | Email/Password Registration | Creates account in Firebase Auth and profile in Firestore | M1 | Survey / R1 |
| F-03 | Email/Password Sign-In | Authenticates existing user and redirects to `/dashboard` | M1 | Survey / R1 |
| F-04 | Google OAuth Popup | Popup auth with Google provider and profile creation | M1 | Survey / R1 |
| F-05 | Route Protection Guard | `AuthGuard` routes unauthenticated users to `/login` with redirect intent | M1 | Survey / R1 |
| F-06 | YouTube Metadata & Transcript API | Server Route Handler fetching metadata & captions via `youtubei.js` | M1 | Survey / R1 |
| F-07 | YouTube AI Recipe Parser | Gemini 2.5 Flash structured recipe extraction from transcript | M1 | Survey / R1 |
| F-08 | Photo AI Recipe Extractor | Multimodal vision recipe extraction from uploaded dish image | M1 | Survey / R1 |
| F-09 | Tab Query Param Support | `?tab=photo` opens Photo tab on `/extract` | M1 | Survey / R1 |
| F-10 | Recipe Persistence | Saves extracted recipe with thumbnail to Firestore `users/{uid}/recipes` | M1 | Survey / R1 |
| F-11 | 1-5 Star Rating System | User can rate recipes from 1 to 5 stars; persists to Firestore | M1 | Survey / R1 |
| F-12 | "I Made This" Cook Tracker | Increments cook count and logs record to cooking history | M1 | Survey / R1 |
| F-13 | Recipe Notes Auto-save | Custom notes with auto-save on blur | M1 | Survey / R1 |
| F-14 | In-Recipe Ingredient Checklist | Interactive ingredient checkboxes while cooking | M1 | Survey / R1 |
| F-15 | Recipe Deletion Modal | Deletes recipe document with confirmation modal | M1 | Survey / R1 |
| F-16 | Recipe Search & Sort | Search by text, sort by Newest, Rating, Most Made, Recent | M1 | Survey / R1 |
| F-17 | 7x3 Weekly Planner Grid | 7 days (Mon-Sun) × 3 meal times (Breakfast, Lunch, Dinner) | M1 | Survey / R1 |
| F-18 | ISO Week Navigation | Navigates across calendar weeks with accurate ISO year calculations | M1 | Survey / R1 |
| F-19 | Manual Slot Assignment | Recipe picker dialog to assign recipe to day/meal slot | M1 | Survey / R1 |
| F-20 | Meal Plan Slot Clearing | Removes individual slot or clears entire week | M1 | Survey / R1 |
| F-21 | Smart Auto-Fill Engine | Fills empty slots avoiding recent repeats & balancing variety | M1 | Survey / R1 |
| F-22 | Dashboard Today's Menu | Extracts today's 3 meals from active week meal plan | M1 | Survey / R1 |
| F-23 | Dashboard User Stats | Computes total recipes, meals planned this week, made this month | M1 | Survey / R1 |
| F-24 | Dashboard Recent Recipes | Displays top 5 recent recipes with thumbnail and source badges | M1 | Survey / R1 |
| F-25 | Warm Food Theming | Unified OKLCH orange/amber palette in `globals.css` | M2 | Survey / R2 |
| F-26 | Mobile-First Layout & Nav | 375px mobile bottom nav, no z-index collisions, safe-area padding | M2 | Survey / R2 |
| F-27 | Loading States & Skeletons | Skeleton screens on Dashboard, Recipes, Detail, Planner | M2 | Survey / R2 |
| F-28 | Actionable Empty States | Contextual illustrations and call-to-action buttons for empty states | M2 | Survey / R2 |
| F-29 | Mobile Day Selector | Segmented Day Tabs on `/meal-plan` for compact mobile viewing | M2 | Survey / R2 |
| F-30 | High-Converting Landing Page | Hero preview, social proof, feature cards, FAQ accordion | M2 | Survey / R2 |
| F-31 | Micro-Interactions & Feedback | Toast notifications and animated feedback on ratings, saves, cooks | M2 | Survey / R2 |
| F-32 | Shopping List Navigation | Accessible from desktop top Navbar and mobile bottom Navbar | M3 | Survey / R3 |
| F-33 | Meal Plan Grocery Aggregator | Extracts ingredients across all assigned meals in current plan | M3 | Survey / R3 |
| F-34 | Intelligent Ingredient Merger | Normalizes units, parses fractions, sums quantities, aliases duplicates | M3 | Survey / R3 |
| F-35 | Grocery Department Grouping | Categorizes ingredients into 8 store departments (Produce, Dairy, etc.) | M3 | Survey / R3 |
| F-36 | Interactive Check-off State | Check off items while shopping with strikethrough and Firestore sync | M3 | Survey / R3 |
| F-37 | Custom Shopping List Items | Add, edit, and delete manual grocery items | M3 | Survey / R3 |
| F-38 | Dietary Preferences Profile UI | User can configure dietary restrictions (Vegetarian, Vegan, Keto, etc.) | M4 | Survey / R4 |
| F-39 | AI Extraction Auto-Tagging | Prompts Gemini to detect and assign standard dietary tags | M4 | Survey / R4 |
| F-40 | Dietary Recipe Filter & Auto-Fill | Recipe library filter pills & dietary-compliant meal plan auto-fill | M4 | Survey / R4 |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| M1 | Core Bug Fixes, Type Safety & Auth/Data Flow | F-01 to F-24 bug fixes (Photo thumbnail, `?tab=photo`, mobile z-index collision, mobile user nav, ESLint fixes, Firestore rules for shoppingList, build font safety) | none | DONE |
| M2 | UI Polish, Theming, Skeletons & Mobile Responsiveness | F-25 to F-31 (warm orange/amber palette, skeleton loaders, mobile day switcher on meal plan, landing page overhaul, login UX polish, container padding) | M1 | DONE |
| M3 | Shopping List Feature | F-32 to F-37 (ingredient aggregation & unit math engine, Firestore hook, `/shopping-list` page, checklist persistence, Navbar links, "Add to List" on detail) | M1, M2 | DONE |
| M4 | Dietary Preferences & Smart Filtering | F-38 to F-40 (`/profile` settings page, dietary taxonomy, Gemini AI prompt auto-tagging, `/recipes` filter chips, dietary-compliant `meal-planner.ts` auto-fill) | M1, M2 | DONE |
| M5 | E2E Verification & Adversarial Hardening | Pass 100% of E2E Test Suite (Tiers 1-4) + Tier 5 Adversarial Coverage Hardening with Challenger | M1, M2, M3, M4, E2E Test Track | DONE |

---

## Interface Contracts & Data Models
- Fully established in `src/types/index.ts`, `src/lib/dietary.ts`, `src/lib/ingredient-parser.ts`, `src/lib/shopping-aggregator.ts`, and `src/lib/meal-planner.ts`.
