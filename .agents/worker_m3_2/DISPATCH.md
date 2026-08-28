## 2026-08-28T12:50:08Z

You are worker_m3_2 for Milestone 3: Pro Upgrade Page & Stripe Checkout.
Working directory: /Users/CLD/.gemini/antigravity/scratch/plateup/.agents/worker_m3_2/
Project root: /Users/CLD/.gemini/antigravity/scratch/plateup

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

You MUST read these specifications before implementing:
1. /Users/CLD/.gemini/antigravity/scratch/plateup/ORIGINAL_REQUEST.md (§R3)
2. /Users/CLD/.gemini/antigravity/scratch/plateup/PROJECT.md (§Interface Contracts & Code Layout)

Scope & Exclusive File Ownership:
- Install `stripe` package if needed (`npm install stripe @stripe/stripe-js`).
- `src/lib/stripe.ts`: Initialize Stripe server-side instance using `process.env.STRIPE_SECRET_KEY` with graceful fallback for test/dev mode.
- `src/app/api/stripe/checkout/route.ts`: Create Next.js API route handler for `POST /api/stripe/checkout`. Creates a Stripe Checkout subscription session for $4.99/mo USD recurring (`mode: 'subscription'`, line items `$4.99/mo`, customer email, `client_reference_id: userId`, `metadata: { userId }`, `success_url: ${origin}/pricing?session_id={CHECKOUT_SESSION_ID}&status=success`, `cancel_url: ${origin}/pricing?status=cancelled`). Returns `{ url: session.url, sessionId: session.id }`.
- `src/app/api/stripe/verify-session/route.ts`: Create API route handler to verify checkout session and retrieve subscription ID and user ID.
- `src/app/api/stripe/webhook/route.ts`: Create API route handler for `POST /api/stripe/webhook` handling `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`.
- `src/app/pricing/page.tsx`: Create a beautiful, responsive `/pricing` page (accessible to all users) featuring:
  - Free ($0/mo) vs Pro ($4.99/mo) comparison table / cards.
  - "Go Pro" button that initiates Stripe Checkout (test mode) with loading spinner and error handling.
  - Handles `?session_id=...&status=success` by verifying session and updating user's plan to `pro` in Firestore with success toast/alert.
  - Handles `?status=cancelled` with gentle notification.
- `src/app/(app)/profile/page.tsx`: Add a dedicated "Subscription & Plan Status" card showing:
  - If Free: Free Plan badge, "{used} / 5 extractions used this month", "Upgrade to Pro ($4.99/mo)" CTA button linking to `/pricing`.
  - If Pro: Shiny Pro Crown badge, "Unlimited AI Recipe Extractions", "Plan: $4.99/mo Active", subscription details.

Verification Requirements:
1. Run `npx tsc --noEmit` -> Zero errors.
2. Run `npm run build` -> Clean Next.js build.
3. Run `npm test` -> All tests pass (100%).

Write your completion report to /Users/CLD/.gemini/antigravity/scratch/plateup/.agents/worker_m3_2/handoff.md and send a message to parent (ID: 3ea14768-fe53-4f59-a65e-376b7022d92b).
