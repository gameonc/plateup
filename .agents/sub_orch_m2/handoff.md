# Handoff Report — Milestone 2: Extraction & Recipe Scaling Optimization

## 1. Observation
- **Servings Vulgar Fraction Scaling**:
  - `src/app/(app)/recipes/[id]/page.tsx` previously used a local regex that only supported ASCII fractions (`1/2`) and mixed numbers (`1 1/2`), leaving Unicode vulgar fractions (`½`, `¼`, `¾`, `⅓`, `⅔`, `⅛`, `⅜`, `⅝`, `⅞`, `⅙`, `⅚`, `⅑`, `⅒`) unscaled because `parseFloat()` returned `NaN`.
  - `src/lib/ingredient-parser.ts` contained `parseFractionOrAmount` and `formatQuantityDisplay` with full vulgar fraction support.
- **Large Image Upload Optimization**:
  - `src/app/(app)/extract/page.tsx` previously converted raw camera/upload `File` objects directly to base64 data URLs without dimension or compression constraints, which would trigger 413 Payload Too Large errors (>4.5MB) when uploading high-resolution mobile photos (12MP-48MP).
- **Verification Commands & Results**:
  - `npx tsc --noEmit` exited with code 0 (zero errors).
  - `npm run build` compiled all 20/20 pages successfully without warnings.
  - `npm test` executed 1078 tests across all tiers with 1078 passed, 0 failed.

## 2. Logic Chain
- **Servings Scaling**:
  1. Exported `scaleIngredientAmount(amount, scale)` in `src/lib/ingredient-parser.ts` utilizing `parseFractionOrAmount` and `formatQuantityDisplay`, with safeguards preserving non-numeric strings (e.g. `"to taste"`, `"a pinch"`).
  2. Updated `scaleAmount` in `src/app/(app)/recipes/[id]/page.tsx` to delegate to `scaleIngredientAmount`, enabling seamless scaling of vulgar fractions, ASCII fractions, mixed numbers, and decimals when users adjust servings.
- **Client-Side Canvas Downscaling**:
  1. Implemented `downscaleImageFile` in `src/app/(app)/extract/page.tsx` using `HTMLCanvasElement` to constrain maximum width and height to 1920px while preserving native aspect ratio, compressing to `image/jpeg` with 0.85 quality.
  2. Added `isProcessingImage` UI state with visual feedback during image optimization.
  3. Extracted exact base64 data and MIME type for `/api/extract-recipe`, preventing payload exhaustion.
- **Testing**:
  1. Added unit tests for vulgar fractions (`½`, `¼`, `¾`, `⅓`, `⅔`, `⅛`, `⅜`, `⅝`, `⅞`), compound fractions (`1 ½`, `2 ¾`), ASCII fractions, decimal scaling, and unparseable strings.
  2. Added test cases verifying downscaling aspect ratio preservation across landscape (4032x3024), portrait (3024x4032), 48MP (8000x6000), and sub-1920 dimensions.

## 3. Caveats
- Browsers without canvas 2D support (or in synthetic headless environments where canvas returns null) gracefully fall back to the original image data URL without breaking the user journey.

## 4. Conclusion
Milestone 2 (Extraction & Recipe Scaling Optimization) is 100% complete and fully verified.
- Servings scaling properly scales vulgar fractions and clean quantity strings.
- Image uploads are downscaled client-side to <=1920px at 0.85 JPEG quality before API transmission.
- All TypeScript checks, Next.js production builds, and automated tests pass with 0 errors.

## 5. Verification Method
1. `npx tsc --noEmit`
2. `npm run build`
3. `npm test`
