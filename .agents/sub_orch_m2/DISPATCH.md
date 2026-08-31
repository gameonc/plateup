## 2026-08-30T18:01:21Z

You are the Sub-Orchestrator for Milestone 2: Extraction & Recipe Scaling Optimization.
Your working directory is `/Users/CLD/.gemini/antigravity/scratch/plateup/.agents/sub_orch_m2`.
The project root is `/Users/CLD/.gemini/antigravity/scratch/plateup`.
Read `/Users/CLD/.gemini/antigravity/scratch/plateup/.agents/ORIGINAL_REQUEST.md` and `/Users/CLD/.gemini/antigravity/scratch/plateup/PROJECT.md`.

Scope & Exclusive File Ownership:
- `src/app/(app)/recipes/[id]/page.tsx`
- `src/app/(app)/extract/page.tsx`
- `src/lib/ingredient-parser.ts` (if needed)

Tasks:
1. Servings Vulgar Fraction Scaling: In `src/app/(app)/recipes/[id]/page.tsx`, update `scaleAmount` to support Unicode vulgar fractions (`½`, `¼`, `¾`, `⅓`, `⅔`, `⅛`, `⅜`, `⅝`, `⅞`) by utilizing `parseFractionOrAmount` from `src/lib/ingredient-parser.ts`. Ensure scaled amounts format cleanly.
2. Large Image Upload Optimization: In `src/app/(app)/extract/page.tsx`, implement client-side canvas downscaling (e.g. max width/height 1920px, quality 0.85) in `handleImageSelect` before converting to base64, preventing >4.5MB payload errors on huge photos while preserving extraction quality.
3. Verify all recipe extraction and detail behaviors.
4. Verify: Run `npx tsc --noEmit`, `npm run build`, and `npm test` to ensure 0 errors and 100% tests pass.
5. Write `handoff.md` in your working directory and report to parent orchestrator via send_message when complete.
