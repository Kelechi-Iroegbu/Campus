# CampUs — Design System Reference

Source of truth for visual tokens and navigation IA. Build/feature scope lives in
`PLAN.md`; this file is the design counterpart, kept separate so PLAN.md stays a
build tracker instead of absorbing a full visual spec.

Aesthetic direction: "a cozy campus neighborhood market digitized into a
polished mobile app" — warm, editorial, premium, not corporate/fintech-blue, not
boxy or cluttered. Ultra-modern 2026 startup feel, light mode first.

## Color tokens

| Token | Value | Use |
|---|---|---|
| Background — white | `#FFFFFF` | base |
| Background — cream | `#FBF3EC` | base |
| Primary gradient | `#FF6B4A → #FF9A3C` | primary CTAs, active tabs, logomark, promo banners |
| Text — charcoal | `#1F1F1F` | primary text |
| Text — warm gray | `#8A8A8A` | secondary text |
| Input/inactive fill | `#FDEAE0` | text inputs, inactive chips |
| Success green | `#3FA65A` | open-now, success states, earnings, positive wallet entries |
| Rating amber | `#F6B93B` | star ratings |

**Vendor-type accents** — used consistently anywhere an offering type needs a
visual identity (badges, icons, tags, list-card borders):

| Type | Swatch | Value |
|---|---|---|
| Product | peach/orange | `#FFB88C` |
| Service | blush pink | `#F7C6D9` |
| Courier | powder blue | `#BFD7EA` |

**Category pastel palette** (product + service category tiles): peach, butter
yellow, blush pink, powder blue, mint, lavender.

## Typography

Clean modern sans-serif (Inter / SF Pro style). Bold confident headings, medium
subheads, readable body. Metadata rendered as pills (`15–20 min`, `4.8 ★`,
`0.4 km`, `Open`, `Book`, `Send`). Wallet balances and prices use large,
high-contrast tabular numerals.

## Component rules

- Corner radius ~16–20px on every card, input, sheet, and major button
- Pill-shaped buttons, chips, and search bars throughout
- Subtle shadows, gentle depth — never flat, never heavy
- Generous spacing, editorial layout, never dense/cluttered

## Navigation IA (resolved)

**Student** — 5 tabs: Home, Cart, Orders, Wallet, Profile.
Explore's search/category-browse functionality lives inside Home (search bar +
category row), not a separate tab. Wallet is a top-level tab (balance,
top-up, quick-amount chips, transaction history) rather than nested inside
Profile.

**Product vendor** — 5 tabs: Home (dashboard), Orders, Products, Wallet, Profile.

**Service vendor** — 5 tabs: Home (dashboard), Bookings, Services, Wallet, Profile.
(Availability management is a screen reached from Services, not its own tab.)

**Courier** — 4 tabs: Deliveries (open job feed — this is the courier's home,
no separate dashboard), My Deliveries (claimed + history), Wallet, Profile.

## Home feed composition (student)

The main feed mixes all three vendor types in one vertical list, each styled
consistently but action-labeled per type:
- Product vendor card → photo, rating, category, distance, prep time, open
  status, product accent color, tap opens vendor detail with an "Order" flow
- Service provider card → photo, rating, service category, duration, distance,
  service accent color, **"Book"** action (not "Order")
- "Send a Delivery" card → courier accent color, estimated time + delivery fee,
  **"Send"** action → opens the standalone errand-request flow (see PLAN.md
  Milestone 8 — this is a real feature, not just a shortcut into vendor browse)

## Screen inventory

Full screen-by-screen mockup briefs (copy, layout, icon choices) were developed
as a set of image-generation prompts across this project's conversation history:
a shared design-system block plus six batches — (1) Onboarding/Auth/Student
core, (2) Vendor application (shared branching flow across product/service/
courier), (3) Product vendor dashboard, (4) Service vendor dashboard +
student booking flow, (5) Courier dashboard, (6) navigation + component sheet.
Regenerate/reference those prompts directly for mockup work; this file captures
the tokens and decisions extracted from them that affect actual implementation.

Notable screen-level copy/behavior decisions worth preserving for implementation:
- Splash: "CampUs" wordmark ("Camp" charcoal + "US" coral-orange), tagline
  "Food · Service · Delivery"
- Welcome: headline "Campus delivery, made for everyone."
- Vendor application step 1 headline: "What will you offer?" — three rows
  (Sell products / Offer a service / Deliver for others), each with its type
  accent color and a chevron
- Application review screen shows the applicant's chosen offering type as a
  colored badge matching its accent
- Pending screen: "Your application is under review." with a ghosted preview
  of the eventual dashboard
- Verified screen: large soft-green circular checkmark, "You're approved!",
  CTA "Go to your dashboard"
- Wallet quick top-up amounts: ₦1,000 / ₦2,000 / ₦5,000 / Custom
- Delivery order status timeline (distinct from pickup): Placed → Preparing →
  Finding a courier → Courier assigned → Picked up → Delivered
