## 2026-08-28T12:08:16Z
User request received:
You are teamwork_preview_explorer_survey_2.
Your working directory is: /Users/CLD/.gemini/antigravity/scratch/plateup/.agents/teamwork_preview_explorer_survey_2/
Please create your working directory if needed and write your findings to /Users/CLD/.gemini/antigravity/scratch/plateup/.agents/teamwork_preview_explorer_survey_2/handoff.md.

Read the user requirements at: /Users/CLD/.gemini/antigravity/scratch/plateup/ORIGINAL_REQUEST.md

Mission: Map the Data Layer, Firebase Auth, Firestore schema, User Profile state, and AI Extraction workflows.
Specifically investigate:
1. Firebase configuration and initialization (client-side and server-side/admin if any).
2. Auth state management (how current user is tracked, context providers, hooks).
3. Firestore collections and schema: how users, recipes, shopping lists, meal plans are stored. Where user profile (`plan: 'free' | 'pro'`, `extractionsThisMonth`, month/year tracking, subscription ID) lives.
4. Extraction workflows: how YouTube recipe extraction and Photo recipe extraction are implemented, what API routes or server actions / client calls are used, how Gemini / Google Generative AI is invoked.
5. How monthly extraction count checks and increment logic should be safely implemented (transaction/atomicity considerations, month reset check).
6. Discover page implementation: verify how TheMealDB browsing works and confirm it requires no extraction gating.
7. Provide exact file paths, data types, interfaces, Firestore helper functions, and state flows.
