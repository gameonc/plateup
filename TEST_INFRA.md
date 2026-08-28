# E2E Test Infra: PlateUp Monetization Features

## Test Philosophy
- Opaque-box, requirement-driven. Derived from `ORIGINAL_REQUEST.md`.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial + Real-World Workload Testing.
- Framework: Built-in Node.js test runner (`node:test`) executed via `node --experimental-strip-types tests/runner.ts` (`npm test`).

## Feature Inventory & Test Mapping
| # | Feature | Source (Requirement) | Tier 1 (Feature) | Tier 2 (Boundary) | Tier 3 (Pairwise) | Tier 4 (Scenario) |
|---|---------|---------------------|:----------------:|:-----------------:|:-----------------:|:-----------------:|
| 1 | Affiliate URL Generation & Formatting | ORIGINAL_REQUEST §R1 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 2 | Shopping List & Recipe Detail Affiliate CTAs | ORIGINAL_REQUEST §R1 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 3 | Freemium 5-Limit & Monthly Calendar Reset | ORIGINAL_REQUEST §R2 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 4 | Extract Quota Display & Blocking with Prompt | ORIGINAL_REQUEST §R2 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 5 | Discover Page Unlimited & Free | ORIGINAL_REQUEST §R2 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 6 | Stripe Checkout Session Creation ($4.99/mo) | ORIGINAL_REQUEST §R3 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 7 | Subscription Verification & Plan Update to Pro | ORIGINAL_REQUEST §R3 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 8 | /pricing Page Free vs Pro Comparison | ORIGINAL_REQUEST §R3 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 9 | Profile Subscription Management | ORIGINAL_REQUEST §R3 | ≥5 cases | ≥5 cases | ✓ | ✓ |
| 10 | Navbar Pro Crown/Badge & Nav Links | ORIGINAL_REQUEST §R4 | ≥5 cases | ≥5 cases | ✓ | ✓ |

## Test Architecture
- Test Runner: `tests/runner.ts` running all suites via `node:test`.
- Unit Test Suites:
  - `tests/unit-affiliate.test.ts`: URL building, tag insertion, ingredient cleaner regex, special char handling.
  - `tests/unit-freemium.test.ts`: Month rollover (`YYYY-MM`), 5-limit enforcement, Pro unlimited bypass, usage counters.
  - `tests/unit-stripe.test.ts`: Session parameters ($4.99/mo USD recurring), payload parsing, signature verification.
- Tier 1 Feature Coverage:
  - `tests/tier1-features/f41-f45-monetization.test.ts` (F-41 through F-48 test cases).
- Tier 2 Boundary Coverage:
  - `tests/tier2-boundary/f41-f45-monetization-boundary.test.ts` (Empty ingredient lists, 0 count, 4 count, 5 count, 6 count, leap years, month changes).
- Tier 4 Real-World Application Scenarios:
  - `tests/tier4-scenarios/monetization-scenarios.test.ts` (Scenario: Free user hits 5 extractions -> prompted to upgrade -> converts via Stripe -> gets Pro badge -> unblocked extractions).

## Coverage Thresholds
- Tier 1: ≥5 per feature
- Tier 2: ≥5 per feature (where boundaries exist)
- Tier 3: pairwise coverage of major feature interactions
- Tier 4: realistic user lifecycle workflows
