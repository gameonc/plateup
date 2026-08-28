## 2026-08-28T12:15:08Z
You are teamwork_preview_test_writer for the E2E Testing Track.
Working directory: /Users/CLD/.gemini/antigravity/scratch/plateup/.agents/test_writer_e2e/
Target project: /Users/CLD/.gemini/antigravity/scratch/plateup

You MUST read these specifications before writing tests:
1. /Users/CLD/.gemini/antigravity/scratch/plateup/ORIGINAL_REQUEST.md
2. /Users/CLD/.gemini/antigravity/scratch/plateup/PROJECT.md
3. /Users/CLD/.gemini/antigravity/scratch/plateup/TEST_INFRA.md

Mission:
Author the complete, rigorous, opaque-box and unit test suites for all PlateUp monetization features according to TEST_INFRA.md:
- `tests/unit-affiliate.test.ts`: Affiliate URL building (Amazon Fresh & Instacart), keyword sanitization (removing measurements/fractions/preparation verbs), parameter formatting, disclosure text.
- `tests/unit-freemium.test.ts`: Freemium usage logic, calendar month key generation (`YYYY-MM`), 5-limit threshold, remaining extractions calculation, Pro plan unlimited bypass.
- `tests/unit-stripe.test.ts`: Stripe checkout session payload parameters ($4.99/mo USD recurring), webhook event parsing and validation, user tier mapping.
- `tests/tier1-features/f41-f45-monetization.test.ts`: Tier 1 Feature tests for all monetization requirements (≥5 tests per feature: F-41, F-42, F-43, F-44, F-45, F-46, F-47).
- `tests/tier2-boundary/f41-f45-monetization-boundary.test.ts`: Tier 2 Boundary & Corner cases (empty ingredients, zero extractions, 4/5/6 extractions, month boundary transitions, leap year, invalid strings).
- `tests/tier4-scenarios/monetization-scenarios.test.ts`: Tier 4 Real-World Application scenarios (Full user lifecycle: Free user reaching limit -> upgrade prompt -> Stripe checkout -> Pro status update -> unlimited extractions; Shopping list order ingredients flow).
- Register all new test files in `tests/runner.ts`.
- Run `node --experimental-strip-types tests/runner.ts` (or `npm test`) and `npx tsc --noEmit` to verify all test suites are syntactically sound, type-safe, and ready.
- Create `/Users/CLD/.gemini/antigravity/scratch/plateup/TEST_READY.md` summarizing the test suites, test counts per tier, and runner command.

Write your handoff report to /Users/CLD/.gemini/antigravity/scratch/plateup/.agents/test_writer_e2e/handoff.md and notify parent (ID: 3ea14768-fe53-4f59-a65e-376b7022d92b).
