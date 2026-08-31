# PlateUp — Code Quality, Build, Tests & Security Survey Report

**Date**: 2026-08-30  
**Target App**: PlateUp (https://plateup-two.vercel.app)  
**Surveyor**: Explorer 1 (Code Quality, Build, Tests & Security Specialist)  
**Repository**: `/Users/CLD/.gemini/antigravity/scratch/plateup`

---

## Executive Summary

A comprehensive pre-production audit of PlateUp's codebase was conducted across TypeScript compilation, Next.js production build, automated test suites, API route implementations, authentication & authorization, Stripe integration, secret management, Firestore security rules, and code hygiene.

### Core Findings Table

| Audit Area | Status | Key Finding | Impact / Severity |
|---|:---:|---|:---:|
| **TypeScript Compilation** (`tsc`) | ✅ **PASS** | 0 compiler errors across all project files (`strict: true`) | None |
| **Next.js Production Build** | ✅ **PASS** | `next build --webpack` succeeded in 1.79s; all 20 routes generated cleanly | None |
| **Automated Test Suite** (`npm test`) | ✅ **PASS** | 1057/1057 tests passed across 34 test files (1.08s runtime) | None |
| **API Routes & Error Handling** | ⚠️ **WARN** | 5 routes implement error handling & HTTP statuses; API endpoints lack auth rate limiting | Low-Medium |
| **Stripe Webhook Signature** | ❌ **FAIL** | Webhook route (`/api/stripe/webhook`) lacks cryptographic signature verification (`stripe.webhooks.constructEvent` / HMAC SHA-256) | **HIGH (Security Vulnerability)** |
| **Secret Leaks & Private Keys** | ✅ **PASS** | `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `YOUTUBE_API_KEY` are strictly server-side | None |
| **Firestore Security Rules** | ⚠️ **WARN** | Tenant isolation is enforced (`isOwner`), but user document allows self-upgrading `plan: 'pro'` | **MEDIUM (Privilege Escalation)** |
| **ESLint & Code Cleanliness** | ⚠️ **WARN** | 0 `console.log` in prod; 5 ESLint errors (`@typescript-eslint/no-explicit-any`) and 50 warnings (unused imports/variables); dead files identified (`src/lib/ai.ts`, `src/components/recipes/RecipeCard.tsx`) | Low |

---

## 1. TypeScript Compiler Inspection (`npx tsc --noEmit`)

- **Command**: `npx tsc --noEmit`
- **Exit Code**: `0`
- **Errors Found**: `0`
- **Compiler Configuration (`tsconfig.json`)**:
  - `target`: `ES2017`
  - `strict`: `true`
  - `moduleResolution`: `bundler`
  - `skipLibCheck`: `true`
  - Included paths: `next-env.d.ts`, `**/*.ts`, `**/*.tsx`, `**/*.mts`
- **Observations**: Full type safety is maintained across all models, hooks, UI components, API routes, and test suites with zero compilation errors.

---

## 2. Next.js Production Build Inspection (`npm run build`)

- **Command**: `npm run build` (`next build --webpack`)
- **Exit Code**: `0`
- **Compilation Time**: 1791ms
- **Route Manifest (20 Total Routes)**:
  - **Static Pages (14)**:
    - `/` (Landing Page)
    - `/_not-found` (404 Page)
    - `/dashboard` (Dashboard)
    - `/discover` (TheMealDB Discover & Recipe Browser)
    - `/extract` (AI Recipe Extraction)
    - `/login` (Authentication)
    - `/meal-plan` (Weekly Meal Planner)
    - `/pricing` (Subscription Pricing)
    - `/privacy` (Privacy Policy)
    - `/profile` (User Settings & Preferences)
    - `/recipes` (My Recipes Collection)
    - `/shopping-list` (Aggregated Grocery List)
    - `/terms` (Terms of Service)
  - **Dynamic Server-Rendered Routes (6)**:
    - `/api/extract-recipe` (Gemini AI Extraction API)
    - `/api/stripe/checkout` (Stripe Checkout Session Creator)
    - `/api/stripe/verify-session` (Stripe Session Verifier)
    - `/api/stripe/webhook` (Stripe Webhook Listener)
    - `/api/youtube-recipe` (YouTube Metadata & Transcript Extractor)
    - `/recipes/[id]` (Dynamic Recipe Detail Page)
- **Observations**: Webpack bundled and optimized all client and server assets without errors.

---

## 3. Automated Test Suite Inspection (`npm test`)

- **Command**: `npm test` (`node --experimental-strip-types tests/runner.ts`)
- **Execution Time**: 1.08s
- **Total Tests Executed**: 1057
- **Passed**: 1057 (100%)
- **Failed**: 0
- **Skipped / Cancelled**: 0
- **Test Architecture & Coverage**:
  - **Tier 1 (Feature Coverage F01–F47)**: 235 / 235 (100%)
  - **Tier 2 (Boundary & Corner Cases)**: 220 / 220 (100%)
  - **Tier 3 (Pairwise Interactions)**: 45 / 45 (100%)
  - **Tier 4 (Real-World Lifecycle Scenarios)**: 9 / 9 (100%)
  - **Monetization Unit Suites (F41–F45)**: 45 / 45 (100%)
  - **Adversarial & Stress Suites**:
    - `tests/adversarial-monetization-stress.test.ts` (Sanitization, XSS payloads, Unicode, fractions, month rollovers, leap years)
    - `tests/adversarial-monetization-lifecycle.test.ts` (Full free-to-pro lifecycle)
    - `tests/adversarial-challenger-m1.test.ts` / `m2.test.ts` / `tier5-hardening.test.ts`
- **Noticeable Warning**: Node.js outputs `[MODULE_TYPELESS_PACKAGE_JSON]` warning recommending `"type": "module"` in `package.json`.

---

## 4. API Routes Analysis (`src/app/api/`)

### Route 1: `/api/extract-recipe` (`src/app/api/extract-recipe/route.ts`)
- **Method**: `POST`
- **Payload**: `{ type: 'youtube-video' | 'youtube-transcript' | 'image', youtubeUrl, imageBase64, mimeType, title, description, transcript }`
- **Validation**:
  - Validates `type` against supported options; returns HTTP 400 for unknown types.
  - Validates `imageBase64` and `mimeType` for image extractions; returns HTTP 400 if missing.
- **Error Handling**: Catches JSON parsing errors (HTTP 500) and Gemini generation errors (HTTP 500).
- **Security & Secrets**: Uses `recipeModel` from `@/lib/ai-server` (`process.env.GEMINI_API_KEY`). API key is never sent to the client.
- **Observations / Flaws**: Endpoint is unauthenticated. Anyone can send direct requests to `/api/extract-recipe` without Firebase auth tokens. Server-side quota enforcement is not implemented at the API route level (quota is currently tracked client-side before calling).

### Route 2: `/api/youtube-recipe` (`src/app/api/youtube-recipe/route.ts`)
- **Method**: `POST`
- **Payload**: `{ url: string }`
- **Validation**:
  - Validates `url` exists and is a string (HTTP 400).
  - Validates video ID extraction via `extractVideoId(url)` (HTTP 400).
- **Error Handling**: Distinguishes missing captions (returns HTTP 404 with friendly message) from generic extraction failures (HTTP 500).
- **Security**: Uses `process.env.YOUTUBE_API_KEY` on server side.

### Route 3: `/api/stripe/checkout` (`src/app/api/stripe/checkout/route.ts`)
- **Method**: `POST`
- **Payload**: `{ userId: string, userEmail?: string, returnUrl?: string }`
- **Validation**: Enforces non-empty string `userId` (HTTP 400).
- **Error Handling**: Catches internal errors and returns HTTP 500 with `{ error }`.
- **Logic**: Calls `createCheckoutSession()` in `src/lib/stripe.ts`. Generates a valid Stripe Checkout session ($4.99/mo USD recurring) with metadata `userId`.

### Route 4: `/api/stripe/verify-session` (`src/app/api/stripe/verify-session/route.ts`)
- **Methods**: `POST` and `GET`
- **Payload / Query**: `{ sessionId: string, userId?: string }` or `?session_id=...&user_id=...`
- **Validation**: Enforces `sessionId` parameter (HTTP 400).
- **Logic**: Verifies checkout session against Stripe API or test mode; updates user document in Firestore to `plan: 'pro'`.
- **Status Codes**: HTTP 200 on success, HTTP 400 on verification failure.

### Route 5: `/api/stripe/webhook` (`src/app/api/stripe/webhook/route.ts`)
- **Method**: `POST`
- **Payload**: JSON Stripe Event
- **Validation**: Verifies JSON syntax (HTTP 400) and event format `payload.type` and `payload.data?.object` (HTTP 400).
- **Dispatched Events**:
  - `checkout.session.completed` -> upgrades user to `plan: 'pro'`
  - `customer.subscription.deleted` -> downgrades user to `plan: 'free'`
  - `customer.subscription.updated` -> updates subscription status & plan
- **Status Codes**: HTTP 200 on receipt/handling, HTTP 400 on bad payload, HTTP 500 on execution error.

---

## 5. Stripe Webhook & Signature Security Audit

### 🚨 Critical Vulnerability Identified: Missing Signature Verification
- **File**: `src/app/api/stripe/webhook/route.ts`
- **Finding**: The route receives raw text and directly performs `JSON.parse(rawBody)` without validating the `stripe-signature` header or verifying HMAC SHA-256 signatures with `STRIPE_WEBHOOK_SECRET`.
- **Vulnerability Details**:
  - In standard production Stripe implementations, webhooks MUST be verified via `stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)`.
  - Because signature verification is omitted, any malicious client can POST a forged JSON payload:
    ```json
    {
      "type": "checkout.session.completed",
      "data": {
        "object": {
          "client_reference_id": "TARGET_USER_ID",
          "subscription": "sub_fake123"
        }
      }
    }
    ```
    and elevate any user account to `plan: 'pro'` without making a payment.
- **Root Cause**: The official `stripe` Node SDK is not included in `package.json` dependencies (Stripe API calls were written with lightweight REST `fetch()`), and no custom HMAC signature verification was implemented.
- **Recommended Remediation**:
  1. Add `stripe` SDK to `package.json` (or implement `crypto.createHmac('sha256', secret)` verification).
  2. Read `req.headers.get('stripe-signature')`.
  3. Validate signature using `process.env.STRIPE_WEBHOOK_SECRET`.
  4. Reject requests with HTTP 400 if signature verification fails.

---

## 6. Secret Leaks & API Key Exposure Audit

### Server-Side Secrets
- `GEMINI_API_KEY`: Referenced **only** in `src/lib/ai-server.ts:7` (`process.env.GEMINI_API_KEY`). Imported strictly by server route `src/app/api/extract-recipe/route.ts`. **NOT exposed in client bundles.**
- `STRIPE_SECRET_KEY`: Referenced **only** in `src/lib/stripe.ts:132,214`. Imported strictly by server route handlers. **NOT exposed in client bundles.**
- `YOUTUBE_API_KEY`: Referenced **only** in `src/lib/youtube.ts:35`. Imported strictly by server route `src/app/api/youtube-recipe/route.ts`. **NOT exposed in client bundles.**

### Public Environment Variables (`NEXT_PUBLIC_`)
- `NEXT_PUBLIC_FIREBASE_API_KEY`: Public Firebase Web Client API key (standard for Firebase browser SDKs).
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `PROJECT_ID`, `STORAGE_BUCKET`, `MESSAGING_SENDER_ID`, `APP_ID`: Standard public Firebase config.
- `NEXT_PUBLIC_AMAZON_AFFILIATE_TAG`, `NEXT_PUBLIC_INSTACART_AFFILIATE_ID`: Public affiliate tracking parameters for outbound shopping cart links.

### Dead File Note: `src/lib/ai.ts`
- `src/lib/ai.ts` contains `'use client'` and instantiates `GoogleGenerativeAI` using `NEXT_PUBLIC_FIREBASE_API_KEY`.
- This file is **dead code** (0 references across the active codebase). It was superseded by `src/lib/ai-server.ts`. It should be deleted to prevent confusion or accidental bundling.

---

## 7. Firebase Security Rules Audit (`firestore.rules`)

### Configuration Overview
```firestore-rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() { return request.auth != null; }
    function isOwner(userId) { return isAuthenticated() && request.auth.uid == userId; }

    match /users/{userId} {
      allow read, write: if isOwner(userId);
      match /recipes/{recipeId} { allow read, write: if isOwner(userId); }
      match /mealPlans/{planId} { allow read, write: if isOwner(userId); }
      match /cookingLog/{logId} { allow read, write: if isOwner(userId); }
      match /shoppingLists/{listId} { allow read, write: if isOwner(userId); }
      match /shoppingList/{itemId} { allow read, write: if isOwner(userId); }
    }
    match /{document=**} { allow read, write: if false; }
  }
}
```

### Security Evaluation
1. **Tenant Isolation**: ✅ Strong. Unauthenticated users cannot read/write any data. Users cannot read/write any other user's documents or subcollections.
2. **Default Deny**: ✅ Present. `match /{document=**} { allow read, write: if false; }` blocks access to any undefined collection.
3. **⚠️ Privilege Escalation Flaw (Plan Tampering)**:
   - Because `match /users/{userId}` has `allow write: if isOwner(userId);`, an authenticated free user can update their own user profile document directly from the browser SDK:
     ```js
     await updateDoc(doc(db, 'users', auth.currentUser.uid), { plan: 'pro', extractionsThisMonth: 0 });
     ```
   - This bypasses all freemium limits without purchasing a subscription.
   - **Remediation**:
     - Prevent client mutation of `plan`, `subscriptionId`, and `subscriptionStatus` fields via rules, e.g.:
       ```firestore-rules
       allow update: if isOwner(userId) && (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['plan', 'subscriptionId', 'subscriptionStatus']));
       ```
     - Manage `plan` updates exclusively via server-side Admin SDK / Cloud Functions or trusted backend route.
4. **Data Validation**: ⚠️ Missing. No constraints on field types, string length, or value ranges in `recipes` or `mealPlans`.

---

## 8. Code Quality, Logs, Unused Imports & Dead Code

### Production Console Logging
- **`console.log`**: **0 occurrences** in production code under `src/`.
- **`console.error`**: Used appropriately in `catch` blocks for unexpected API/Firestore errors. Note: A few UI catch blocks log raw error objects (`console.error(err)`) in `src/app/(app)/shopping-list/page.tsx:119,139,153` and `src/app/(app)/recipes/[id]/page.tsx:90,134`.
- **`console.warn`**: Used for non-fatal fallbacks (e.g. YouTube API fallback to scraping, Stripe test mode fallback).

### ESLint Audit (`npm run lint`)
- **Total Problems**: 5 errors, 50 warnings.
- **5 Errors**:
  1. `src/lib/stripe.ts:77:71`: `Unexpected any` in `safeUpdateUserDoc(userId: string, data: Record<string, any>)`.
  2. `tests/adversarial-monetization-stress.test.ts:184:40, 508:47, 624:50, 649:48`: `Unexpected any` in test assertions.
- **Unused Imports & Variables in Source Code**:
  - `src/app/(app)/discover/page.tsx`: Unused imports `ArrowLeft`, `Sparkles`; unused state `mealDetailLoading`.
  - `src/app/(app)/meal-plan/page.tsx`: Unused imports `useEffect`, `getRandomMeals`; `useCallback` missing dependency `POPULAR_CATEGORIES`.
  - `src/app/page.tsx`: Unused import `Utensils`.
  - `src/lib/stripe.ts`: Unused import `UserProfile`.

### Dead Code & Redundant Files Identified
1. **`src/lib/ai.ts`** (137 lines): Legacy client-side AI helper with `'use client'`. Completely unused (superseded by `src/lib/ai-server.ts`).
2. **`src/components/recipes/RecipeCard.tsx`** (2 lines): Re-export shim (`export * from '../recipe/RecipeCard'`). Never imported anywhere in the project.

---

## Conclusion & Actionable Recommendations

1. **High Priority (Security)**:
   - Implement Stripe webhook signature verification (`stripe-signature` header & HMAC validation) in `/api/stripe/webhook` with `STRIPE_WEBHOOK_SECRET`.
   - Protect `plan` and subscription fields in `firestore.rules` so clients cannot self-promote to `pro`.
2. **Medium Priority (Code Quality & Hygiene)**:
   - Fix the 5 ESLint `@typescript-eslint/no-explicit-any` errors (e.g. use `Record<string, unknown>`).
   - Remove unused imports in `src/app/(app)/discover/page.tsx`, `src/app/(app)/meal-plan/page.tsx`, `src/app/page.tsx`, and `src/lib/stripe.ts`.
   - Delete dead files: `src/lib/ai.ts` and `src/components/recipes/RecipeCard.tsx`.
3. **Low Priority (Enhancements)**:
   - Add `"type": "module"` to `package.json` to silence Node module warning.
   - Consider adding server-side auth token verification / rate limiting on `/api/extract-recipe`.
