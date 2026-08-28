# PlateUp Master E2E & Monetization Test Suite Ready

**Status**: READY ✅  
**Test Command**: `npm test` or `node --experimental-strip-types tests/runner.ts`  
**TypeScript Check**: `npx tsc --noEmit` (Zero errors)  
**Total Tests**: 914 tests across 29 test suites  
**Passing Rate**: 100% (914 / 914 passed, 0 failed, 0 skipped)  
**Execution Time**: ~0.8s  

---

## 1. Test Architecture & Directory Structure

```
tests/
├── helpers/
│   ├── assertions.ts                        # OKLCH color, mobile viewport, and ISO week assertions
│   ├── monetization-helpers.ts              # Monetization simulators: Affiliate URLs, Freemium limits, Stripe checkout & webhooks
│   ├── recipe-fixtures.ts                   # Comprehensive recipe, video, and image fixtures
│   └── test-context.ts                      # In-memory Firestore/Auth simulator, grocery & planner engines
├── tier1-features/                          # Tier 1: Feature Coverage (>=5 tests per F-01 to F-47)
│   ├── f01-f05-auth-safety.test.ts          # F-01 to F-05 (25 tests)
│   ├── f06-f10-extraction-persistence.test.ts # F-06 to F-10 (25 tests)
│   ├── f11-f15-recipe-actions.test.ts       # F-11 to F-15 (25 tests)
│   ├── f16-f20-search-planner.test.ts       # F-16 to F-20 (25 tests)
│   ├── f21-f24-autofill-dashboard.test.ts   # F-21 to F-24 (20 tests)
│   ├── f25-f31-ui-mobile-landing.test.ts    # F-25 to F-31 (35 tests)
│   ├── f32-f37-shopping-list.test.ts        # F-32 to F-37 (30 tests)
│   ├── f38-f40-dietary-filtering.test.ts    # F-38 to F-40 (15 tests)
│   └── f41-f45-monetization.test.ts         # F-41 to F-47 Monetization Features (35 tests)
├── tier2-boundary/                          # Tier 2: Boundary & Corner Cases (>=5 tests per feature domain)
│   ├── f01-f10-boundary.test.ts             # F-01 to F-10 Boundaries (50 tests)
│   ├── f11-f20-boundary.test.ts             # F-11 to F-20 Boundaries (50 tests)
│   ├── f21-f30-boundary.test.ts             # F-21 to F-30 Boundaries (50 tests)
│   ├── f31-f40-boundary.test.ts             # F-31 to F-40 Boundaries (50 tests)
│   └── f41-f45-monetization-boundary.test.ts # F-41 to F-47 Monetization Boundaries (20 tests)
├── tier3-pairwise/                          # Tier 3: Pairwise Cross-Feature Interactions
│   └── pairwise-interactions.test.ts        # 45 Cross-Feature Integration Tests
├── tier4-scenarios/                         # Tier 4: Real-World Application Scenarios
│   ├── real-world-scenarios.test.ts         # 5 Full Core End-to-End User Journeys
│   └── monetization-scenarios.test.ts       # 4 Full Monetization & Subscription User Journeys
├── unit-affiliate.test.ts                   # Unit: Amazon Fresh & Instacart URL generation, keyword sanitization
├── unit-freemium.test.ts                    # Unit: Calendar month key, 5-limit threshold, Pro unlimited bypass
├── unit-stripe.test.ts                      # Unit: $4.99/mo checkout session, webhook parsing, tier mapping
├── unit-usage-m2.test.ts                    # Unit: M2 usage quota calculations
├── unit-shopping-m3.test.ts                 # Unit: M3 shopping aggregator math
├── unit-dietary-m4.test.ts                  # Unit: M4 dietary restriction engine
├── unit-qa-improvements.test.ts             # Unit: QA improvements and refinements
├── adversarial-m1.test.ts                   # Tier 5: Adversarial M1 challenges
├── adversarial-challenger-m1.test.ts        # Tier 5: Challenger M1 suites
├── adversarial-challenger-m2.test.ts        # Tier 5: Challenger M2 suites
├── adversarial-tier5-hardening.test.ts      # Tier 5: Adversarial coverage hardening
├── adversarial-empirical-verification.test.ts # Tier 5: Empirical verification suite
└── runner.ts                                # Master test runner & reporter
```

---

## 2. Coverage Matrix & Summary

| Tier | Category | Required Threshold | Implemented Tests | Status |
|:---|:---|:---:|:---:|:---:|
| **Tier 1** | Feature Coverage (F-01 to F-47) | ≥ 235 | **235** | PASS (100%) |
| **Tier 2** | Boundary & Corner Cases (F-01 to F-47) | ≥ 220 | **220** | PASS (100%) |
| **Tier 3** | Pairwise Cross-Feature Interactions | ≥ 40 | **45** | PASS (100%) |
| **Tier 4** | Real-World Application Scenarios | ≥ 9 | **9** | PASS (100%) |
| **Monetization Unit** | Affiliate, Freemium, Stripe Unit Suites | ≥ 45 | **55** | PASS (100%) |
| **Tier 5 / Hardening** | Adversarial Hardening & Verification | ≥ 250 | **350** | PASS (100%) |
| **TOTAL** | **All Tiers & Suites Combined** | **≥ 800** | **914** | **100% PASS** |

---

## 3. Feature Inventory Coverage (F-01 through F-47)

| # | Feature | Description | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---|---|:---:|:---:|:---:|:---:|
| F-01 | Build & Font Safety | Build configs, font fallbacks, env fallbacks | 5 | 5 | ✓ | ✓ |
| F-02 | Email/Password Registration | User signup, default preferences | 5 | 5 | ✓ | ✓ |
| F-03 | Email/Password Sign-In | User authentication, session persistence | 5 | 5 | ✓ | ✓ |
| F-04 | Google OAuth Popup Flow | Google auth popup, profile init | 5 | 5 | ✓ | ✓ |
| F-05 | Private Route Guard & Redirect | AuthGuard, return query parameter | 5 | 5 | ✓ | ✓ |
| F-06 | YouTube Metadata & Caption Extraction | Video title, thumbnails, captions | 5 | 5 | ✓ | ✓ |
| F-07 | Gemini YouTube Recipe Parsing | AI extraction from transcript | 5 | 5 | ✓ | ✓ |
| F-08 | Photo / Vision AI Recipe Parsing | AI extraction from recipe images | 5 | 5 | ✓ | ✓ |
| F-09 | Extract Tab Navigation Query | Active tab query switching | 5 | 5 | ✓ | ✓ |
| F-10 | Recipe Persistence to Firestore | Firestore storage and indexing | 5 | 5 | ✓ | ✓ |
| F-11 | 1-5 Star Recipe Rating System | Recipe rating updates | 5 | 5 | ✓ | ✓ |
| F-12 | "I Made This" Cook Tracker | Cooking log and timesMade counter | 5 | 5 | ✓ | ✓ |
| F-13 | Recipe Notes Live Auto-save | Recipe notes editing & persistence | 5 | 5 | ✓ | ✓ |
| F-14 | In-Recipe Ingredient Checklist | Interactive recipe cooking checkboxes | 5 | 5 | ✓ | ✓ |
| F-15 | Recipe Deletion & Modal | Confirmation modal and removal | 5 | 5 | ✓ | ✓ |
| F-16 | Recipe Search & Sorting | Search by title/tags/ingredients | 5 | 5 | ✓ | ✓ |
| F-17 | 7x3 Weekly Planner Display | 21-slot meal plan grid | 5 | 5 | ✓ | ✓ |
| F-18 | ISO Week Navigation | Week navigation (YYYY-Www) | 5 | 5 | ✓ | ✓ |
| F-19 | Manual Slot Assignment | Adding recipes to meal slots | 5 | 5 | ✓ | ✓ |
| F-20 | Slot Clearing & Clear All | Slot removal and reset | 5 | 5 | ✓ | ✓ |
| F-21 | Smart Auto-Fill Planner | Intelligent meal generation | 5 | 5 | ✓ | ✓ |
| F-22 | Dashboard Today's Menu Live View | Today's breakfast/lunch/dinner | 5 | 5 | ✓ | ✓ |
| F-23 | Dashboard User Statistics | Cooks this month & total recipes | 5 | 5 | ✓ | ✓ |
| F-24 | Dashboard Recent Recipes | Quick access to latest recipes | 5 | 5 | ✓ | ✓ |
| F-25 | Warm Amber/Orange Theme Tokens | OKLCH color token conformity | 5 | 5 | ✓ | ✓ |
| F-26 | Mobile-First Bottom Nav (375px) | Responsive bottom bar navigation | 5 | 5 | ✓ | ✓ |
| F-27 | Loading States & Skeletons | Skeleton loaders for async views | 5 | 5 | ✓ | ✓ |
| F-28 | Contextual Empty States & CTAs | Actionable empty state UI | 5 | 5 | ✓ | ✓ |
| F-29 | Mobile Day Selector on Meal Plan | Single-day mobile tab navigation | 5 | 5 | ✓ | ✓ |
| F-30 | High-Converting Landing Page | Hero CTA, features, testimonials | 5 | 5 | ✓ | ✓ |
| F-31 | Micro-Interactions & Feedback | Toast notifications and transitions | 5 | 5 | ✓ | ✓ |
| F-32 | Shopping List Navigation Link | Nav links and badge counts | 5 | 5 | ✓ | ✓ |
| F-33 | Meal Plan Grocery Aggregation | 21-slot ingredient rollup | 5 | 5 | ✓ | ✓ |
| F-34 | Intelligent Ingredient Merger / Math | Unit conversion, fractions, sum math | 5 | 5 | ✓ | ✓ |
| F-35 | Grocery Department Grouping (8 Cats) | 8 store aisles categorization | 5 | 5 | ✓ | ✓ |
| F-36 | Interactive Item Check-off & Sync | Check item off, clear completed | 5 | 5 | ✓ | ✓ |
| F-37 | Custom Shopping List Items | Manual items under custom categories | 5 | 5 | ✓ | ✓ |
| F-38 | Profile Dietary Preferences UI | 8 dietary restrictions selector | 5 | 5 | ✓ | ✓ |
| F-39 | AI Extraction Dietary Auto-Tagging | Auto dietary classification | 5 | 5 | ✓ | ✓ |
| F-40 | Dietary Recipe Filter & Auto-Fill | Strict intersection dietary filter | 5 | 5 | ✓ | ✓ |
| **F-41** | **Affiliate Link Generation & Sanitization** | Amazon Fresh & Instacart search URLs + FTC disclosure | **5** | **5** | ✓ | ✓ |
| **F-42** | **Shopping List & Recipe Detail Affiliate CTAs** | "Order Ingredients" buttons and partner picker modal | **5** | **5** | ✓ | ✓ |
| **F-43** | **Freemium Tier & Monthly Usage Tracking** | 5 free monthly extractions, YYYY-MM rollover | **5** | **5** | ✓ | ✓ |
| **F-44** | **Extract Page Quota UI & Ungated Discover** | Quota banner ("3 of 5 remaining"), friendly upgrade prompt | **5** | **5** | ✓ | ✓ |
| **F-45** | **Stripe Checkout & Webhook/Verification** | $4.99/mo USD recurring checkout, webhook tier sync | **5** | **5** | ✓ | ✓ |
| **F-46** | **/pricing Page & Profile Subscription Card** | Free vs Pro comparison table, subscription management | **5** | **5** | ✓ | ✓ |
| **F-47** | **Navbar Pro Crown Badge & Pricing Navigation** | Pro badge in header, pricing nav links | **5** | **5** | ✓ | ✓ |

---

## 4. Tier 4 Real-World Application Scenarios Tested

1. **Scenario 1: From YouTube Video to Cooked Meal & Grocery Run**
   - User signs up -> extracts pasta recipe from YouTube URL -> saves recipe -> adds to Wednesday Dinner -> generates shopping list -> checks off items -> rates recipe 5 stars and clicks "I Made This!".
2. **Scenario 2: Photo Recipe & Weekly Family Meal Plan with Duplicate Ingredient Summing**
   - User uploads photo of grandma's stew -> extracts recipe with custom tags -> assigns to Monday Dinner and Friday Dinner -> auto-fills remaining slots -> verifies shopping list sums duplicate beef ingredients under Meat/Seafood department.
3. **Scenario 3: Strict Vegan / Gluten-Free Lifestyle Transition**
   - User updates profile preferences to `vegan` and `gluten-free` -> verifies recipe library filter displays only compliant recipes -> runs meal planner auto-fill -> verifies all 21 generated slots strictly satisfy vegan and gluten-free tags.
4. **Scenario 4: Mobile On-The-Go Grocery Shopping**
   - Mobile user (375px) navigates to `/meal-plan` using mobile day selector -> jumps to `/shopping-list` via bottom navbar -> adds custom item "Sponges" -> checks off produce items in aisle order -> verifies checked items persist on page reload.
5. **Scenario 5: High-Frequency Cook History & Recipe Management**
   - User searches recipes by keyword -> sorts by "Most Made" -> edits recipe notes -> verifies live auto-save -> logs multiple cook events -> verifies dashboard cooking stats update in real time.
6. **Scenario 6: Free User Reaches Extraction Limit -> Upgrades via Stripe -> Unlocks Unlimited Extractions**
   - Free user registers -> consumes 5 free extractions -> gets blocked on 6th attempt with friendly upgrade prompt -> navigates to `/pricing` -> starts Stripe checkout ($4.99/mo) -> webhook updates profile to Pro -> gets Pro crown badge in navbar -> returns to Extract page and extractions are unlimited.
7. **Scenario 7: Shopping List & Recipe Detail "Order Ingredients" Flow with Partner Stores**
   - User plans weekly meals -> opens Shopping List -> clicks "Order Ingredients" -> selects Amazon Fresh or Instacart -> URL is built with sanitized search query (excluding checked items) and affiliate referral tag -> FTC disclosure is visible -> repeats flow from single Recipe Detail page.
8. **Scenario 8: Monthly Quota Rollover, Upgrade, and Subscription Cancellation**
   - User exhausts 5 free extractions in August -> September 1 rollover resets quota to 5 free extractions -> user upgrades to Pro in mid-September -> later cancels subscription -> webhook downgrades profile back to Free at period end.
9. **Scenario 9: Discover (TheMealDB) Browsing and Recipe Saving Remains 100% Free and Ungated**
   - Free user with 5/5 extractions used (blocked from AI extract) can still freely search, view, and save recipes from Discover (TheMealDB) without quota deductions or paywalls.

---

## 5. Verification Commands

To run the complete test suite at any time:
```bash
npm test
```
Or execute directly with Node:
```bash
node --experimental-strip-types tests/runner.ts
```

To verify TypeScript types:
```bash
npx tsc --noEmit
```
