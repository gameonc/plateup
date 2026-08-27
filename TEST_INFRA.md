# E2E Test Infra: PlateUp

## Test Philosophy
- **Opaque-box & Requirement-driven**: Derived directly from `ORIGINAL_REQUEST.md` (R1-R4) and user-facing contracts.
- **Methodology**: Systematic 4-tier testing hierarchy (Category-Partition, Boundary Value Analysis, Pairwise Combinations, Real-World Workload Scenarios) + Tier 5 Adversarial Coverage Hardening.

---

## Feature Inventory & Test Matrix
| # | Feature | Requirements Source | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---|---|:---:|:---:|:---:|:---:|
| F-01 | Build & Type Safety | R1, AC-Build | 5 | 5 | ✓ | ✓ |
| F-02 | Auth Sign-Up (Email/Password) | R1, AC-Auth | 5 | 5 | ✓ | ✓ |
| F-03 | Auth Sign-In (Email/Password) | R1, AC-Auth | 5 | 5 | ✓ | ✓ |
| F-04 | Google OAuth Popup Flow | R1, AC-Auth | 5 | 5 | ✓ | ✓ |
| F-05 | Private Route Guard & Redirect | R1, AC-Auth | 5 | 5 | ✓ | ✓ |
| F-06 | YouTube Metadata / Caption Extraction | R1, AC-Extract | 5 | 5 | ✓ | ✓ |
| F-07 | Gemini YouTube Recipe Parsing | R1, AC-Extract | 5 | 5 | ✓ | ✓ |
| F-08 | Photo / Vision AI Recipe Parsing | R1, AC-Extract | 5 | 5 | ✓ | ✓ |
| F-09 | Extract Tab Navigation Query | R1, AC-Extract | 5 | 5 | ✓ | ✓ |
| F-10 | Recipe Persistence to Firestore | R1, AC-Recipe | 5 | 5 | ✓ | ✓ |
| F-11 | 1-5 Star Recipe Rating System | R1, AC-Rating | 5 | 5 | ✓ | ✓ |
| F-12 | "I Made This" Cook Tracker | R1, AC-Cook | 5 | 5 | ✓ | ✓ |
| F-13 | Recipe Notes Live Auto-save | R1, AC-Recipe | 5 | 5 | ✓ | ✓ |
| F-14 | In-Recipe Ingredient Checklist | R1, AC-Recipe | 5 | 5 | ✓ | ✓ |
| F-15 | Recipe Deletion & Modal | R1, AC-Recipe | 5 | 5 | ✓ | ✓ |
| F-16 | Recipe Search & Sorting | R1, AC-Recipe | 5 | 5 | ✓ | ✓ |
| F-17 | 7x3 Weekly Planner Display | R1, AC-Plan | 5 | 5 | ✓ | ✓ |
| F-18 | ISO Week Navigation | R1, AC-Plan | 5 | 5 | ✓ | ✓ |
| F-19 | Manual Slot Assignment | R1, AC-Plan | 5 | 5 | ✓ | ✓ |
| F-20 | Slot Clearing & Clear All | R1, AC-Plan | 5 | 5 | ✓ | ✓ |
| F-21 | Smart Auto-Fill Planner | R1, AC-Plan | 5 | 5 | ✓ | ✓ |
| F-22 | Dashboard Today's Menu Live View | R1, AC-Dash | 5 | 5 | ✓ | ✓ |
| F-23 | Dashboard User Statistics | R1, AC-Dash | 5 | 5 | ✓ | ✓ |
| F-24 | Dashboard Recent Recipes | R1, AC-Dash | 5 | 5 | ✓ | ✓ |
| F-25 | Warm Amber/Orange Theme Tokens | R2, AC-UI | 5 | 5 | ✓ | ✓ |
| F-26 | Mobile-First Bottom Nav (375px) | R2, AC-Mobile | 5 | 5 | ✓ | ✓ |
| F-27 | Loading States & Skeletons | R2, AC-UI | 5 | 5 | ✓ | ✓ |
| F-28 | Contextual Empty States & CTAs | R2, AC-UI | 5 | 5 | ✓ | ✓ |
| F-29 | Mobile Day Selector on Meal Plan | R2, AC-Mobile | 5 | 5 | ✓ | ✓ |
| F-30 | High-Converting Landing Page | R2, AC-Landing | 5 | 5 | ✓ | ✓ |
| F-31 | Micro-Interactions & Feedback | R2, AC-UI | 5 | 5 | ✓ | ✓ |
| F-32 | Shopping List Navigation Link | R3, AC-Shop | 5 | 5 | ✓ | ✓ |
| F-33 | Meal Plan Grocery Aggregation | R3, AC-Shop | 5 | 5 | ✓ | ✓ |
| F-34 | Intelligent Ingredient Merger / Math | R3, AC-Shop | 5 | 5 | ✓ | ✓ |
| F-35 | Grocery Department Grouping (8 Cats) | R3, AC-Shop | 5 | 5 | ✓ | ✓ |
| F-36 | Interactive Item Check-off & Sync | R3, AC-Shop | 5 | 5 | ✓ | ✓ |
| F-37 | Custom Shopping List Items | R3, AC-Shop | 5 | 5 | ✓ | ✓ |
| F-38 | Profile Dietary Preferences UI | R4, AC-Diet | 5 | 5 | ✓ | ✓ |
| F-39 | AI Extraction Dietary Auto-Tagging | R4, AC-Diet | 5 | 5 | ✓ | ✓ |
| F-40 | Dietary Recipe Filter & Auto-Fill | R4, AC-Diet | 5 | 5 | ✓ | ✓ |

---

## Test Architecture
- **Test Runner**: Node.js / Vitest / Jest test harness executing unit, integration, and end-to-end user scenario tests.
- **Test Suites Location**: `tests/`
  - `tests/unit/` (Ingredient unit math, fraction parser, aggregator, meal planner auto-fill algorithm, dietary filters)
  - `tests/integration/` (Firebase auth flows, Firestore data hooks, recipe CRUD, shopping list persistence, ISO week math)
  - `tests/e2e/` (Full user journey scenarios: User signup -> YouTube/Photo extract -> Save -> Rate -> Plan -> Shopping List generate -> Check off items -> Profile dietary update -> Filter recipes -> Auto-fill meal plan)
- **Invocation Command**: `npm test` or `npx vitest run` or custom test runner script.

---

## Real-World Application Scenarios (Tier 4)
1. **Scenario 1: From YouTube Video to Cooked Meal & Grocery Run**
   - User signs up -> extracts pasta recipe from YouTube URL -> saves recipe -> adds to Wednesday Dinner -> generates shopping list -> checks off olive oil and garlic -> rates recipe 5 stars and clicks "I Made This!".
2. **Scenario 2: Photo Recipe & Weekly Family Meal Plan with Duplicate Ingredient Summing**
   - User uploads photo of grandma's stew -> extracts recipe with custom tags -> assigns to Monday Dinner and Friday Dinner -> auto-fills remaining slots -> verifies shopping list sums "2 lbs beef" + "1.5 lbs beef" to "3.5 lbs beef" under Meat department.
3. **Scenario 3: Strict Vegan / Gluten-Free Lifestyle Transition**
   - User updates profile preferences to `vegan` and `gluten-free` -> verifies recipe library filter displays only compliant recipes -> runs meal planner auto-fill -> verifies all 21 generated slots strictly satisfy vegan and gluten-free tags.
4. **Scenario 4: Mobile On-The-Go Grocery Shopping**
   - Mobile user (375px) navigates to `/meal-plan` using mobile day selector -> jumps to `/shopping-list` via bottom navbar -> adds custom item "Sponges" -> checks off produce items in aisle order -> verifies checked items persist on page reload.
5. **Scenario 5: High-Frequency Cook History & Recipe Management**
   - User searches recipes by keyword -> sorts by "Most Made" -> edits recipe notes -> verifies live auto-save -> logs multiple cook events -> verifies dashboard cooking stats update in real time.

---

## Coverage Thresholds
- **Tier 1 (Feature Coverage)**: ≥ 200 test cases
- **Tier 2 (Boundary & Corner Cases)**: ≥ 200 test cases
- **Tier 3 (Pairwise Interactions)**: ≥ 40 cross-feature tests
- **Tier 4 (Real-World Scenarios)**: ≥ 5 comprehensive end-to-end scenarios
- **Tier 5 (Adversarial White-Box Hardening)**: Target 0 gaps discovered by Challenger
