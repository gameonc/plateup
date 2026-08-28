## 2026-08-28T12:22:25Z
You are worker_m4 for Milestone 4: Navigation, Badges & UI Integration.
Working directory: /Users/CLD/.gemini/antigravity/scratch/plateup/.agents/worker_m4/
Project root: /Users/CLD/.gemini/antigravity/scratch/plateup

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

You MUST read these specifications before implementing:
1. /Users/CLD/.gemini/antigravity/scratch/plateup/ORIGINAL_REQUEST.md (§R4)
2. /Users/CLD/.gemini/antigravity/scratch/plateup/PROJECT.md (§Interface Contracts & Code Layout)

Scope & Exclusive File Ownership:
- `src/components/monetization/ProBadge.tsx`: Create a reusable Pro badge / crown component (e.g. `<Crown className="h-4 w-4 text-amber-500 fill-amber-500" />` + gradient badge).
- `src/components/layout/Navbar.tsx`:
  - Show the Pro badge / crown icon next to the user avatar in both Desktop top nav and Mobile top header when `profile?.plan === 'pro'`.
  - Add a "Pricing" link in the desktop navigation items and mobile avatar dropdown menu.
  - Ensure links work smoothly for both authenticated and guest users.
- `src/app/page.tsx` (Landing Page):
  - Add a "Pricing" link in the header navigation (between logo and Sign In).
  - Add a "Pricing" link in the footer links.
  - Add a subtle "Upgrade to Pro" or "Pricing" call-to-action in appropriate feature sections.
- Review all upgrade prompts throughout the app (`UpgradePrompt.tsx`, `extract/page.tsx`, `profile/page.tsx`) to ensure the copy is encouraging, friendly, and non-punishing (emphasizing what Pro unlocks rather than what Free lacks).

Verification Requirements:
1. Run `npx tsc --noEmit` -> Zero errors.
2. Run `npm run build` -> Clean Next.js build.
3. Run `npm test` -> All tests pass (100%).

Write your completion report to /Users/CLD/.gemini/antigravity/scratch/plateup/.agents/worker_m4/handoff.md and send a message to parent (ID: 3ea14768-fe53-4f59-a65e-376b7022d92b).
