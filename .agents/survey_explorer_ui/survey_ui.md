# PlateUp UI/UX, Styling & Design System Survey Report

**Author**: Explorer Subagent (UI/UX & Design System Auditor)  
**Date**: 2026-08-27  
**Project**: PlateUp (AI Recipe & Smart Meal Planner)  
**Target Requirements**: R2 (UI Polish, Mobile-First, Warm Theming, Responsive Layout, Loading/Empty States, Conversion Landing, Auth States), R3 (Shopping List Navigation & UI), R4 (Dietary Preferences & Filter UI).

---

## Executive Summary

A comprehensive architectural and visual audit of PlateUp was performed across all routes, UI components, styling foundations, responsive viewports (375px mobile and 1440px desktop), and state handling patterns.

While the fundamental functionality and component structure exist, the application currently suffers from:
1. **Design System & Theme Inconsistency**: Tailwind v4 theme variables in `globals.css` set `--primary` to neutral black (`oklch(0.205 0 0)`), forcing individual pages to manually patch ad-hoc classes (`bg-orange-600`, `text-amber-600`, `bg-rose-50`, `bg-blue-50`) resulting in a visual clash between standard black UI primitives (buttons, badges) and orange brand accents.
2. **Critical Mobile Viewport Collisions**: On the Recipe Detail page (`/recipes/[id]`), a fixed bottom action bar collides directly with the fixed mobile bottom navigation bar (`Navbar.tsx`), rendering buttons inaccessible or overlapping on 375px mobile screens.
3. **Missing Core Features & Pages (R3 & R4)**: No Shopping List page (`/shopping-list`) or navigation link exists; no Dietary Preferences settings page (`/profile` or `/settings`) exists; no dietary category filter chips exist on the Recipes collection page.
4. **Sub-optimal Mobile Meal Planning UX**: The weekly meal planner displays 21 cards stacked in a single vertical list on mobile, requiring excessive scrolling instead of a mobile day-selector / carousel tab view.
5. **Absence of Skeleton Screens & Transition Polish**: All async states rely on single pulsing icons or spinning loaders on blank backgrounds, causing noticeable layout shifts (CLS) on data load.
6. **Font Build Failure in Sandbox/Offline**: `next/font/google` in `layout.tsx` fails during `next build` due to blocked external Google Fonts requests.

---

## 1. Styling Setup & Design System Audit

### 1.1 CSS Tokens & Tailwind CSS v4 Configuration (`src/app/globals.css`)
- **Theme Variables**:
  - `--primary: oklch(0.205 0 0)` — Neutral black/charcoal.
  - `--primary-foreground: oklch(0.985 0 0)` — Pure white.
  - `--secondary: oklch(0.97 0 0)` — Light gray.
  - `--accent: oklch(0.97 0 0)` — Light gray.
  - `--ring: oklch(0.708 0 0)` — Neutral gray.
- **Problem**: The app is specified to have a warm, appetizing food app aesthetic (orange/amber palette, warm stone/cream background). Because `--primary` is charcoal black, all base shadcn components (`<Button>`, `<Badge>`, tabs, dialog buttons) default to black unless individually overridden.
- **Resolution**:
  - Update `--primary` to warm food orange/amber: e.g., `oklch(0.62 0.21 42)` (vibrant burnt orange/terracotta) with high-contrast foreground.
  - Update `--secondary` to warm cream/amber: e.g., `oklch(0.96 0.03 75)`.
  - Update `--accent` and `--ring` to complementary warm amber tones.
  - Define warm dark mode tokens for cohesive theme support.

### 1.2 Font Configuration & Build Integrity (`src/app/layout.tsx`)
- **Observation**: Lines 2, 7-15 of `src/app/layout.tsx` use `import { Geist, Geist_Mono } from 'next/font/google'`.
- **Build Failure**: Running `npm run build` throws Turbopack error: `Failed to fetch Geist from Google Fonts` because network font requests are blocked or offline in sandboxed environments.
- **Resolution**: Replace Google Font network fetching with clean system/modern font stacks (`system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`) or local font variables defined in CSS.

### 1.3 Missing CSS Animations
- **Observation**: `src/app/login/page.tsx` references `animate-blob` and `animation-delay-2000` / `animation-delay-4000`. These are undefined in Tailwind v4 and produce no animation.
- **Resolution**: Define smooth ambient gradient blob keyframes in `globals.css` or replace with CSS-based decorative warm radial gradients.

---

## 2. Page-by-Page UI/UX Audit

| Route / Page | Current State | Responsive Behavior (375px / 1440px) | Loading / Empty / Error States | Gaps & Action Items |
| :--- | :--- | :--- | :--- | :--- |
| **Landing Page** (`/`) | Hero with bouncing emoji row, 3 basic feature cards, simple footer. | 1440px: clean but sparse. 375px: emoji flex container wraps tightly. | N/A (static) | Lacks conversion elements: interactive UI mockup/preview, social proof / testimonials, dietary & shopping list feature callouts, FAQ accordion, sticky CTA. |
| **Login / Auth** (`/login`) | Dual tabs for Sign In / Sign Up, Google auth button, error mapping helper. | Works well on both viewports (`max-w-md` centered). | Loading replaces card with full-screen spinner on orange tint. | Missing password visibility toggle, client validation feedback, deep-link redirect preservation. Fix undefined `animate-blob`. |
| **Dashboard** (`/dashboard`) | 3 Quick Action cards, Today's Menu (3 meals), Recently Added (5 items), 3 Stats cards. | 1440px: 3-column layout. 375px: **Lacks `px-4`**, causing cards to bleed to the edge. Quick actions take excessive vertical height. | Loading: single centered spinner. Empty states: plain dashed boxes. | Add container padding (`px-4 sm:px-6`). Use skeleton cards for menu & recent recipes. Unify stats cards into warm orange/amber palette. Add quick access to Shopping List and Dietary settings. |
| **Recipe Extraction** (`/extract`) | YouTube URL tab with video preview; Photo / Camera upload tab; `RecipePreview` card with Save button. | 1440px: max-w-4xl centered. 375px: responsive single-column form & preview. | Extraction shows pulsing icon. Save shows spinner. | Add step-by-step extraction progress indicator (e.g. Transcribing → Analyzing → Formatting). In `RecipePreview`, highlight dietary tags (Vegetarian, Gluten-Free, etc.) and add serving scaler. |
| **Recipe Collection** (`/recipes`) | Search bar, Sort dropdown, 3-column card grid with ratings and tags. | 1440px: 3 columns. 375px: single column with responsive thumbnail. | Loading: pulsing chef hat. Empty: simple dashed card. Error: raw text string. | **Critical R4 Gap**: Missing dietary category filter chips (All, Vegetarian, Vegan, Keto, Gluten-Free, Dairy-Free, Quick <30min). Replace pulsing icon with 6-card skeleton grid. Add retry button on error. |
| **Recipe Detail** (`/recipes/[id]`) | Hero image, 5-star rating, 4 metric cards, interactive ingredient checkboxes, auto-saving notes, instructions list, delete dialog, "I Made This!" button. | 1440px: 2-column hero + 3-column content. 375px: **CRITICAL BUG** - fixed bottom action bar collides with mobile bottom navigation bar. | Loading: spinner in blank 50vh. Not found: plain box. | **Fix fixed-bottom collision**: adjust bottom padding and positioning on mobile above bottom nav or embed actions in layout flow. Add celebratory toast on "I Made This!" and rating. Add "Add to Shopping List" button. |
| **Meal Planner** (`/meal-plan`) | Week navigation, 7-day × 3-meal grid, auto-fill button, clear all button, recipe picker dialog. | 1440px: 7 columns (tight on 1024px-1200px screens). 375px: **21 stacked cards** requiring massive scroll. | Loading: spinner. Recipe picker: search filter. | **Mobile Optimization**: Add segmented Day Selector / Tab Switcher on mobile. **Critical R3 Gap**: Add "Generate Shopping List" button. **Critical R4 Gap**: Add dietary preference filtering in recipe picker & auto-fill. Add confirmation on "Clear All". |
| **Shopping List** (`/shopping-list`) | **DOES NOT EXIST** (Missing route). | N/A | N/A | **Implement full page (R3)**: Link in Navbar, aggregate ingredients from active meal plan, smart quantity deduplication, interactive check-off with persistence, category grouping, custom item input. |
| **Profile / Settings** (`/profile`) | **DOES NOT EXIST** (Missing route). | N/A | N/A | **Implement full page (R4)**: Dietary preferences checkboxes/toggles (Vegetarian, Vegan, Keto, Gluten-Free, Dairy-Free, etc.), meal plan repeat window slider, meals per day toggles, user profile display, mobile logout. |

---

## 3. Navigation & Layout Hierarchy Audit (`src/components/layout/Navbar.tsx` & `AppLayout.tsx`)

1. **Desktop Navigation (`md:flex`)**:
   - Header with Logo, Navigation Links (`Home`, `Extract`, `Recipes`, `Meal Plan`), and User Avatar Dropdown.
   - **Missing**: "Shopping List" navigation link (R3 requirement).
   - **Missing**: "Profile / Settings" link in Avatar dropdown (R4 requirement).
2. **Mobile Navigation (`md:hidden`)**:
   - Fixed bottom navigation bar with 4 items: `Home`, `Extract`, `Recipes`, `Meal Plan`.
   - **Missing**: "Shopping List" navigation tab. (5 bottom tabs: Home, Extract, Recipes, Plan, List or Profile fit standard mobile ergonomics with 44px+ tap targets).
   - **Missing**: Mobile access to Profile/Settings and Sign Out (desktop avatar dropdown is hidden on mobile).
3. **Content Padding in `AppLayout`**:
   - `AppLayout` has `<main className="flex-1 pb-20 md:pb-8">` but lacks consistent horizontal container constraints (`px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto`), resulting in inconsistent padding across pages.

---

## 4. Responsive Design & Layout Shift Audit (375px Mobile vs 1440px Desktop)

### 4.1 Mobile Viewport (375px width):
- **Collision Issue**: `src/app/(app)/recipes/[id]/page.tsx` line 270:
  ```tsx
  <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t z-10 sm:relative ...">
  ```
  This overlaps `Navbar.tsx` (`fixed bottom-0 left-0 right-0 z-50 h-16`), completely obstructing user interaction on mobile devices.
- **Edge Bleed on Dashboard**: `DashboardPage` has `className="max-w-5xl mx-auto space-y-10 pb-12"` without horizontal padding, causing cards and headers to press directly against mobile screen edges.
- **21-Card Stack in Meal Planner**: Stacking 7 days × 3 meals vertically requires over 3,000px of mobile scroll. A tabbed/swipeable Day Selector (e.g. Mon | Tue | Wed | Thu | Fri | Sat | Sun) dramatically improves mobile usability.

### 4.2 Desktop Viewport (1440px width):
- Meal planner 7-column grid displays cleanly on 1440px, but columns become cramped (~120px) on 1024px-1200px viewports. A flexible grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-7`) or horizontal scroll wrapper ensures readability across all desktop resolutions.

---

## 5. State Handling & Micro-Interactions Audit

### 5.1 Skeleton Screens vs. Spinners
Currently, pages use blocking spinners:
- Dashboard: `<Loader2 className="w-8 h-8 animate-spin text-amber-500" />`
- Recipes: `<ChefHat className="w-8 h-8 animate-pulse" />`
- Recipe Detail: `<Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />`
- Meal Plan: `<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />`

**Requirement**: Replace these with dedicated Skeleton components:
- `RecipeCardSkeleton` for recipe grids.
- `DashboardSkeleton` with placeholder stats and menu cards.
- `MealPlanSkeleton` with 7-column placeholder cards.
- `RecipeDetailSkeleton` with hero and ingredient placeholders.
This eliminates Flash of Unstyled Content (FOUC) and Cumulative Layout Shift (CLS).

### 5.2 Micro-Interactions & Feedback
- **Rating Recipes**: Clicking stars should trigger a subtle scale bounce and a toast notification ("Rating updated to X stars").
- **"I Made This!" Button**: Should show celebration feedback (toast or confetti micro-interaction) and increment times made.
- **Recipe Extraction**: Show animated multi-step progress status during AI processing.
- **Shopping List Item Check-off**: Smooth strikethrough animation with immediate visual check.

---

## 6. Gap Analysis & Detailed Remediation Plan

### Requirement R2: Modern, Mobile-First UI & Warm Palette
1. **Design Tokens (`globals.css`)**:
   - Reconfigure `--primary` to warm food orange (`oklch(0.62 0.21 42)` / `#ea580c`), `--primary-foreground` to white, and warm amber/stone neutral backgrounds.
2. **Landing Page Overhaul (`src/app/page.tsx`)**:
   - Modernize hero with high-converting copy, interactive feature preview cards, social proof badges, feature showcase (AI extraction, smart meal planner, shopping list, dietary tags), and FAQ accordion.
3. **Auth Experience (`src/app/login/page.tsx`)**:
   - Add password visibility toggle, inline input validation, seamless card loading state, and remove dead animation classes.
4. **Mobile Layout Fixes**:
   - Fix Recipe Detail fixed-bottom action bar collision with mobile navbar.
   - Implement mobile Day Tabs on Meal Planner.
   - Ensure all page wrappers have proper `px-4 sm:px-6` mobile padding.
5. **Skeleton Screens & Polish**:
   - Create skeleton loader primitives and integrate into Dashboard, Recipes, Detail, and Meal Planner.
   - Add toast micro-feedback for ratings, saves, and cook logs.

### Requirement R3: Shopping List Feature (UI Perspective)
1. Add "Shopping List" to Desktop top Navbar and Mobile bottom Navbar.
2. Build dedicated `/shopping-list` page with:
   - "Generate from Meal Plan" CTA.
   - Grouped ingredient categories (Produce, Pantry, Dairy, Meat/Protein, Spices/Baking, Other).
   - Combined duplicate ingredient quantities (e.g. 2 onions + 1 onion = 3 onions).
   - Interactive checkbox state with Firestore/local storage persistence.
   - Add custom item form and Clear Checked button.
3. Add "Add to Shopping List" action button on Recipe Detail page.

### Requirement R4: Dietary Preferences & Filtering (UI Perspective)
1. Build `/profile` or `/settings` page for dietary preferences:
   - Dietary tag toggles: Vegetarian, Vegan, Keto, Gluten-Free, Dairy-Free, Nut-Free, Low-Carb, Pescatarian.
   - Meal planning preferences: Repeat window days (slider: 1-14 days), meals per day selector.
2. Add Dietary category filter chips on `/recipes` page (All, Vegetarian, Vegan, Keto, Gluten-Free, Dairy-Free).
3. Add dietary tag badges on Recipe cards and Recipe detail pages with distinct icons and colors.
4. Add dietary preference awareness indicator on Meal Planner auto-fill and recipe picker dialog.

---

## 7. Verification & Implementation Roadmap

| Priority | Task | Affected Files | Expected Outcome |
| :--- | :--- | :--- | :--- |
| **P0** | Fix Google Font build failure | `src/app/layout.tsx` | `npm run build` succeeds with zero errors in sandbox/offline. |
| **P0** | Update CSS theme variables to warm orange/amber palette | `src/app/globals.css` | Cohesive warm food app styling across all shadcn components. |
| **P0** | Fix Recipe Detail mobile bottom bar collision | `src/app/(app)/recipes/[id]/page.tsx` | Clean mobile UX without overlapping action buttons. |
| **P1** | Add Shopping List page & Navbar integration (R3) | `src/app/(app)/shopping-list/page.tsx`, `Navbar.tsx` | Shopping list accessible from nav, generates from meal plan, persists checks. |
| **P1** | Add Dietary Preferences settings page & filters (R4) | `src/app/(app)/profile/page.tsx`, `recipes/page.tsx`, `Navbar.tsx` | Dietary preferences configurable and filterable on collection. |
| **P1** | Overhaul Landing Page to high-converting UI | `src/app/page.tsx` | Premium conversion-focused landing page with preview and social proof. |
| **P2** | Add Skeleton Screens across all pages | `src/components/ui/skeleton.tsx`, all `page.tsx` files | Zero layout shift (CLS) during data fetching. |
| **P2** | Implement Mobile Day Switcher on Meal Planner | `src/app/(app)/meal-plan/page.tsx` | Smooth mobile meal planning without excessive vertical scrolling. |
| **P2** | Polish micro-interactions & feedback toasts | Recipe Detail, Auth, Extraction, Meal Plan | Polished feedback on rating, saving, and meal assignment. |
