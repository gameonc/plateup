# QA Testing and Bug Fixing Plan: PlateUp

## Objective
Execute a comprehensive QA testing and bug fixing pass across all core flows in the PlateUp web application, verify build and test health, and ensure 100% compliance with `ORIGINAL_REQUEST.md`.

## QA Scope & Flow Breakdown
1. **Flow 1: Authentication & Navigation**
   - Email sign-up/in/out, Google sign-in popup, AuthGuard redirect with intent, error states
2. **Flow 2: Recipe Extraction**
   - YouTube URL extraction via route handler and Gemini AI
   - Food photo extraction via Gemini multimodal vision
   - Save to collection in Firestore, error toast/alerts
3. **Flow 3: Discover (TheMealDB)**
   - TheMealDB search, category filters, Surprise Me, recipe detail dialog, save to Firestore
4. **Flow 4: Recipe Collection**
   - Saved recipes list, search/sort, dietary filter chips, recipe detail view, 1-5 star rating persistence, "I Made This" cook count increment
5. **Flow 5: Meal Planner**
   - 7 days x 3 meals calendar, manual picker assignment, auto-fill from saved recipes, week navigation, slot removal
6. **Flow 6: Shopping List**
   - Generate from meal plan, deduplicate/combine ingredients with fraction math, check off items persistence, clear checked/clear all
7. **Flow 7: Dietary Preferences**
   - Profile dietary restrictions toggle, Select All / Clear All, meal time preferences
8. **Flow 8: Mobile Responsiveness & Build/Test Health**
   - 375px viewport verification, mobile bottom nav, no overflow or clipping, zero type errors, clean build, >=696 tests passing

## Execution Phases
- **Phase 1: Deep QA Exploration (3 Explorers in parallel)**
  - Explorer 1: Auth, Discover, Recipe Collection, Rating, Cook Tracker
  - Explorer 2: YouTube Extraction, Photo Extraction, Meal Planner, Shopping List, Dietary Preferences
  - Explorer 3: Mobile UI (375px), Error Boundaries, Build Health, Test Suites
- **Phase 2: Worker Remediation (if issues found)**
  - Fix any identified edge cases, type issues, or UI defects
- **Phase 3: Independent Review & Adversarial Verification**
  - 2 Reviewers, 2 Challengers
- **Phase 4: Forensic Audit & Gate Sign-off**
  - 1 Forensic Auditor for integrity check
  - Final synthesis, handoff report, and user notification
