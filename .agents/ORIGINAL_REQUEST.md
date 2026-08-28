# Original User Request

## 2026-08-28T12:07:13Z

Add monetization features to the PlateUp app — a Next.js 15 recipe extraction and meal planning web app using TypeScript, Tailwind CSS, shadcn/ui, Firebase (Auth + Firestore), and Google Generative AI. The app is functional and deployed. Add two revenue streams: (1) affiliate shopping links that let users order ingredients from their shopping list or recipe via partner stores, and (2) a freemium tier system with usage-gated AI extractions, a Pro subscription via Stripe, and an upgrade page.

Working directory: /Users/CLD/.gemini/antigravity/scratch/plateup
Integrity mode: development

## Requirements

### R1. Affiliate shopping integration
Add an "Order Ingredients" call-to-action on the Shopping List page and on individual recipe detail pages. When clicked, it should open a partner grocery store (Amazon Fresh or Instacart) with the ingredients pre-populated as a search query. Use affiliate URL parameters so purchases generate referral commission. The button should be prominent but not disruptive to the existing UX. Include a small "affiliate link" disclosure near the button for transparency.

### R2. Freemium tier system with usage tracking
Implement a free vs Pro tier system. Track each user's monthly AI extraction count (YouTube + Photo combined) in Firestore. Free tier users get 5 AI extractions per month. When they hit the limit, show a friendly upgrade prompt instead of the extract button. Pro users get unlimited extractions. The extraction counter should reset monthly. Display the user's remaining extractions on the Extract page (e.g., "3 of 5 free extractions remaining"). The Discover page (TheMealDB browsing) should remain completely free and unlimited for all users.

### R3. Pro upgrade page and Stripe checkout
Create a `/pricing` page showing the Free vs Pro comparison. Include a "Go Pro" button that initiates a Stripe Checkout session for $4.99/month recurring. On successful payment, update the user's Firestore profile to `plan: 'pro'` with the subscription ID. Add a subscription management section to the Profile page where Pro users can see their plan status. For now, use Stripe test mode so no real charges occur during development. Store the Stripe secret key as an environment variable (`STRIPE_SECRET_KEY`) and the publishable key as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

### R4. Navigation and UI integration
Add a "Pro" badge or crown icon next to the user's avatar in the navbar when they are a Pro subscriber. Add a "Pricing" link accessible from the landing page and from within the app. The upgrade prompts throughout the app should feel encouraging, not punishing — emphasize what Pro unlocks rather than what Free lacks.

## Acceptance Criteria

### Build Health
- [ ] `npx tsc --noEmit` completes with zero TypeScript errors
- [ ] `npm run build` completes with zero errors
- [ ] All existing tests continue to pass

### Affiliate Links
- [ ] Shopping List page has a visible "Order Ingredients" button
- [ ] Recipe detail page has an "Order Ingredients" button
- [ ] Clicking the button opens an external grocery store URL with ingredient search terms
- [ ] Affiliate disclosure text is visible near the button
- [ ] Links work correctly (valid URLs with affiliate parameters)

### Freemium System
- [ ] New users start with `plan: 'free'` and `extractionsThisMonth: 0` in Firestore
- [ ] Each YouTube or Photo extraction increments the user's monthly extraction count
- [ ] Free users are blocked from extracting after 5 extractions with a friendly upgrade prompt
- [ ] Pro users can extract unlimited recipes
- [ ] The Extract page shows remaining extraction count for free users
- [ ] Discover page (TheMealDB) works with no limits for all users
- [ ] Monthly extraction count resets (tracked by month/year in Firestore)

### Pricing Page
- [ ] `/pricing` page renders with Free vs Pro comparison table
- [ ] "Go Pro" button exists and initiates Stripe Checkout (test mode)
- [ ] Successful Stripe checkout updates user's plan to 'pro' in Firestore
- [ ] Profile page shows current plan status for Pro users

### UI Integration
- [ ] Pro users have a visual indicator (badge/icon) in the navbar
- [ ] Upgrade prompts are friendly and non-punishing in tone
- [ ] Pricing page is linked from the landing page and in-app navigation
