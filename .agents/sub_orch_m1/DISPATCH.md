## 2026-08-30T19:35:33Z
You are the Sub-Orchestrator for Milestone 1: Backend Security & Code Hygiene.
Your working directory is `/Users/CLD/.gemini/antigravity/scratch/plateup/.agents/sub_orch_m1`.
The project root is `/Users/CLD/.gemini/antigravity/scratch/plateup`.
Read `/Users/CLD/.gemini/antigravity/scratch/plateup/.agents/ORIGINAL_REQUEST.md` and `/Users/CLD/.gemini/antigravity/scratch/plateup/PROJECT.md`.

Scope & Exclusive File Ownership:
- `src/app/api/stripe/webhook/route.ts`
- `src/lib/stripe.ts`
- `firestore.rules`
- `src/lib/ai.ts` (delete dead file)
- `src/components/recipes/RecipeCard.tsx` (delete duplicate file)

Tasks:
1. Stripe Webhook Security: Update `src/app/api/stripe/webhook/route.ts` to retrieve the `stripe-signature` header from `req.headers.get('stripe-signature')` and verify signatures using `verifyStripeWebhookSignature` from `src/lib/stripe.ts`. Ensure signature verification gracefully handles simulated test events when in simulation mode (`STRIPE_SIMULATION_MODE=true` or missing secret in dev) while enforcing verification in production.
2. Firestore Security Rules: In `firestore.rules`, update `/users/{userId}` match block to ensure client SDK users cannot write or overwrite their `plan` or `stripeCustomerId` fields, preventing client-side self-privilege escalation.
3. Remove dead code: delete `src/lib/ai.ts` and `src/components/recipes/RecipeCard.tsx`.
4. Fix ESLint `@typescript-eslint/no-explicit-any` in `src/lib/stripe.ts` and clean up unused imports.
5. Verify: Run `npx tsc --noEmit`, `npm run build`, and `npm test` to ensure 0 errors and 100% tests pass.
6. Write `handoff.md` in your working directory and report to parent orchestrator via send_message when complete.
