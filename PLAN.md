# CampUs — Build Plan

Working checklist for the CampUs app. Check items off (`- [x]`) as they're completed.
Full rationale lives in the approved plan at
`C:\Users\kiroe\.claude\plans\plan-mode-prompt-you-nested-muffin.md`. Visual
design tokens, palette, typography, and navigation IA live in
[`DESIGN.md`](./DESIGN.md) — this file is the day-to-day build tracker.

Repo root for all paths below: `CampUs/` (Expo Router SDK 57, `src/` variant —
router root is `CampUs/src/app/`).

**Revision note (1)**: this originally scoped a phased rollout (product
ordering only, with courier delivery and appointment booking deferred to later
phases). That's changed — all three vendor offering types (**product**,
**service**, **courier**) are now being built together, in one merged build.

**Revision note (2)**: navigation IA is now resolved (see `DESIGN.md`) — student
nav is 5 tabs (Home, Cart, Orders, Wallet, Profile), with Wallet promoted out of
Profile into its own top-level tab. Also added: a **standalone delivery/errand
request** feature — "Send a Delivery" on the student Home feed lets a student
request a courier for an arbitrary pickup/dropoff task with no parent vendor
order, not just as a fulfillment method on a product order. This required
loosening `delivery_jobs` so it can exist independent of `orders` — see
Milestone 8 below, which now covers both delivery paths.

---

## Locked-in decisions
- Auth: Clerk, Google + Apple sign-in only. No email/password, no phone/OTP.
- Roles: Student and Vendor on one `profiles` row, switchable. A vendor account
  has one fixed **offering type** chosen at application: **product** (sell
  items), **service** (bookable appointments), or **courier** (claim delivery
  jobs from any vendor's orders). All three need manual admin approval.
- Money: wallet-only, funded via Paystack. Flat per-order platform fee. Flat
  per-delivery courier fee.
- Fulfillment: product orders are pickup or delivery; delivery orders spawn a
  claimable `delivery_jobs` row once the vendor accepts. Service bookings are
  always in-person, no delivery leg. Separately, students can also request a
  **standalone delivery/errand** (no parent order) directly from Home — same
  `delivery_jobs` table, `source='errand'`, claimable immediately (no
  vendor-accept gate since there's no vendor prep step).
- Multi-university data model from day one.
- Admin: plain `/admin/*` web routes in the same Expo Router app, gated by `is_admin`.
- Jobs: Inngest (dev server locally — no EAS Hosting deploy yet).
- Neon Postgres + Drizzle, ImageKit, Sentry, Expo push + polling (no websockets).
- Service `no_show` appointments are **refunded to the student** (confirmed
  decision — flagged as a possible abuse vector to watch).

---

## 0. Project setup
- [ ] Change `app.json` `web.output` from `"static"` to `"server"`
- [ ] Add Clerk/Sentry config plugins to `app.json` as their installers require
- [ ] Install auth deps: `@clerk/expo`, `@clerk/expo-google-signin`,
      `expo-secure-store`, `expo-apple-authentication`
- [ ] Install data deps: `drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`
- [ ] Install jobs dep: `inngest`
- [ ] Install image deps: `imagekit`, `imagekit-javascript`, `expo-image-picker`
- [ ] Install monitoring: run `npx @sentry/wizard@latest -i reactNative`
      (`@sentry/react-native`, not deprecated `sentry-expo`)
- [ ] Install notifications dep: `expo-notifications`
- [ ] Create `.env` / `.env.example` with all required vars (client `EXPO_PUBLIC_*`
      + server-only keys — see plan file §1)
- [ ] Confirm dev workflow: `expo run:ios` / `expo run:android` (Expo Go won't work
      once native modules are in)

## 1. Foundation (Milestone 1)
- [ ] Write Drizzle schema (`src/db/schema.ts`) covering **all** tables up front:
      universities, campuses, profiles, categories (with `kind`: product|service),
      vendor_profiles (with `offering_type`, `vehicle_mode`, `category_id`),
      products, services, service_availability, appointments,
      delivery_jobs (with `source`: order|errand — `order_id` nullable,
      `requester_profile_id` NOT NULL, `vendor_profile_id` nullable,
      `pickup_note`, `dropoff_note`, `item_description`),
      orders (with `fulfillment_type`, `delivery_fee_minor` — `dropoff_note`
      lives on `delivery_jobs`, not `orders`, so it works for both sources),
      order_items, wallets (with `kind`: student|vendor|courier),
      wallet_transactions, paystack_transactions, payment_methods,
      favorite_vendors, push_tokens
- [ ] Enable `btree_gist` extension on Neon; add the appointments exclusion
      constraint (`EXCLUDE USING gist ...`) — confirm Neon supports it early
      (spike), fallback is a `SERIALIZABLE` transaction with an overlap check
- [ ] Write `src/db/client.ts` (neon-http + neon-serverless/pool instances)
- [ ] Provision Neon dev database, run first `drizzle-kit push`/migration
- [ ] Write `src/db/seed.ts` (1 university, 2 campuses, product + service
      categories, 1 admin profile)
- [ ] Set up Clerk dashboard: Google provider, Apple provider, webhook endpoint
- [ ] Set up Sentry project, confirm DSN wired
- [ ] Build `src/app/_layout.tsx`: `ClerkProvider` + `SessionProvider` + Sentry init
- [ ] Build `lib/auth.ts` helpers: `requireProfile`, `requireAdmin`,
      `requireVendorOwner`
- [ ] Build `api/me+api.ts` (lazy-create profile) and `webhooks/clerk+api.ts`
      (svix-verified `user.created/updated/deleted`)
- [ ] Build `(auth)/welcome.tsx` ("I'm a student" / "I'm a vendor")
- [ ] Build `(auth)/sign-in.tsx` (Google/Apple buttons, `?role=` param)
- [ ] Build `(auth)/student-onboarding.tsx` (pick university/campus, name)
- [ ] Wire route guards (`Stack.Protected`/`Tabs.Protected`) for `(auth)`,
      `(student)`, `(vendor)`, `admin`
- [ ] Verify: splash → welcome → Google/Apple sign-in → lands on empty
      authenticated placeholder screen

## 2. Vendor onboarding + admin approval — all three offering types (Milestone 2)
- [ ] Build `(auth)/vendor-application/offering-type.tsx` — "What will you
      offer?" 3-card picker (Sell products / Offer a service / Deliver for others)
- [ ] Build `product-details.tsx` (category icon-grid picker, campus, shop/stand
      address, description)
- [ ] Build `service-details.tsx` (service-type icon-grid picker — nails, lashes,
      braiding, barbing, makeup, other — campus, description)
- [ ] Build `courier-details.tsx` (vehicle mode picker: car / bicycle / foot,
      campus/coverage)
- [ ] Build one shared icon-grid picker component, fed by `categories` filtered
      on `kind`, reused by both product and service detail screens
- [ ] Build shared `cover-photo.tsx` step (all three types)
- [ ] Build `api/imagekit/auth+api.ts` + wire `imagekit-javascript` client upload
- [ ] Build shared `bank-details.tsx` step (bank name, account number, Paystack
      account-name resolution) — all three types
- [ ] Build shared `review.tsx` (offering_type-conditional summary) and submit
- [ ] Build `api/vendor-applications+api.ts` (typed payload per offering_type,
      server validates required fields per type) and
      `api/vendor-applications/[id]+api.ts`
- [ ] Build shared `pending.tsx` status screen (offering_type-aware copy) and
      green-checkmark verified screen on approval
- [ ] Build `admin/index.tsx` (pending applications list, offering_type
      badge/filter) and `admin/applications/[id].tsx` (shared fields + conditional
      type-specific block + approve/reject)
- [ ] Build `api/vendor-applications/[id]/approve+api.ts` (branches on
      offering_type to create `wallets` row with the right `kind`) and
      `.../reject+api.ts`
- [ ] Set up `lib/inngest/client.ts` and `api/inngest+api.ts` (`serve()` endpoint)
      — first real Inngest function proven working here (treat as a spike)
- [ ] Build `lib/inngest/functions/vendor-application.ts` (approved/rejected →
      notification dispatch)
- [ ] Build `lib/inngest/functions/notifications.ts` (Expo push send, reads
      `push_tokens`)
- [ ] Verify: submit one test application of each offering type → approve/reject
      each from `/admin` (web) → push notification fires → correct wallet kind
      created → vendor tabs unlock appropriately (or stay locked)

## 3. Product catalog (Milestone 3)
- [ ] Build `(vendor)/_layout.tsx` — single group, `Tabs.Protected` by
      `offering_type` (product tabs now; service/courier tabs stubbed
      "coming soon" until milestones 6/8)
- [ ] Build vendor `(vendor)/products/` tab: list, `new.tsx`, `[id]/edit.tsx`
      (CRUD, ImageKit product photo upload)
- [ ] Build `api/products+api.ts` and `api/products/[id]+api.ts`
- [ ] Build student `(student)/index.tsx` Home — search bar + category row
      (Explore's browse/search functionality lives here, not a separate tab),
      featured banner, and a mixed vertical feed showing product vendor cards,
      service provider cards (action-labeled "Book"), and a "Send a Delivery"
      card (courier accent, links to the errand-request flow in Milestone 8) —
      only `status: approved` vendors
- [ ] Build `(student)/vendor/[id].tsx` (vendor detail + product list)
- [ ] Build `(student)/product/[id].tsx` (product detail)
- [ ] Confirm bottom nav is 5 tabs: Home, Cart, Orders, Wallet, Profile (Wallet
      route group moves out from under Profile — see Milestone 4)
- [ ] Verify: vendor creates products with photos → visible correctly on student
      Home/vendor/product screens; service and courier cards render correctly
      in the mixed feed once milestones 6/8 land

## 4. Wallet & Paystack top-up (Milestone 4)
- [ ] Build `lib/paystack.ts` (fetch wrappers: initialize, verify, transfer, resolve)
- [ ] Build `api/wallet/topup+api.ts` (creates pending `paystack_transactions`,
      calls `transaction/initialize`)
- [ ] Build `api/webhooks/paystack+api.ts` (HMAC-SHA512 verify raw body, idempotent
      credit via `neon-serverless` pool transaction, unique `idempotency_key`)
- [ ] Build `(student)/wallet/index.tsx` — top-level Wallet tab: balance card,
      quick top-up amount chips (₦1,000 / ₦2,000 / ₦5,000 / Custom), opens
      checkout via `WebBrowser.openAuthSessionAsync`, polls
      `api/wallet/transactions` after redirect, transaction history list
- [ ] Build `api/wallet/transactions+api.ts`
- [ ] Capture reusable card authorizations into `payment_methods`
- [ ] Build `(student)/wallet/payment-methods.tsx`
- [ ] Verify: test-mode top-up completes, webhook credits wallet exactly once even
      if the webhook is resent (idempotency check)

## 5. Product ordering & lifecycle — pickup only (Milestone 5)
- [ ] Build local cart state (client-side, e.g. Zustand) + `(student)/cart.tsx`
- [ ] Build `(student)/checkout.tsx`
- [ ] Build `api/orders+api.ts` (POST place order — one Postgres transaction:
      validate price/availability, atomically debit wallet, insert order + items;
      `fulfillment_type` always `pickup` for now)
- [ ] Build `lib/constants.ts` with `PLATFORM_FEE_MINOR`, `COURIER_FEE_MINOR`,
      `ORDER_ACCEPT_TIMEOUT_MINUTES`, `APPOINTMENT_CONFIRM_TIMEOUT_MINUTES`
- [ ] Build `lib/inngest/functions/order-lifecycle.ts`: on `order/placed` notify
      vendor + `step.waitForEvent` timeout → auto-cancel + refund
- [ ] Build `api/orders/[id]/accept+api.ts`, `.../ready+api.ts`,
      `.../complete+api.ts` (credits vendor wallet), `.../cancel+api.ts` (refunds
      student wallet)
- [ ] Build `api/orders/[id]+api.ts` (detail) and `api/orders+api.ts` (list)
- [ ] Build `(student)/orders/index.tsx`, `(student)/orders/[id].tsx`
- [ ] Build `(vendor)/orders/index.tsx`, `(vendor)/orders/[id].tsx`
- [ ] Wire client polling (refetch-on-focus + ~10–15s interval) on non-terminal
      order screens
- [ ] Verify: full order flow placed → accepted → ready → completed with correct
      wallet debits/credits; verify timeout auto-cancel path via Inngest dev UI

## 6. Service catalog + availability + booking (Milestone 6)
- [ ] Build `(vendor)/services/` tab: CRUD on `services` (name, description,
      duration, price)
- [ ] Build `(vendor)/services/availability.tsx` (recurring weekly windows +
      date-specific overrides)
- [ ] Build `api/services+api.ts`, `api/services/[id]+api.ts`,
      `api/services/[id]/availability+api.ts`
- [ ] Build `api/services/[id]/slots+api.ts` (on-demand slot computation from
      availability + existing appointments — no materialized slots table)
- [ ] Build student service browse flow: service list on vendor detail → service
      detail → date/slot-grid screen → confirm
- [ ] Build `api/appointments+api.ts` (POST book — re-verify slot open, insert
      protected by exclusion constraint + debit wallet in one transaction; handle
      the race-lost/slot-taken error path)
- [ ] Build `api/appointments/[id]+api.ts`,
      `.../confirm+api.ts`, `.../complete+api.ts`, `.../cancel+api.ts`,
      `.../no-show+api.ts` (no-show refunds the student per confirmed decision)
- [ ] Build `(vendor)/bookings/` tab (incoming appointments list/detail,
      confirm/complete/cancel/no-show actions)
- [ ] Build `(student)/orders/` (or equivalent) view for upcoming/past appointments
- [ ] Build confirm-timeout via Inngest `step.waitForEvent` (mirrors order accept
      timeout)
- [ ] Build `lib/inngest/functions/appointment-reminders.ts` (`sleepUntil`
      24h-before and 1h-before pushes, `cancelOn` matching `appointment/cancelled`)
- [ ] Verify: book a slot, confirm the exclusion constraint rejects a
      simulated double-booking race, walk through
      booked→confirmed→completed/cancelled/no_show, confirm reminders fire (and
      cancel correctly) via Inngest dev UI

## 7. Vendor payouts, generalized (Milestone 7)
- [ ] Build Paystack transfer recipient creation (on approval or first payout
      request), store `recipient_code` on `vendor_profiles`
- [ ] Build `api/vendor/payout+api.ts` (atomic conditional wallet debit, emits
      Inngest event) — works for product/service `kind='vendor'` wallets now;
      courier wallets exercised in milestone 8
- [ ] Build `lib/inngest/functions/payouts.ts` (batches payout events, calls
      Paystack Transfer API)
- [ ] Handle `transfer.success` / `transfer.failed` / `transfer.reversed` webhooks
      (update `paystack_transactions`, credit wallet back on failure/reversal)
- [ ] Build `(vendor)/wallet/index.tsx`, `(vendor)/wallet/payout.tsx`
- [ ] Note: enable "disable OTP for transfers" in Paystack dashboard before this
      can run unattended
- [ ] Verify: payout request debits wallet immediately, Inngest batches + calls
      Paystack, webhook updates status correctly, reversal credits wallet back

## 8. Courier + delivery marketplace (Milestone 8)

Two ways a `delivery_jobs` row can now come into existence — build both, since
they share almost all downstream mechanics (claim, pickup, delivery, payout):
**(a) order-sourced** (existing design: spawned from a product order placed
with `fulfillment_type='delivery'`) and **(b) errand-sourced** (new: a student
requests a courier directly from Home for an arbitrary pickup/dropoff task, no
vendor or order involved).

**Order-sourced delivery**
- [ ] Add real `fulfillment_type: 'delivery'` option to student checkout
- [ ] Build `delivery_jobs` row creation at order placement (`source='order'`,
      status `awaiting_vendor`, `dropoff_note` copied from checkout input) when
      `fulfillment_type='delivery'`
- [ ] Wire `orders/[id]/accept` to flip the linked `delivery_jobs.status` to
      `open`

**Errand-sourced delivery (standalone "Send a Delivery")**
- [ ] Build `(student)/send-delivery.tsx` — request form: pickup note, dropoff
      note, item description, fee display (flat `COURIER_FEE_MINOR`, same
      constant as order-delivery fees), "Confirm & pay" button
- [ ] Wire the Home feed's "Send a Delivery" card to open this screen
- [ ] Build `POST /api/delivery-jobs+api.ts` (student-initiated) — atomically
      debits the requester's wallet, inserts a `delivery_jobs` row directly as
      `source='errand'`, `status='open'` (skips `awaiting_vendor` — no vendor
      prep step to wait on), `requester_profile_id=self`, `vendor_profile_id`
      and `order_id` both null. Emits `delivery_job/requested` for courier
      notification.
- [ ] Build `POST /api/delivery-jobs/[id]/cancel+api.ts` — requester-only,
      only while `status='open'` (not yet claimed) — refunds the wallet
- [ ] Build `GET /api/delivery-jobs/requested+api.ts` — a student's own
      errand requests (active + history)
- [ ] Build a merged view on `(student)/orders/` (or equivalent) showing both
      order-tracking and errand-tracking entries together, sorted by recency

**Shared mechanics (both sources)**
- [ ] Build `api/delivery-jobs+api.ts` GET (open feed, campus-filtered — shows
      both order- and errand-sourced jobs mixed, couriers don't need to care
      which) and `api/delivery-jobs/mine+api.ts` (courier's claimed/history)
- [ ] Build `api/delivery-jobs/[id]/claim+api.ts` (atomic conditional claim —
      409 if already claimed)
- [ ] Build `api/delivery-jobs/[id]/picked-up+api.ts`, `.../delivered+api.ts`
      (credits courier wallet; additionally auto-completes the linked
      `orders` row **only when `order_id` is present** — errand jobs just
      finalize + notify the requester directly), `.../fail+api.ts`
- [ ] Build `(vendor)/jobs/` tab, labeled "Deliveries" in the courier bottom
      nav (open job feed + claim, courier only)
- [ ] Build `(vendor)/deliveries/` tab, labeled "My Deliveries" in the courier
      bottom nav (claimed + history, courier only)
- [ ] Build combined delivery order-status display on
      `(student)/orders/[id].tsx` for order-sourced deliveries (Placed →
      Preparing → Finding a courier → Courier assigned → Picked up →
      Delivered), and a simpler Requested → Courier assigned → Picked up →
      Delivered tracker for errand-sourced ones
- [ ] Verify: place a delivery order, vendor accepts → job becomes claimable;
      separately, request a standalone errand → job is immediately claimable
      with no vendor-accept step; second courier's claim attempt on an
      already-claimed job (either source) gets rejected (409); full
      picked_up→delivered flow credits courier wallet and, for order-sourced
      jobs only, auto-completes the order; cancel an unclaimed errand and
      confirm the wallet refund

## 9. Notifications polish (Milestone 9)
- [ ] Build push token registration flow (`push_tokens` table, prompt on
      first relevant screen)
- [ ] Wire remaining event notifications (order placed/accepted/ready/completed/
      cancelled, appointment booked/confirmed/reminders/cancelled/no-show,
      delivery job open/claimed/picked-up/delivered for both order- and
      errand-sourced jobs, payout processed)
- [ ] Build denied-permission fallback copy/UI

## 10. Hardening (Milestone 10)
- [ ] Add Sentry error boundaries/breadcrumbs on client screens
- [ ] Add Sentry capture in every `+api.ts` handler's catch path
- [ ] Audit every `+api.ts` handler for ownership/authorization checks,
      including claim/pickup/delivery and appointment endpoints
- [ ] Fill in empty/error states across all screens
- [ ] Expand seed data for realistic QA (more vendors of each type,
      products/services/orders/appointments/deliveries)
- [ ] Build remaining profile screens: `(student)/profile/favorites.tsx`,
      `(student)/profile/help.tsx`, `(vendor)/profile/edit-application.tsx`
- [ ] Full end-to-end pass through the verification checklist in the plan file §9

---

## Open items to revisit
- [ ] Confirm `ready → cancelled` should stay disallowed for pickup orders
- [ ] Set exact `PLATFORM_FEE_MINOR` and `COURIER_FEE_MINOR` values
- [ ] Confirm who absorbs Paystack's own processing fee (currently: platform)
- [ ] Watch for no-show abuse (repeated book-and-skip) now that no-shows are
      refunded — may need a policy change later (e.g. a strike system) if abused
- [ ] Design a real resolution for unclaimed delivery jobs (currently: manual/
      support escalation, no auto-cancel) — applies to errand-sourced jobs too
- [ ] Consider vehicle-mode-based job filtering for couriers once there's a real
      heuristic to filter against (distance/size)
- [ ] Confirm errand delivery fee should reuse the flat `COURIER_FEE_MINOR`
      constant (assumption) rather than a distance/size-based or
      student-set price — flat fee was the existing model for order-sourced
      deliveries, applied here for consistency, not separately confirmed
- [ ] Confirm whether a platform fee applies to standalone errand requests the
      way `PLATFORM_FEE_MINOR` applies to product orders (currently: no —
      only the courier fee is charged, assumption)
- [ ] Set up EAS Hosting deploy once the app is worth deploying (not day-one work)
