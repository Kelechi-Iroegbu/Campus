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

**Revision note (3)**: **the auth/registration/login screens themselves are
the user's, committed in PR #3 (`b8fbc7d`, branch `auth-design-screen`).
Claude does not redesign or lay out any of these files.** Routing-target
`onPress`/redirect-destination edits are allowed, but only with fresh
consent sought each time — never assumed from a prior session. The screens
(image-backed, with `<Pressable>` hotspots). Design source of truth is
`design/*.png`, all committed:
- `src/app/index.tsx` — splash. Image `welcome-screen.png`
  (= `design/Welcome-screen.png`). → `/register`. Self-redirects a signed-in
  user to `/post-auth`.
- `src/app/register.tsx` — role picker "Campus delivery, made for everyone" /
  "I'm a student" / "I'm a vendor". Image `registration-screen.png`
  (= `design/Registrationpage.png`). Both hotspots → `/sign-in?role=<picked>`.
- `src/app/sign-in.tsx` — Google / Apple SSO ("Student account · Switch"
  header, Continue with Google/Apple, OR, Log in, Sign up). Image
  `auth-screen.png` (= `design/New-Auth.png`, same layout). Uses Clerk
  `useSSO`; routes to `/post-auth` after `setActive` — see the **2026-09-15
  auth-flow rework** below for how the `role` param is now handled.
- `src/app/sign-up.tsx` — "Create your account" form (Full Name, Email, Phone,
  Bank, Bank Account Number, Account Name, Password, T&C). Design
  `design/Register-ui-design.png`. Uses `signUp.password(...)` → `/verify`.
  **Account Number / Matric No. field removed 2026-09-14** — `matricNo`
  stays wired end-to-end (Clerk `unsafeMetadata`, `profiles.matric_no`) as an
  already-optional, now-always-null field. **Personal bank account fields
  added 2026-09-14** — `profiles.bank_name` / `bank_account_number` /
  `bank_account_name` (nullable), a shared bank picker (`src/lib/banks.ts`,
  also used by `vendor-application/bank-details.tsx`), wired through Clerk
  `unsafeMetadata` → the webhook sync + `lazyCreateProfile`. Capture-only for
  now (no downstream use until wallet withdrawal, Milestone 7). **Android
  keyboard-covering-password-field bug fixed 2026-09-16** — the password
  input near the bottom of this long form was hidden behind the keyboard on
  Android; fixed with a `keyboardDidShow`-triggered scroll-into-view plus
  `KeyboardAvoidingView` height behavior (routing/behavior-only change, no
  visual redesign).
- `src/app/login.tsx` / `verify.tsx` / `reset-password.tsx` — email/password
  path. All three now route to plain `/post-auth` (no `register-profile`
  step — see below).

**Auth flow — reworked 2026-09-15/16, superseding the 2026-09-07 version.**
Still **SSO + email/password both**, role picked on `register.tsx`, but two
things changed:

1. **`register-profile.tsx` (Department/Level/photo onboarding) was deleted
   outright**, per the user's explicit decision. It had become structurally
   unreachable: `ensureCampusAssigned()` (`src/lib/auth.ts`) marks a profile
   "onboarded" on its very first `/api/me` call (a side effect of the
   single-campus auto-assign logic), which always happens before
   `landingRoute()`'s old `!me.isOnboarded` check could ever fire — so the
   screen never actually appeared, and its own "Save"/"Skip" buttons
   independently hardcoded `router.replace("/(tabs)")`, bypassing the
   routing system entirely. The `!me.isOnboarded` branch was removed from
   `landingRoute()` (`src/lib/session.tsx`) along with the screen.
2. **The student/vendor choice for a *returning* account moved from
   pre-auth to post-auth.** An earlier same-session attempt built a
   pre-auth `role`/`loginRole` split with a block-on-mismatch error screen,
   modeled on "a user can have separate student and vendor accounts under
   one email, picked at login." Checking that premise against Clerk's own
   Backend API found it didn't hold — Clerk enforces one account per
   verified email here; what looked like multiple accounts sharing an email
   in the `profiles` table (confirmed on two different test emails) turned
   out to be orphaned rows from deleted Clerk test users, not live
   multi-account support. That pre-auth mechanism was rolled back. The real
   design: one account optionally has one attached `vendor_profiles` row
   (unchanged schema), and `/post-auth` asks **"Continue as student or
   vendor?"** only the first time it's ambiguous (`vendor.status ===
   "approved" && !hasChosenRole`), reusing the `switchRole()`/`activeRole`
   mechanism from Milestone 1's role-switching work (below). A new
   `profiles.hasChosenRole` boolean (migrated 2026-09-16) records that the
   question's been answered, so it isn't asked again — the in-app "Switch to
   student/vendor mode" rows remain the way to change modes afterward.

Current flow:
```
index (splash)
  → register.tsx  (role picker — bootstrap hint only now)
       "I'm a student" → /sign-in?role=student
       "I'm a vendor"  → /sign-in?role=vendor
  → sign-in.tsx  (the hub)
       Continue with Google/Apple → SSO → new account (signUp result) ? /post-auth?role=<picked> : /post-auth
       "Log in"  → /login → always /post-auth (existing account, no role param — nothing to bootstrap)
       "Sign up" → /sign-up (+ role passthrough — new account)
  → sign-up.tsx  ("Create your account")  → signUp.password({unsafeMetadata:{role,...}})  → /verify
  → verify.tsx  (OTP)  → /post-auth?role=<picked, if any>
  → post-auth.tsx  — the one place this is all resolved:
       no vendor record + role=vendor  → /vendor-application/offering-type (bootstrap a new application)
       approved vendor, no preference yet (!hasChosenRole)  → "Continue as student or vendor?" picker
       otherwise  → straight to /(tabs), /vendor/dashboard, /courier/dashboard, or
                    /vendor-application/pending, per the account's actual state
```
Sign-out (`src/lib/useSignOut.ts`, used by all three profile screens) lands
on `/sign-in` — not the welcome splash, not a stale pre-auth picker.

There is **no `welcome.tsx`**, **no `register-profile.tsx`** (deleted, see
above), and **no university/campus picker** in onboarding —
`profiles.university_id` / `campus_id` are auto-assigned server-side by
`ensureCampusAssigned()` in `src/lib/auth.ts` (single-campus pilot, Revision
note (5)), so no auth screen needs to change to feed the data model.

**Process note (what went wrong, 2026-09-07):** during M1–M3 Claude edited
three committed auth screens in the working tree on `main` (`index.tsx`,
`sign-in.tsx`, and a full rewrite of `register-profile.tsx`) and added a
`welcome.tsx`. That collided with the user's uploaded auth work. All four were
reverted / deleted; the route gate was rewritten to be minimal (below) so it
never fights these screens.

**Revision note (4)**: navigation/route structure as actually built diverges
from the `(auth)`/`(student)`/`(vendor)` route-group design in `DESIGN.md`.
What exists now:
- Route groups are flat, not nested-with-guards: `src/app/(tabs)/` (student
  shell), `src/app/vendor/` (vendor shell), `src/app/courier/` (courier
  shell), `src/app/admin/` (web admin shell). All use `NativeTabs` from
  `expo-router/unstable-native-tabs`. `Stack.Protected`/`Tabs.Protected`
  route guards are **not wired yet**.
- Student tabs are **Home, Explore, Orders, Wallet, Profile** — not the
  "Home, Cart, Orders, Wallet, Profile" in `DESIGN.md`. There is no Cart
  tab; cart lives in the checkout flow (`src/app/checkout.tsx` + a
  `CartBar` component).
- **Explore is its own tab**, not folded into Home. It has sub-screens
  `(tabs)/explore/index.tsx` (+ `_layout.tsx`), `categories.tsx`,
  `nearby.tsx`, `search.tsx`. Home is still a mixed vendor feed; the
  category-browse/search surface is the Explore tab.
- **Courier is a dedicated top-level `src/app/courier/` shell**, not tabs
  under the vendor group. Screens: `dashboard.tsx`, `deliveries.tsx`,
  `profile.tsx`, `wallet/` (`index.tsx`, `all.tsx`). This replaces the
  Milestone 8 plan of `(vendor)/jobs/` + `(vendor)/deliveries/` tabs.
- `DESIGN.md`'s "Navigation IA (resolved)" section still describes the old
  layout and should be updated to match.

**Revision note (5)**: **no campus picker in any UI.** The pilot is a single
university — **Igbinedion University** — with a single campus (**Okada
Campus**). `seed.ts` inserts one of each. The `campuses` table, `campus_id`
FKs and campus-scoping all stay (the data model is still multi-university /
multi-campus per the locked-in decision), but every screen auto-assigns the
sole campus behind the university: onboarding (`register-profile.tsx`) shows
only the University dropdown, and the vendor-application detail screens
(`product`/`service`/`courier`) dropped their "Campus location" picker
(`useSoleCampus()` in `src/lib/refData.ts`).

---

## UI shells vs. real implementation

Static UI shells for most milestone screens (vendor application, product
catalog, checkout/orders, service booking, courier, vendor payouts, profile
sub-screens) are **already built** and navigable, wired to in-memory mock
stores under `src/data/` — not to the database or any `+api.ts` route.

**Marking convention (updated)**: a checklist item is now ticked `- [x]` once
its **screen / UI is built** (even if only a mock-backed shell), with a
trailing note spelling out what real work still remains (schema, API routes,
transactions, jobs, guards). Items that are purely backend (`+api.ts`
routes, schema, Inngest functions, `verify:` steps) stay unchecked until
that real work lands. So a ticked box here means "the screen exists and is
navigable", **not** "this milestone is production-done" — read the note.
New placeholder-only screens are **not** added as checklist items.

The one exception is **Milestone 4 (Wallet & Paystack)**, which is partly
implemented for real against Neon (see that section).

---

## Locked-in decisions
- Auth: Clerk. **Both** Google/Apple SSO **and** email/password + email-OTP
  (revised 2026-09-07 — the original "SSO only" is superseded; the user
  confirmed both after the built screens implemented both). `sign-in.tsx` is
  the hub. `register.tsx`'s role pick is now only a **bootstrap hint for
  brand-new sign-ups** (`?role=`, consumed by `landingRoute` only when the
  account has no vendor record yet); for a *returning* account, which side
  to land on is resolved by `/post-auth` from the account's own state
  (`activeRole`/`hasChosenRole`), not by anything picked before
  authenticating — revised 2026-09-15/16, see Revision note (3). Matric No.
  captured at email sign-up. Full flow + wiring in Revision note (3).
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
- Multi-university data model from day one (schema-level). Pilot ships with one
  university + one campus and **no campus picker** — see Revision note (5).
- Admin: plain `/admin/*` web routes in the same Expo Router app, gated by `is_admin`.
- Jobs: Inngest (dev server locally — no EAS Hosting deploy yet).
- Neon Postgres + Drizzle, ImageKit, Sentry, Expo push + polling (no websockets).
- Service `no_show` appointments are **refunded to the student** (confirmed
  decision — flagged as a possible abuse vector to watch).

---

## 0. Project setup
- [x] Change `app.json` `web.output` from `"static"` to `"server"` — done
      (`app.json` now has `"web": { "output": "server" }`)
- [x] Add Clerk/Sentry config plugins to `app.json` as their installers require
- [x] Install auth deps — actually installed: `@clerk/expo`, `expo-secure-store`,
      `expo-auth-session`, `expo-crypto` (hosted OAuth via `useSSO`, see
      Revision note (3) — `@clerk/expo-google-signin` / `expo-apple-authentication`
      native modules were **not** installed and aren't needed for this approach)
- [x] Install data deps: `drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`
- [x] Install jobs dep: `inngest` (installed and wired — `src/inngest/client.ts`,
      `api/inngest+api.ts` serve endpoint, Clerk user sync functions live
      already; full spike verification still tracked under Milestone 2)
- [x] Install image deps: `imagekit`, `imagekit-javascript`, `expo-image-picker`
      all installed (picker UI still built in Milestone 2)
- [x] Install monitoring: `@sentry/react-native` installed + config plugin wired,
      DSN in `_layout.tsx`
- [x] Install notifications dep: `expo-notifications` installed (registration
      flow built in Milestone 9)
- [x] Create `.env` / `.env.example` with all required vars — `.env.example`
      is committed (`.env` stays untracked)
- [~] Confirm dev workflow: `expo run:android` — needs a device/emulator, so
      left for the user to run. `expo run:ios` deferred (Apple sign-in is out of
      scope for now). Expo Go won't work — native modules are in.
- [x] Install auth-backend dep: `@clerk/backend` (server-side token
      verification in `lib/auth.ts`); `tsx` added dev-only for `db:seed`

## 1. Foundation (Milestone 1)

_Status: schema, auth backend, session context, route gate and the onboarding
screens are **built** (`npx tsc` clean). **`db:push` run by the user** — 18
tables created on the Neon dev branch, old `users`/wallet tables dropped.
Still to run: `db:seed` (also applies the `btree_gist` overlap constraint that
push skips) and a dev-build verify pass — see the "Apply" note below._

- [x] Write Drizzle schema (`src/db/schema.ts`) covering **all** tables up
      front — done: `universities`, `campuses`, `profiles` (was `users`),
      `categories` (`kind`), `vendor_profiles` (`offering_type`,
      `vehicle_mode`, `category_id`, `status`, bank + review fields),
      `products`, `services`, `service_availability`, `appointments`,
      `delivery_jobs` (`source` order|errand, `order_id` nullable,
      `requester_profile_id` NOT NULL, `vendor_profile_id` nullable,
      pickup/dropoff/item notes), `orders` (`fulfillment_type`,
      snapshot amounts), `order_items`, `wallets` (`kind`, FK → `profiles`),
      `wallet_transactions` (+ `related_order/appointment/delivery_job_id`),
      `paystack_transactions`, `payment_methods`, `favorite_vendors`,
      `push_tokens`. All money is `bigint` minor units.
- [~] Enable `btree_gist` + appointments exclusion constraint — `drizzle-kit
      push` **cannot** express an `EXCLUDE` constraint, so it's applied by
      `src/db/seed.ts` instead (idempotent `CREATE EXTENSION IF NOT EXISTS
      btree_gist` + a guarded `ALTER TABLE appointments ADD CONSTRAINT
      appointments_no_overlap EXCLUDE USING gist (vendor_profile_id WITH =,
      tstzrange(scheduled_start, scheduled_end) WITH &&) WHERE (status NOT IN
      ('cancelled','no_show')))`. Also still in `drizzle/0000_init.sql` for a
      `db:migrate`-based apply. Marked `[~]`: created in code, applied when the
      user runs `db:seed`. If Neon rejects `btree_gist`, seed logs a warning
      and the fallback is the `SERIALIZABLE` + overlap-check path in the
      Milestone 6 booking API.
- [x] `src/db/index.ts` (neon-http) + `src/db/pool.ts` (neon-serverless,
      transaction-capable) both built
- [x] Provision Neon dev database + apply schema. **Migrations squashed**:
      old `0000`–`0002` replaced by a single fresh `drizzle/0000_init.sql`
      (18 tables) because the `users`→`profiles` reshape needs interactive
      rename resolution. **Applied via `db:push`** (state-sync) — user
      confirmed the drops of `users` + the old wallet tables.
- [~] Write `src/db/seed.ts` — 1 university (**Igbinedion University**) + 1
      campus (**Okada Campus**), 5 product + 6 service categories, 1 admin
      profile, plus the `btree_gist`/overlap constraint. Idempotent.
      **Written, not yet run** — `SEED_ADMIN_CLERK_ID=<clerk id>
      SEED_ADMIN_EMAIL=<email> npm run db:seed`.
- [x] Clerk dashboard (Google provider) + svix webhook — done. Sync now
      writes the `profiles` table (`src/inngest/functions.ts`). Apple provider
      deferred (out of scope for now).
- [x] Set up Sentry project, confirm DSN wired
- [x] `src/app/_layout.tsx`: `ClerkProvider` + Sentry + now `<SessionProvider>`
      + a `RootNavigator` route gate
- [x] Build `lib/auth.ts` helpers — `verifyRequest` (real `@clerk/backend`
      `verifyToken`, JWKS-verified, no more unsigned decode), `getProfile`,
      `requireProfile` (lazy-creates via Clerk API backstop), `requireAdmin`,
      `requireVendorOwner`. `requireUser` kept as an alias for the M4 routes.
      Wallet routes + Paystack webhook repointed `users`/`userId` →
      `profiles`/`profileId`.
- [x] Build `api/me+api.ts` — GET (verified profile + derived flags, lazy
      create) and PATCH (onboarding: name, phone, university, campus, sets
      `onboarded_at`). Plus `api/universities+api.ts` and `api/campuses+api.ts`
      reference-list endpoints.
- [x] Build `webhooks/clerk+api.ts` — already built; sync target changed to
      `profiles`
- [x] Welcome / role-picker / auth / login screens — **the user's, committed
      in PR #3, layout untouched.** See Revision note (3) for the file list
      and what routing-target changes have been made since (with consent
      each time). Three were wrongly edited during M1–M3 and reverted to
      `b8fbc7d`; the stray `welcome.tsx` was deleted.
- [x] Build sign-in screen — the user's `src/app/sign-in.tsx`, layout
      untouched; its post-auth routing-target logic was reworked 2026-09-15
      (see Revision note (3)).
- [x] Student onboarding (Department + Level dropdowns) — **`register-profile.tsx`
      was deleted 2026-09-15**, per the user's decision, after this session's
      audit found it structurally unreachable (see Revision note (3) for
      why). The data model still gets `university_id` / `campus_id` from
      `ensureCampusAssigned()` in `src/lib/auth.ts` on the first
      authenticated `/api/*` call, unaffected by the deletion — nothing
      downstream depended on this screen ever running.
- [x] Wire route guards — `RootNavigator` in `src/app/_layout.tsx`, now
      **minimal**: (1) unauthenticated user inside `(tabs)`/`vendor`/`courier`/
      `admin` → `/`; (2) signed-in non-admin inside `/admin` → `/(tabs)`.
      Nothing else — the auth-funnel screens each self-redirect a signed-in
      user to `/post-auth`, and the gate must not fight that. `lib/api.ts`
      (`useApi`) is the authed fetch wrapper; `lib/session.tsx` holds
      `/api/me` (used for `isAdmin`, vendor status, and — as of 2026-09-15 —
      `activeRole`/`hasChosenRole` for the student↔vendor switch, see below).
- [x] **Student ↔ vendor role switching, built 2026-09-15.** `profiles.activeRole`
      is now the real, persisted, switchable source of truth for which side
      an approved-vendor account is currently using (was previously
      write-once by the admin-approval endpoint, never read by routing).
      `useSession()` exposes `switchRole()`; the vendor/courier profile
      screens' "Switch to student mode" row and a new student-profile
      "Switch to vendor mode" row (shown only when approved) both use it and
      persist across relaunch. `vendor/_layout.tsx` / `courier/_layout.tsx`
      also redirect out when `activeRole` doesn't match, closing a stale
      deep-link gap. Sign-out unified into one `src/lib/useSignOut.ts` hook
      (was 3x copy-pasted), all three sides now confirm before signing out.
      See Revision note (3) above for how this combines with the post-auth
      picker (`hasChosenRole`, migrated 2026-09-16) to ask once, not every
      login.
- [x] Verify (needs the DB seeded + a dev build) — **done 2026-09-15** on a real
      Android dev build (Samsung S23 Ultra): DB confirmed seeded (1 university,
      1 campus, 28 categories, a real admin profile). Signed-in user
      (`kiroegbu@gmail.com`) lands on `/(tabs)` and functions normally
      (product photo, profile photo uploads all worked end-to-end). `/api/me`
      auto-assigned `universityId`/`campusId` on first call — confirmed via DB
      query. `GET /api/me` with no token and with an invalid token both
      returned 401 — confirmed via curl against the running Metro instance.
      Admin routing (seeded admin reaches `/admin`; non-admin bounced) was
      **not** re-tested live this session — deep-linking directly into
      `/admin` from outside the app didn't work reliably in this dev-client
      build (Android delivered the intent but Expo Router didn't hand it off;
      likely a dev-client-only quirk, not an app bug). Verified instead by
      reading `src/app/_layout.tsx`'s `RootNavigator`: the gate correctly
      waits for `!sessionLoading` before checking `isAdmin` (avoids bouncing
      a real admin before their status loads), and redirects a non-admin
      `seg0 === "admin"` to `/(tabs)`. This matches the M2 section's earlier
      confirmed live test (admin approve/reject flow used `/admin` directly).
      **Note:** the currently-live `kiroegbu@gmail.com` account is no longer
      an admin (that Clerk user was deleted at some point; a newer account
      under the same email owns the approved "kjkj" vendor listing instead)
      — a fresh promotion via `SEED_ADMIN_CLERK_ID` is needed before `/admin`
      can be re-tested.
- [x] **Reworked auth-flow re-verify — 2026-09-15/16, real Android device.**
      Sign-out → lands on `/sign-in` (not the welcome splash). Login with an
      approved-vendor account whose `hasChosenRole` was still false → the new
      "Continue as student or vendor?" picker appeared exactly once; picking
      either set `activeRole` **and** `hasChosenRole=true` in the DB
      (confirmed via direct query); a second login with the same account
      skipped the picker and landed straight on the chosen side. The
      in-app "Switch to vendor mode" row correctly used the fresh
      post-switch session state to navigate (a stale-closure bug here was
      found and fixed live during testing). A brand-new sign-up choosing
      "I'm a vendor" still reaches `/vendor-application/offering-type`
      unaffected. Two Clerk-account-deletion-related test artifacts were
      found and worked around live rather than being genuine app bugs — see
      Revision note (3)'s account-uniqueness paragraph.

**Apply (user runs these — destructive DB writes are blocked in-session):**
1. ~~`npm run db:push`~~ — **done**: 18 tables created on the Neon dev branch,
   old `users` + wallet tables dropped (confirmed at the prompts).
2. `npm run db:seed` — reference data + the `btree_gist` overlap constraint
   `db:push` skipped. (Optionally `SEED_ADMIN_CLERK_ID=user_xxx
   SEED_ADMIN_EMAIL=<email>` to promote your own account.)
3. **Deferred by user (remind them):** `npx expo run:android` dev-build verify
   walk (sign-in → `register-profile` onboarding → tabs).
4. **Deferred by user (remind them):** promote own Clerk account to admin via
   `SEED_ADMIN_CLERK_ID=...` and confirm `/admin` gates correctly.

## 2. Vendor onboarding + admin approval — all three offering types (Milestone 2)

_Built this session (`npx tsc` + `eslint` clean). The `vendor-application/`
step screens are now wired to a real shared draft store + submit; the admin
review surface and the approve/reject + notification backend are real. Not yet
run against the live DB — needs `db:seed` + a dev build to verify (see the M1
Apply note). Still deferred: ImageKit cover-photo upload and Paystack
account-name resolution (Milestone 7)._

- [x] `vendor-application/offering-type.tsx` — writes `offeringType` into the
      shared draft (`src/lib/vendorApplication.tsx` provider, mounted by
      `vendor-application/_layout.tsx`), routes to the matching details screen.
      Signed-out `<Redirect>` guards removed from every step.
- [x] `product-details.tsx` — real category grid from `GET /api/categories?
      kind=product` + campus picker from `GET /api/campuses`, business-name
      field, writes to the draft
- [x] `service-details.tsx` — same, `kind=service`
- [x] `courier-details.tsx` — vehicle-mode picker + real campus picker +
      name/coverage, writes to the draft
- [x] Shared category source — `GET /api/categories` + `src/lib/refData.ts`
      (`useCategories(kind)` / `useCampuses()` hooks) feed both detail screens.
      Not a single shared *component* yet, but a single shared data source.
- [x] `cover-photo.tsx` — reachable + advances the flow; **real ImageKit
      upload wired 2026-09-14** (`useImageUpload` → `patch({ coverPhotoUrl })`),
      now that real ImageKit credentials exist. Still optional at submit.
- [x] ImageKit auth endpoint + `src/lib/imagekit.ts` — already built (M0); no
      picker calls `uploadImage()` yet
- [x] `bank-details.tsx` — bank / 10-digit account number / account name →
      draft. Paystack account-name resolution is Milestone 7 (applicant types
      it, admin eyeballs it).
- [x] `review.tsx` — renders the draft (offering-type-conditional), `submit()`
      → `POST /api/vendor-applications` → `session.refetch()` → `pending`
- [x] `api/vendor-applications+api.ts` — `POST` (upsert the caller's
      `vendor_profiles` row, per-type validation in `src/lib/vendorApplications.ts`,
      status → `pending`; 409 if already approved) and `GET` (admin review
      queue, `?status=`/`?offeringType=` filters). Plus
      `api/vendor-applications/mine+api.ts` and `.../[id]+api.ts` (owner-or-admin).
- [x] `pending.tsx` — polls `GET /api/vendor-applications/mine` every 5s while
      focused; `approved` → `approved.tsx`, `rejected` → shows the reason + an
      "Edit & resubmit" button. `approved.tsx` reads `offeringType` and routes
      to `/vendor/dashboard` or `/courier/dashboard`.
- [x] `admin/index.tsx` — real pending-applications list with offering-type
      badges + an all/product/service/courier filter; `admin/applications/[id].tsx`
      — full detail + Approve / Reject-with-reason. `/admin` is `is_admin`-gated
      by the route gate from M1.
- [x] `api/vendor-applications/[id]/approve+api.ts` — admin-only; in one
      `dbPool` transaction flips status → `approved` + creates the `wallets`
      row (`courier` kind for couriers, else `vendor`); emits
      `vendor/application.approved`. `.../reject+api.ts` — admin-only, requires
      a reason, emits `vendor/application.rejected`.
- [x] Inngest client + serve endpoint — already built; now also serves
      `src/inngest/vendor-application.ts`
- [x] `src/inngest/vendor-application.ts` — `notifyVendorApplicationApproved` /
      `notifyVendorApplicationRejected` → `sendPushToProfile` (`src/lib/push.ts`,
      Expo push REST, reads `push_tokens`). No token is registered until
      Milestone 9, so the send is a no-op for now but the wiring is real.
- [x] Verify: submit one application → approve/reject from `/admin` → confirmed
      working 2026-09-14 (also fixed the `/admin` route-gate race condition in
      `_layout.tsx` that bounced a real admin back to `/(tabs)` before
      `/api/me` finished loading — see Milestone 1 note). Full matrix across
      all three offering types + wallet-kind check still outstanding.
- [x] Store open/closed toggle — `vendor/profile.tsx`'s toggle is now real:
      new `vendor_profiles.is_open` column (default true), `PATCH
      /api/vendor/store-status`, surfaced through `/api/me`'s `vendor.isOpen`
      so `vendor/dashboard.tsx`'s header pill reflects it too. Needs
      `db:push`.

## 3. Product catalog (Milestone 3)

_Built, `npx tsc` + `eslint` clean, and **live-verified 2026-09-16** on a
real Android device (see the verify item below). Scope: the product path is
real (DB-backed vendor CRUD + real ImageKit photo upload + student
browse/detail + live search). The **service** catalogue stays mock until M6
and **courier** until M8._

**Backend**
- [x] `src/lib/vendor.ts` — `requireVendor(request, { approved?, offeringType? })`
      resolves the caller's `vendor_profiles` row for vendor-scoped routes (403
      otherwise)
- [x] `api/products+api.ts` — `GET` (caller's products) + `POST` (create; must
      be an **approved** `product` vendor; validates name + `priceMinor`)
- [x] `api/products/[id]+api.ts` — `GET` (public, for product detail), `PATCH`
      (owner), `DELETE` (owner, soft-delete via `deleted_at`)
- [x] `api/vendors+api.ts` — approved vendors for the caller's campus (falls
      back to all), `?type=`/`?q=`/`?categoryId=` filters — feeds Home + Explore
- [x] `api/vendors/[id]+api.ts` — one approved vendor + its live products

**Vendor (producer) side**
- [x] `src/lib/useImageUpload.ts` — `expo-image-picker` →
      `uploadImage()` (`src/lib/imagekit.ts`); returns the hosted ImageKit URL.
      Used by product create/edit (cover photo can reuse it — M2 follow-up).
- [x] Wired `vendor/products/index.tsx` (product branch) to `GET /api/products`
      + optimistic `PATCH` (in-stock toggle) + `DELETE`; row tap →
      `[id]/edit.tsx`. `new.tsx` (product branch) → `POST` with photo upload.
      Added `vendor/products/[id]/edit.tsx` (`GET` prefill / `PATCH` / `DELETE`).
      Service branch untouched (mock, M6).
- [x] `vendor/_layout.tsx` — now gates on `useSession()`: no vendor → `/(tabs)`,
      courier → `/courier/dashboard`, not-approved → `/vendor-application/pending`;
      drives product/service copy from `vendor.offeringType` (the dev
      `vendorMode` toggle still exists but is synced from the real value).
      `courier/_layout.tsx` gated the same way.

**Student (consumer) side**
- [x] `(tabs)/index.tsx` Home feed → `GET /api/vendors` (approved, campus-scoped);
      loading + empty states; card tap → `/store/[id]`. "Send a Delivery" card
      still stubbed (M8).
- [x] `store/[id].tsx` — rewritten against `GET /api/vendors/[id]`: cover +
      header + product list; each product → `/product/[id]`. Service vendors
      show a "booking coming later" note (M6). Old mock menu/cart removed.
- [x] `src/app/product/[id].tsx` (new) → `GET /api/products/[id]`; "Ordering
      coming soon" CTA until M5.
- [x] Explore `search.tsx` — debounced live search → `GET /api/vendors?q=`;
      trending/recent/popular stay mock as the idle state.
- [x] Student bottom nav confirmed 5 tabs (Home, Explore, Orders, Wallet,
      Profile) in `(tabs)/_layout.tsx`

**Deferred / follow-up**
- Explore `nearby.tsx` + `category/[key].tsx` still use `src/data/vendors.ts`
  mock — not wired this pass.
- Vendor cover-photo upload (M2-deferred) — `useImageUpload` is ready, screen
  wiring still pending.

- [x] **Verify — done 2026-09-16, real Android device.** Approved a pending
      product application ("Sochi foods") for a live test account, signed in,
      added a product ("Dioma", ₦5,000) with a real ImageKit photo through
      the vendor Products tab — confirmed via direct DB query (`isActive:
      true`, `deletedAt: null`, real `imageUrl`). Live-confirmed on-device in
      all three places: the vendor's own Products tab, the vendor's
      `store/[id]` page, and — after switching the same account to student
      mode — the student Home feed's "Popular near you" section. The other
      two sub-checks (non-approved vendor gets 403 from `POST /api/products`;
      `vendor/_layout` redirects a non-vendor out) were confirmed by reading
      the current code rather than a fresh live repro: `POST /api/products`
      calls `requireVendor(request, { approved: true, offeringType:
      "product" })` (`src/lib/vendor.ts`), which throws 403 for no vendor
      row, not-approved, or wrong offering type; `vendor/_layout.tsx` has
      `if (!vendor) return <Redirect href="/(tabs)" />` — and the
      `activeRole !== "vendor"` branch right below it was already
      live-verified during this session's role-switching work.

## 4. Wallet & Paystack top-up (Milestone 4)
_**Complete and live-verified 2026-09-16** (real Paystack test-mode keys,
real Android device). Schema: `wallets`, `wallet_transactions`,
`paystack_transactions`, `payment_methods` + enums are in `src/db/schema.ts`;
`src/db/pool.ts` adds the `neon-serverless` pool for transactional writes.
Wallet rows correctly FK `profiles.id` (the M1-era note about this pending a
swap is stale — already done)._

- [x] Build `lib/paystack.ts` (fetch wrappers: initialize, verify, transfer,
      resolve) — `src/lib/paystack.ts` (initialize + verify + webhook-signature
      verify; transfer/resolve wrappers still to add for Milestone 7)
- [x] Build `api/wallet/topup+api.ts` (creates pending `paystack_transactions`,
      calls `transaction/initialize`) — built, with min/max amount guard
- [x] Build `api/webhooks/paystack+api.ts` (HMAC-SHA512 verify raw body,
      re-`verify` with Paystack, idempotent credit) — built. **Refactored
      2026-09-16**: the credit logic now lives in a shared
      `verifyAndCreditTopup()` (`src/lib/wallet.ts`), called by both this
      webhook and the new `api/wallet/verify+api.ts` below, so either path
      credits exactly once regardless of which fires first (or both).
- [x] **New 2026-09-16: `api/wallet/verify+api.ts`** — a local-dev-friendly
      fallback the webhook alone doesn't cover. Discovered live: Paystack's
      webhook needs a public HTTPS URL, which this dev setup (phone connected
      via wireless-debug adb, no tunnel) can never provide, so a real top-up
      would show "success" in checkout and then never actually credit the
      wallet. `wallet/topup.tsx`'s `confirmTopup()` now calls this endpoint
      with the reference on return from checkout, crediting immediately —
      independent of whether a webhook URL is ever configured.
- [x] Build the top-level Wallet tab — `(tabs)/wallet/` (`index.tsx` balance +
      quick actions, `topup.tsx` amount chips + Paystack checkout via
      `WebBrowser`, `history.tsx` full ledger). **Fixed 2026-09-16**:
      `index.tsx` no longer shows a hardcoded `₦4,250.00` placeholder balance
      (a real, momentarily-wrong number flashing on every load) — shows a
      spinner while the real balance loads instead. Also fixed both
      `index.tsx` and `topup.tsx` using Clerk's raw `getToken()` directly
      instead of the app's stabilized `useApi()` hook (`src/lib/api.ts`,
      whose own doc comment already flags this exact anti-pattern) — this
      was causing repeated refetch/flash on the wallet screen, live-caught
      during this session's verify pass. `topup.tsx`'s `confirmTopup()` also
      gained a same-reference guard (a `useRef`), since
      `WebBrowser.openAuthSessionAsync`'s own promise and the OS actually
      deep-linking back into the screen can both fire for the same checkout
      return, which was triggering it twice.
- [x] Build `api/wallet/transactions+api.ts` — built
- [x] **Capture reusable card authorizations into `payment_methods` —
      complete 2026-09-16.** The webhook/verify path already auto-saved
      reusable cards, but `.onConflictDoNothing()` was a no-op — found and
      fixed a real bug: `payment_methods.authorization_code` had no
      `.unique()` constraint, so Postgres had nothing to conflict on and
      every top-up with the same card would have inserted a duplicate row
      (applied via a direct `ALTER TABLE ... ADD CONSTRAINT ... UNIQUE`,
      confirmed no existing rows conflicted first). New
      `GET /api/payment-methods+api.ts` (list) and
      `PATCH`/`DELETE /api/payment-methods/[id]+api.ts` (set default —
      unsets any other default in one transaction — and remove).
- [x] Build a wallet payment-methods screen — **rewired for real 2026-09-16**.
      `(tabs)/profile/payment-methods.tsx` now fetches real saved cards
      instead of a mock array; tapping sets default (optimistic, reverts on
      failure), a trailing icon deletes. The old "Add Card" modal (raw card
      number + expiry entered directly in-app) was removed outright — that's
      not how Paystack integrations should ever work; cards are only ever
      captured via Paystack's own hosted checkout (which `topup.tsx` already
      used correctly) and auto-saved server-side. Replaced with a prompt
      linking to `/wallet/topup` ("cards are saved automatically the next
      time you top up").
- [x] **Verify — done 2026-09-16, real Paystack test-mode transaction on a
      real Android device.** Topped up with a Paystack test card; balance
      updated correctly (confirmed both in the UI and via direct DB query —
      a real `wallet_transactions` credit row, correct `balanceAfterMinor`);
      the resulting card appeared in Payment Methods with correct
      brand/last4. Idempotency confirmed directly: called
      `verifyAndCreditTopup()` a second time against the same already-settled
      reference — returned `"already_processed"`, balance and credit-row
      count both unchanged before/after (no duplicate credit).
      **Follow-up found and fixed the same session:** Paystack issues a
      fresh `authorization_code` per transaction, even for the same physical
      card — repeated test top-ups with the same test card produced multiple
      `payment_methods` rows (each with a genuinely distinct
      `authorizationCode`, so the unique-constraint fix above was working
      exactly as designed — this was a separate, real product question, not
      a bug in it). Per the user's decision, `verifyAndCreditTopup()`
      (`src/lib/wallet.ts`) now dedupes by card fingerprint
      (`profileId` + `last4` + `expMonth` + `expYear` + `bank`) before
      inserting — a repeat top-up with the same card no longer creates a new
      Payment Methods entry. Stale duplicate test rows cleaned up directly
      in the DB.

## 5. Product ordering & lifecycle — pickup only (Milestone 5)

_**Complete and live-verified 2026-09-16/17.** Real cart store, real
`orders`/`order_items` API, real vendor lifecycle + Inngest accept-timeout
job, all three screens (checkout, student orders, vendor orders) rewired off
their mock data. All amounts flow through `PLATFORM_FEE_MINOR` (₦100 flat,
confirmed with the user) — the platform fee is simply never paid out at
completion, the vendor is credited the subtotal only._

- [x] Build local cart state — `src/lib/cartStore.ts` (Zustand, newly
      installed as a direct dependency). Single-vendor enforced at the store
      level: `addItem` returns `"different_vendor"` without mutating state
      if the cart already holds a different vendor's items; the UI prompts
      "start a new cart?" (tested live, both cancel and confirm paths work).
      No dedicated `cart.tsx` route — the existing `checkout.tsx` *is* the
      cart screen (matches the mock shell's own design), now reading live
      from the store instead of a hardcoded array.
- [x] `checkout.tsx` / `payment.tsx` — rewired to the real cart + a real
      `POST /api/orders` call (`payment.tsx` was already written against
      this exact contract before this milestone started). Dropped
      delivery/service fees (pickup-only this milestone) — `OrderRecapCard`
      reworked from a delivery-flavored layout (ETA, "change campus", two
      fee lines) to a pickup-appropriate one (vendor name, subtotal +
      platform fee). Removed a real bug: the old fallback silently treated a
      network error as a successful order and navigated away — now surfaces
      a real error instead.
- [x] `src/lib/constants.ts` — `PLATFORM_FEE_MINOR` (₦100, confirmed),
      `COURIER_FEE_MINOR` (₦300, provisional — unused until M8),
      `ORDER_ACCEPT_TIMEOUT_MINUTES` (30, provisional),
      `APPOINTMENT_CONFIRM_TIMEOUT_MINUTES` (60, provisional — unused until M6)
- [x] `src/inngest/order-lifecycle.ts` — `orderAcceptTimeout`: on
      `order/placed`, pushes the vendor, then `step.waitForEvent`s up to
      `ORDER_ACCEPT_TIMEOUT_MINUTES` for a matching `order/accepted`; on
      timeout, auto-cancels via the shared `cancelOrder()` helper (below).
      First use of `step.waitForEvent` in this codebase. Registered in
      `api/inngest+api.ts`. **Live-verified for real** (not synthetically):
      the Inngest dev server's logs show this function firing for both test
      orders; for the one you cancelled manually, the auto-cancel step ran
      hours later (delayed by the environment sitting idle overnight) and
      correctly found the order already `cancelled` — the DB shows exactly
      one refund transaction, not two, proving the race-safety design
      (`cancelOrder` checks `status === "placed"` before touching the
      wallet at all) under real, not contrived, timing.
- [x] `src/lib/orders.ts` (new, not in the original plan's file list) —
      shared `cancelOrder()` / `completeOrder()`, since the transition logic
      is needed by 3 route handlers *and* the timeout job. `cancelOrder` is
      no-op-safe (`not_cancellable` if the order isn't `placed` anymore) for
      exactly the race above.
- [x] `api/vendor/orders/[id]/accept+api.ts`, `.../ready+api.ts`,
      `.../complete+api.ts`, `.../cancel+api.ts` — vendor-side lifecycle,
      all `requireVendor` + ownership-checked. Per the user's decision,
      **either the student or the vendor** can cancel a `placed` order
      (before acceptance); no cancellation once accepted.
      `api/orders/[id]/cancel+api.ts` is the matching student-side route.
      Both found and fixed a real bug live: an unguarded `inngest.send()`
      call after the DB work would throw and fail the *entire* request if
      Inngest wasn't reachable (it wasn't — the Inngest dev server wasn't
      running yet this session) — wrapped in try/catch, since a
      notification-layer hiccup must never undo an already-committed
      wallet/order transaction.
- [x] `api/orders/[id]+api.ts` (detail, viewable by the owning student or
      vendor) and `api/orders+api.ts` (POST place / GET list, student-side).
      `api/vendor/orders+api.ts` (GET list, vendor-side) — found and fixed a
      real bug live: it initially returned bare `orders` rows with no line
      items, crashing `vendor/orders.tsx`'s render (`o.items.map` on
      `undefined`) the moment a real order appeared.
- [x] `(tabs)/orders/index.tsx`, `(tabs)/orders/[id].tsx` — rewired to
      `GET /api/orders`/`[id]`, mapped to the real `order_status` enum
      (previously three *different*, mutually-inconsistent status
      vocabularies existed across the mock data, this screen, and the
      vendor screen). Added the student cancel action (previously missing
      entirely for product orders). `useFocusEffect` + 12s poll.
- [x] `vendor/orders.tsx` (`ProductOrders` branch) — same rewiring; dropped
      the mock's cosmetic "step back to previous status" arrow (no backend
      concept) and **added the previously-missing "Mark completed" action**
      for `ready` orders — the mock UI had no way to reach `completed` at
      all. `ServiceBookings` branch untouched (still M6/mock).
- [x] Added a product-detail cart icon + badge (real-time count) and wired
      the Home feed's existing (previously non-functional, hardcoded-badge)
      cart icon to real state and `/checkout` — both found live during
      testing, not in the original plan.
- [x] Client polling — `useFocusEffect` + ~12s interval on both order list
      and detail screens, matching the existing
      `vendor-application/pending.tsx` pattern.
- [x] **Verify — done 2026-09-16/17, real device, real money movement.**
      Full lifecycle `placed → accepted → ready → completed`: student wallet
      debited exactly `subtotal + ₦100` atomically with order creation
      (confirmed via DB: a single `order_payment` debit, exact amount, no
      partial state on a forced-insufficient-funds path); vendor wallet
      credited exactly the **subtotal only** at completion (₦10,000 of a
      ₦10,100 order — the fee correctly withheld). Cancel path exercised
      twice (both from the student side): exact full refund, single
      `order_refund` credit each time, no duplicates. Timeout/race-safety
      path verified via real Inngest dev-server logs, not a synthetic test
      — see above.

## 6. Service catalog + availability + booking (Milestone 6)

_**Complete and live-verified 2026-09-17.** Real `services`/`service_availability`/
`appointments` schema (already existed from Milestone 1, including the
Postgres `EXCLUDE`-constraint double-booking guard — this milestone was only
missing the API/UI layer). Real service CRUD, vendor weekly-hours +
date-override availability, on-demand slot computation, and the full
appointment lifecycle, all rewired off `src/data/serviceBooking.ts`'s mock
store. `src/lib/booking.ts`'s pure slot logic (`slotsForDate`, `hasOpenSlots`,
etc.) reused as-is via a server-side adapter — no duplicated logic._

Two decisions locked in during this milestone: **a ₦100 flat platform fee
per appointment** (added mid-milestone at the user's request — mirrors
`PLATFORM_FEE_MINOR` exactly: student pays service price + fee, vendor is
credited the service price only, refunds return the full fee-inclusive
total); and **appointments can be cancelled any time before the scheduled
start, even after vendor confirmation** (looser than orders, which lock out
cancellation once accepted) — only the vendor can mark a no-show, once the
scheduled end has passed, and both cancel and no-show refund in full.

- [x] `src/lib/appointments.ts` (new) — `confirmAppointment`
      (`booked → confirmed`, no money movement), `cancelAppointment`
      (`booked`/`confirmed` → `cancelled`, only while still in the future,
      full refund including the fee), `noShowAppointment` (vendor-only by
      route, only once `scheduledEnd` has passed, full refund),
      `completeAppointment` (`confirmed → completed`, credits the vendor the
      service price only). Mirrors `src/lib/orders.ts`'s shape exactly,
      including the no-op-safe status guards needed for the confirm-timeout
      job to race safely against real user actions.
- [x] `src/lib/serviceAvailability.ts` (new) — server-only adapter between
      the DB (`service_availability`, `appointments`) and `booking.ts`'s pure
      functions. Treats every date/time as West Africa Time (UTC+1, no DST —
      a fixed offset, safe to hardcode; no per-vendor timezone column
      exists). `loadBookedAppointmentsForDate`/`loadBookedAppointmentsInRange`
      treat `booked`/`confirmed`/`completed` appointments as occupying a
      slot — found and fixed a real bug live: this originally excluded
      `completed`, which doesn't match the DB exclusion constraint's own
      predicate (`status NOT IN ('cancelled','no_show')`) and could let a
      slot appear open when the constraint would still reject it.
- [x] `api/services+api.ts`, `api/services/[id]+api.ts` — vendor CRUD (owner-
      checked); the detail route is public (students need it pre-booking).
- [x] `api/services/[id]/slots+api.ts`, `.../month-availability+api.ts` —
      public, on-demand slot computation server-side (no materialized slots
      table), reusing `booking.ts`'s pure logic via the adapter.
- [x] `api/vendor/availability+api.ts` — GET/POST for both the weekly
      recurring pattern and date overrides, keyed by `vendorProfileId`
      (shared across all of a vendor's services, confirmed via the existing
      mock's own design). A day/override save deletes and re-inserts every
      row for that day-of-week/date rather than diffing individual windows.
- [x] `api/appointments+api.ts` (POST book / GET list, student-side),
      `api/appointments/[id]+api.ts` (GET detail, owning student or vendor),
      `api/appointments/[id]/cancel+api.ts` (student cancel). Booking debits
      `service price + ₦100 fee` and inserts the appointment in one
      transaction; the exclusion constraint is the authoritative
      double-booking guard, with a pre-check purely for a friendlier error.
      Found and fixed a **real bug live** here: the constraint-violation
      catch checked `err.code` directly, but drizzle-orm wraps the actual
      Postgres error inside `err.cause` — `err.code` is always `undefined`,
      so a genuine booking race would have thrown an unhandled 500 instead
      of the intended friendly 409. Confirmed via a live concurrent-insert
      test against the real `dbPool.transaction` path, both before (failed
      to catch) and after (caught correctly) the fix.
- [x] `api/vendor/appointments+api.ts` (GET list) +
      `.../[id]/{confirm,complete,cancel,no-show}+api.ts` — vendor-side
      lifecycle, `requireVendor` + ownership-checked, each fault-tolerant on
      its `inngest.send()` (same fix already applied to the M5 order routes).
- [x] `api/vendors/[id]+api.ts` — added the `services` query branch to the
      existing (previously products-only) vendor-detail response.
- [x] `src/inngest/appointment-lifecycle.ts` — `appointmentConfirmTimeout`
      (mirrors `orderAcceptTimeout`: on `appointment/booked`, notifies the
      vendor, `step.waitForEvent`s up to `APPOINTMENT_CONFIRM_TIMEOUT_MINUTES`
      for `appointment/confirmed`, auto-cancels via `cancelAppointment(id,
      "system")` on timeout) and `appointmentReminders` (first use of
      `step.sleepUntil` + `cancelOn` in this codebase: triggered on
      `appointment/confirmed`, sends a push 24h-before and 1h-before,
      `cancelOn` stops pending reminders the moment `appointment/cancelled`
      fires). Both registered in `api/inngest+api.ts`.
- [x] `vendor/products/index.tsx` (`ServiceCatalog`), `new.tsx`, `[id]/edit.tsx`
      — rewired to the real `/api/services`. Found a real gap: `edit.tsx` had
      **no service branch at all** (always hit `/api/products/:id`, silently
      wrong for services) — added one mirroring the product branch. New
      services default `isActive: false`, matching the mock's original
      "stays off until availability is set" behavior.
- [x] `vendor/products/availability.tsx` — rewired to real
      `api/vendor/availability` + `api/vendor/appointments`; added a new
      **Weekly Hours** section (not in the original checklist — the mock UI
      only ever edited day-specific overrides, with no way to set the base
      recurring pattern a fresh vendor needs before any override matters).
      Found and fixed **two real bugs live** here, both reported directly
      by the user during testing: (1) a race where the screen's on-focus
      `GET` could resolve *after* a save and silently overwrite the
      just-saved state with stale pre-save data — the DB always had the
      correct data, but the UI could appear to have "lost" it; fixed with a
      request-ticket guard that discards a stale in-flight load after any
      local save. (2) the day editor always reset to an editable "Save day"
      state even for an already-saved day, so there was no way to tell at a
      glance that a date was already configured — reworked into a read-only
      "Saved" view (badge + the actual saved windows) with an explicit
      **Edit** button, plus **Cancel** to discard in-progress edits without
      touching what's persisted.
- [x] `store/[id].tsx` — replaced the "booking coming later" placeholder
      with a real service list from the extended `GET /api/vendors/[id]`
      response, each row linking to `/book/[serviceId]`.
- [x] `book/[serviceId].tsx` — rewired off the mock store to real service
      detail, month-availability, slots, and `POST /api/appointments`
      fetches; kept the existing `MonthCalendar`/`SlotGrid`/success-view
      components as-is (already pure/presentational). Added a fee breakdown
      line and total-inclusive Confirm button once the ₦100 fee was added.
      Found and fixed a **real UI bug live**: the confirm bar's
      `SafeAreaView` only reserved the top edge, so on-device the bottom
      gesture-nav bar overlapped the Confirm button — fixed to reserve both
      edges, matching every other screen with a fixed bottom bar
      (checkout, payment, the cart bar).
- [x] `(tabs)/orders/index.tsx`, `vendor/orders.tsx` (`ServiceBookings`
      branch) — rewired the appointment halves to real
      `/api/appointments`/`/api/vendor/appointments` and the real
      cancel/confirm/complete/no-show actions, matching the treatment
      already given to the product-order halves in M5. Both now display the
      fee-inclusive `totalMinor`, matching how the sibling product-order
      views already display `order.totalMinor`.
- [x] **Verify — done 2026-09-17, real device + a live-code DB simulation for
      the time-gated paths, real money movement throughout.** Booked a real
      slot (Full Set Acrylics, ₦5,000 + ₦100 fee): student wallet debited
      exactly ₦5,100 in one transaction, appointment row correct
      (`scheduledStart`/`End` matched the picked WAT slot exactly). Vendor
      confirmed via the real UI: status flipped to `confirmed`, **no**
      additional wallet transaction (money already moved at booking). Since
      `complete`/`no-show` only unlock after the scheduled end passes (this
      slot was 1.5 days out), verified those two — plus a fresh cancel —
      by calling the *real* `completeAppointment`/`cancelAppointment`/
      `noShowAppointment` functions directly (not reimplemented logic)
      against DB rows with their timestamps shifted into the past, per the
      user's explicit choice over waiting a real 1.5 days: complete credited
      the vendor exactly ₦5,000 (not the ₦5,100 total); cancelling a
      *confirmed* future appointment refunded the full ₦5,100 (proving the
      looser-than-orders cancellation window actually took effect); no-show
      on a past-due confirmed appointment refunded the full ₦5,100 with
      `cancelledBy: "vendor"`. Double-booking race re-verified against the
      real `dbPool.transaction` path after the `err.cause` fix above: two
      concurrent inserts for the identical slot — one succeeds, the other is
      now correctly caught as a friendly slot-taken condition. Confirm-timeout
      wiring verified via the Inngest dev server's own API: booked a slot
      without confirming, confirmed the `appointment/booked` event fired and
      the `appointmentConfirmTimeout` run is `Running` (correctly parked in
      `step.waitForEvent`) — not run to the full 60-minute timeout for real,
      by explicit choice, since the mechanism is identical to `orderAcceptTimeout`,
      already live-verified for real in M5. One process note: cleaning up two
      synthetic test appointments by deleting their `wallet_transactions` rows
      didn't reverse the balance those rows had already applied — caught in a
      follow-up balance check and corrected directly; a reminder that a
      ledger's running balance and its transaction log are two separate
      things to keep in sync when reverting test data by hand.

## 7. Vendor payouts, generalized (Milestone 7)

_**Backend + vendor UI built for real, `npx tsc` + `eslint` clean** — done in
a prior session (files dated 2026-09-17) whose completion never got recorded
here; reconciled 2026-09-18 by reading the actual code rather than trusting
this checklist. Courier payout stays intentionally stubbed
("isn't wired up yet" in `courier/wallet/index.tsx`) — deferred to Milestone
8 per the design, not an oversight. Not yet live-verified against a real
device + real Paystack test transfer._

- [x] Paystack transfer recipient creation — `ensureTransferRecipient()`
      (`src/lib/payout.ts`), called lazily on first payout request. Resolves
      the account number via Paystack first and uses Paystack's own verified
      name (not the vendor-typed one) for the recipient; stores
      `paystackRecipientCode` on `vendor_profiles`.
- [x] `api/vendor/payout+api.ts` — GET (balance/fee/net preview + eligibility)
      and POST (`requestPayout()` in `src/lib/payout.ts`: atomic full-balance
      debit + pending `paystack_transactions` row in one `dbPool`
      transaction, then emits `vendor/payout.requested`). Always sweeps the
      full balance — no partial withdrawal, confirmed design. Works for
      product/service `kind='vendor'` wallets now; courier wallets wired the
      same way but exercised in milestone 8.
- [x] `src/inngest/payouts.ts` — `processVendorPayout`: on
      `vendor/payout.requested`, calls Paystack's Transfer API. An error here
      is reconciled against Paystack directly (`verifyTransfer`) before being
      treated as a real failure, since a transfer reference can't be safely
      retried blind. `onFailure` (once retries are exhausted) refunds the
      wallet via the same `refundFailedPayout()` the webhook path uses.
- [x] `transfer.success` / `transfer.failed` / `transfer.reversed` webhooks —
      handled in `api/webhooks/paystack+api.ts`; failure/reversal share
      `refundFailedPayout()`'s idempotent credit with the Inngest `onFailure`
      path, so whichever fires first wins and neither double-refunds.
- [x] Build `(vendor)/wallet/index.tsx`, `(vendor)/wallet/payout.tsx` — both
      real, wired to `/api/vendor/wallet` and `/api/vendor/payout` (not mock
      data).
- [ ] Manual step (user, not code): enable "disable OTP for transfers" in the
      Paystack dashboard before a transfer can go through unattended.
- [x] **New 2026-09-18: `api/vendor/bank-details+api.ts` + a real
      `vendor/profile/bank-details.tsx` edit screen.** Found live during
      verify: the "Payout account" row in the vendor profile was a fully
      static mock ("GTBank ••4821", no `onPress`) — there was no way for a
      vendor to fix bad bank details after their initial application, which
      is exactly what blocked the very first payout test (a fake account
      number entered at application time, unresolvable by Paystack, with no
      edit path). The new endpoint live-resolves the account via Paystack
      before saving (using Paystack's own verified name, not a typed one)
      and clears any stale `paystackRecipientCode` on change. **Also found
      and fixed live**: the screen was originally added as a flat sibling
      file directly under `vendor/` (next to `vendor/_layout.tsx`'s
      `NativeTabs`) and was untappable — `NativeTabs` only makes routes
      navigable when they live inside a tab's own nested `Stack` (as
      `vendor/wallet/` already does with its own `_layout.tsx`), not as bare
      siblings of the tabs layout itself. Fixed by converting `profile` from
      a flat file into a folder (`vendor/profile/_layout.tsx` +
      `index.tsx` + `bank-details.tsx`), mirroring `wallet/`'s structure —
      same fix would be needed for any other new push screen off a
      `NativeTabs`-based shell (vendor, courier, admin all use it).
- [x] **Partial live verify — 2026-09-18, real device + real Paystack API
      calls.** Bank-details editing confirmed for real: entered a real
      account number for the "Nails" service vendor (Access Bank), Paystack
      resolved and returned the genuine account holder's name
      ("SOCHIKAMSO BONTE EGBE") rather than anything typed — confirmed via
      DB read, not just the UI. Recipient creation confirmed directly
      against Paystack's API for the same account (real `recipient_code`
      returned). **Blocked mid-test**: `POST /api/vendor/payout` re-resolves
      the account a second time inside `ensureTransferRecipient()` (by
      design, since it only trusts `paystackRecipientCode` once already
      set) — this second resolve hit Paystack's test-mode cap of **3 live
      bank resolves per day**, exhausted today between the original fake
      number, the fix's own diagnostic calls, and the real save. Confirmed
      via direct Paystack API call — genuine quota message, not an app bug.
      Paystack's suggested workaround (test bank code `001`) isn't in the
      real bank list our picker uses, so it can't be reached without adding
      a fake entry to production bank data — not done. **Deferred to
      tomorrow** (quota resets daily) rather than seeding a shortcut
      recipient code: full remaining verify — wallet debit on request,
      Inngest `processVendorPayout` firing, transfer initiation reaching
      Paystack — still needs a real device + the OTP dashboard toggle (still
      pending, user doesn't have Paystack dashboard access yet either).

## 8. Courier + delivery marketplace (Milestone 8)

_**Built for real 2026-09-18**, `npx tsc` + `eslint` clean throughout. The
`delivery_jobs` table already existed in full from Milestone 1 — no schema
migration needed beyond one new `wallet_txn_reason` enum pair
(`delivery_payment`/`delivery_refund`, mirroring `order_payment`/
`order_refund`). `src/lib/deliveryJobs.ts` mirrors `orders.ts`/
`appointments.ts`'s no-op-safe lifecycle-function shape exactly. Not yet
live-verified against a real device — see the Verify item below._

Two ways a `delivery_jobs` row now comes into existence, sharing every
downstream mechanic identically: **(a) order-sourced** (a product order
placed with `fulfillment_type='delivery'`) and **(b) errand-sourced** (a
student requests a courier directly from Home, no vendor/order involved).

**Order-sourced delivery**
- [x] Real `fulfillment_type: 'delivery'` option in student checkout —
      `checkout.tsx` gained a Pickup/Delivery toggle + dropoff-note field
      (state lives in `cartStore.ts`, the existing single-source-of-truth for
      checkout state), `payment.tsx` shows the fee and includes it in the
      `POST /api/orders` body.
- [x] `delivery_jobs` row creation at order placement (`source='order'`,
      status `awaiting_vendor`) — inserted in the same `dbPool.transaction`
      as the order + order_items, `api/orders+api.ts`. Server-side computes
      the delivery fee itself (`COURIER_FEE_MINOR`), never trusts a
      client-sent amount.
- [x] `api/vendor/orders/[id]/accept+api.ts` flips the linked `delivery_jobs`
      row from `awaiting_vendor` to `open` right after accepting the order.

**Errand-sourced delivery ("Send a Delivery")**
- [x] `send-delivery.tsx` (top-level route, sibling to `checkout.tsx`) —
      pickup note, dropoff note, item description, flat fee display,
      "Confirm & pay" → `POST /api/delivery-jobs` → `/deliveries/[id]`.
- [x] Entry point: a "Send delivery" pill in the Orders tab header
      (`(tabs)/orders/index.tsx`). It began as a Home feed card, moved
      2026-09-25 to free Home space for vendor cards; Orders is also where
      errand requests are listed.
- [x] `POST /api/delivery-jobs+api.ts` — atomically debits the requester,
      inserts `source='errand'`, `status='open'` directly (no
      `awaiting_vendor` step — no vendor prep to wait on).
- [x] `POST /api/delivery-jobs/[id]/cancel+api.ts` — requester-only, only
      while `open`, full refund.
- [x] `GET /api/delivery-jobs/requested+api.ts` — a student's own errand
      requests.
- [x] Merged view on `(tabs)/orders/index.tsx` — a new "Deliveries" section
      alongside the existing Orders/Appointments sections, same polled-list
      pattern, each row → `/deliveries/[id]`.
- [x] **New `deliveries/[id].tsx`** (top-level route) — the errand-sourced
      Requested→Courier assigned→Picked up→Delivered tracker; needed because
      `(tabs)/orders/[id].tsx` is keyed by an `orders` row that doesn't exist
      for errands.

**Shared mechanics (both sources)**
- [x] `api/delivery-jobs+api.ts` GET (open feed, campus-filtered, mixes both
      sources) + `api/delivery-jobs/mine+api.ts` (courier's claimed/history).
- [x] `api/delivery-jobs/[id]/claim+api.ts` — atomic conditional claim (the
      `WHERE status='open'` clause is the race guard, same CAS idiom
      `applyDebit` uses). **Also enforces one active job per courier** — a
      courier can't claim a second job while carrying one; this was already
      an assumption baked into the old mock UI's own alert copy
      ("finish your active delivery..."), now enforced server-side too, not
      just client-side.
- [x] `api/delivery-jobs/[id]/picked-up+api.ts`, `.../delivered+api.ts`
      (credits the courier the delivery fee; for order-sourced jobs,
      separately — best-effort, no-op-safe — completes the linked order via
      the existing `completeOrder()`), `.../fail+api.ts` (refunds the
      requester in full — not explicitly specified in the original
      checklist, but the only sensible behavior, mirroring how every other
      terminal-failure path in this app already refunds). **Known gap**: a
      failed *order-sourced* delivery refunds the delivery fee but doesn't
      touch the parent order's own status — it stays `accepted` pending
      manual/support follow-up, matching this file's own pre-existing "Open
      items" note on unclaimed-job resolution being manual for now.
- [x] Courier "Deliveries" (open feed + claim) and "My Deliveries"
      (active + history) — `courier/dashboard.tsx` + `courier/deliveries.tsx`
      rewired off the mock store onto a new shared `src/lib/
      useCourierDeliveries.ts` hook (de-duplicates logic that was previously
      copy-pasted between the two screens). **Real UI gap found and fixed**:
      the old mock only ever went active→delivered in one tap — there was no
      "Mark picked up" action anywhere, even though the schema models
      `claimed → picked_up → delivered` as three distinct steps. Added.
- [x] Combined delivery tracker on `(tabs)/orders/[id].tsx` — the previously
      hardcoded 4-step pickup stepper is now one of two variants, switched on
      whether the enriched `GET /api/orders/[id]` response includes a
      `deliveryJob`; the 6-step Placed→Preparing→Finding a courier→Courier
      assigned→Picked up→Delivered version reuses the same stepper-rendering
      JSX (not hardcoded to 4 steps beyond the array length).
- [x] **Also found and fixed live, same session**: `courier/profile.tsx`
      and (previously) `vendor/profile.tsx` both had a fully dead "Payout
      account" row (no `onPress`, in vendor's case a hardcoded fake value) —
      same root cause as the M7 bank-details fix. Both are now real,
      including a courier-specific `courier/profile/bank-details.tsx`
      (couriers can't reach the vendor one — `vendor/_layout.tsx` redirects
      any courier account away from `vendor/*` entirely). `courier/wallet/`
      (`index.tsx`, `all.tsx`, new `payout.tsx`) rewired off the mock onto
      the same `/api/vendor/wallet` and `/api/vendor/payout` endpoints M7
      built — both already branch on `offeringType === "courier"` for wallet
      kind, so no backend changes were needed, only the screens. Both
      `vendor/profile.tsx` and `courier/profile.tsx` also hardcoded
      "Mama Ngozi's Kitchen" as the display name regardless of the real
      vendor — traced to `/api/me` never returning `vendor.displayName` at
      all; added it there (`src/app/api/me+api.ts`,
      `src/lib/session.tsx`'s `Me` type) and wired both screens to the
      real value.
- [x] **Verify — done 2026-09-18, real device + real money movement throughout.**
      Order-sourced path fully proven: placed a delivery order (Sochi foods,
      "Dioma" ₦5,000) with a real dropoff note — student debited exactly
      ₦5,400 (subtotal + ₦100 platform fee + ₦300 delivery fee) in one
      transaction, a linked `delivery_jobs` row created atomically as
      `awaiting_vendor`. Vendor accepted → job flipped to `open`. Courier
      ("Kelly") claimed → `claimed`, correctly attributed. Marked picked up,
      then delivered.
      **Found and fixed a real bug live here**: `markPickedUp` never moved
      the parent order past `accepted`, so the existing `completeOrder()`
      call on delivery (guarded on `status === "ready"`) was silently
      no-op'ing — an order-sourced delivery order would have sat at
      `accepted` forever, vendor never paid. Fixed in
      `src/lib/deliveryJobs.ts`: `markPickedUp` now flips the linked order
      to `ready` first (the delivery equivalent of "ready for collection" —
      here collected by the courier instead of the student), so
      `completeOrder()` has a real `ready` order to act on once delivered.
      Repaired the in-flight test order by running the corrected logic
      directly against it (mirroring the M4/M6 precedent for this) rather
      than leaving it stuck — confirmed after: order `completed`, vendor
      credited exactly ₦5,000 (subtotal only, fee withheld correctly),
      courier credited exactly ₦300 `courier_earning`.
      **Also observed, not a bug**: a "couldn't mark picked up" error
      flashed transiently mid-test, but the final DB state showed clean
      single `pickedUpAt`/`deliveredAt` timestamps with no duplication —
      consistent with the no-op-safe guard correctly rejecting a
      double-tap/poll-race retry rather than any data inconsistency.
      **Errand-sourced path also proven**: requested via Send a Delivery
      (pickup/dropoff/item notes) — debited ₦300 immediately, `open` status
      with no `awaiting_vendor` step. Cancelled while unclaimed — refunded
      the full ₦300, one clean credit/debit pair.
      **Found a second real gap mid-test**: the two new `wallet_txn_reason`
      enum values (`delivery_payment`/`delivery_refund`) were added to
      `schema.ts` but never pushed to the live Neon DB — the first errand
      request failed with a real Postgres error (enum value doesn't exist).
      Fixed by running `npm run db:push`; confirmed the failed attempt had
      rolled back cleanly (no orphaned job or wallet row) and the retry
      succeeded normally.
      **Claim-race (409) and fail-path verified via direct concurrent
      function calls** against the real `claimDeliveryJob`/`failDeliveryJob`
      logic (same technique M6 used for its double-booking guard) rather
      than two live device sessions, since racing two real taps on one
      phone isn't practically testable: two couriers ("Kelly",
      "Delivery guy") both called `claimDeliveryJob` on the same open job
      via `Promise.all` — exactly one succeeded, the other got a clean
      `already_claimed` rejection, confirmed against the DB (only one
      `claimedByVendorProfileId` recorded). Then `failDeliveryJob` on that
      claimed job refunded the requester the full delivery fee, one clean
      credit row with the correct reason/reference.
      **Also discovered, unrelated to M8 itself but relevant going
      forward**: `kiroegbu@gmail.com` resolves to **three** separate
      `profiles` rows (from historical Clerk account deletion/recreation,
      already flagged in Revision note (3)) — a DB query filtered only by
      email rather than a specific `profiles.id` can silently hit the wrong
      one. Caused a false alarm mid-verify (a balance check that looked
      like a missing refund was actually just reading a different
      duplicate profile's wallet) — worth remembering for any future
      direct-DB verification against this account.

## 9. Notifications polish (Milestone 9)

_**Built 2026-09-19**, `npx tsc` + `eslint` clean. An audit before starting
found the second checklist item was **already almost entirely done** — every
lifecycle route built across M2/M5/M6/M7/M8 already called
`sendPushToProfile`, just silently as a no-op since no token ever existed.
Real remaining scope was narrower: the registration flow itself, one genuine
lifecycle gap, and the fallback UI. **Not yet live-verified against a real
device — needs a dev-client rebuild first, see below.**_

- [x] Push token registration flow — new `api/push-tokens+api.ts` (`POST`
      upserts on `push_tokens.token`'s unique constraint, re-homing
      `profileId` if the same physical device later signs into a different
      account; `DELETE` for sign-out cleanup). New `src/lib/pushNotifications.ts`
      (`registerForPushNotificationsAsync`, `expo-notifications` +
      `expo-device` + `expo-constants`). Hooked into `SessionProvider`
      (`src/lib/session.tsx`) via an effect keyed on `me.profile.id`
      (not a one-shot "ever ran" flag — `SessionProvider` never unmounts
      across a sign-out→sign-in on one device, so a one-shot flag would
      silently stop registering after the first account). `useSignOut.ts`
      best-effort unregisters the token first (self-heals via the upsert
      either way if that call fails).
- [x] Wired the one real remaining gap: delivery-job `open` never notified
      any courier. New `notifyAvailableCouriers()` (`src/lib/deliveryJobs.ts`)
      pushes every approved, on-duty, same-campus courier — matches the
      exact eligibility gate the open-jobs feed itself already uses. Called
      from errand creation (`api/delivery-jobs+api.ts`) and from the
      vendor-accept `awaiting_vendor→open` flip (`api/vendor/orders/[id]/accept+api.ts`,
      which needed a `.returning()` added to that update to even know
      whether a row was actually flipped — it had none before).
      **Also added**: `sendPushToProfiles()` (batch variant) in
      `src/lib/push.ts`, and a stale-token cleanup — both push functions now
      inspect Expo's per-message ticket response and call the
      already-existing (previously unused) `removeTokens()` on
      `DeviceNotRegistered`, closing out that function's own "called from a
      sweep later" comment instead of shipping a second half-wired path.
- [x] Denied-permission fallback UI — `(tabs)/profile/notifications.tsx`
      (previously a `ComingSoonScreen` stub) now re-checks permission status
      on focus and shows real copy + a `Linking.openSettings()` button when
      denied, or a confirmation state when granted.
- [x] `app.json` — added the `expo-notifications` config plugin (using the
      existing monochrome Android icon, not the colored splash icon — Android
      renders notification icons as a flat silhouette).
- [x] **Manual step (user):** `npx expo run:android` dev-client rebuild —
      done 2026-09-19.
- [x] Live-device verify, done 2026-09-19: `push_tokens` row confirmed
      appearing/updating on sign-in; denied-permission screen + `Open
      Settings` deep link both confirmed live (revoked/re-granted the OS
      permission and watched the screen react on focus); an appointment
      `confirm` lifecycle push confirmed actually arriving in the system
      tray. Account-switch re-homing and the courier open-job broadcast
      targeting were verified at the DB level — a same-token upsert with a
      different `profileId` correctly re-homes the existing row (confirmed:
      same row id, `profileId` reassigned, `updatedAt` bumped, no duplicate
      inserted, matching `push-tokens+api.ts`'s `onConflictDoUpdate` exactly),
      and `notifyAvailableCouriers()`'s targeting query, run directly against
      real courier rows with two of three toggled off-duty, correctly
      returned only the on-duty one. Live-arrival for that specific path
      (via the real `POST /api/delivery-jobs` route rather than a raw Expo
      API call) was not completed — the session's wireless-debugging
      connection to the test device became too unstable to finish driving
      the "Send a Delivery" form (repeated disconnects requiring re-pairing,
      the phone's screen locking mid-session, stray taps once triggering
      React Native's dev-mode element inspector). Not considered a real risk
      given the two halves (delivery mechanism, targeting query) were each
      independently confirmed correct. Two real bugs found and fixed along
      the way:
      - The notification bell icons on the vendor dashboard/wallet and
        courier dashboard/wallet, plus the "Notifications" row in the vendor
        profile menu, were all still wired to a pre-M9 `Alert.alert("Coming
        soon"...)` stub instead of the real screen this milestone built —
        never rewired. Fixed all 5 spots to `router.push("/profile/notifications")`.
      - **The bigger one**: no push notification was actually reaching any
        Android device — Expo's push API was rejecting every send with
        `InvalidCredentials: Unable to retrieve the FCM server key`, because
        this EAS project never had FCM push credentials configured at all.
        Fixed by generating a Firebase service-account key (Google deprecated
        the old single "server key" in favor of FCM V1 service accounts) and
        uploading it via `eas credentials` → Android → Google Service Account
        → set up for Push Notifications (FCM V1). A first attempt uploaded it
        to the wrong slot (**Push Notifications (Legacy)**, which still shows
        an unused legacy key in the credentials list — harmless, just dead
        weight). Also fixed `src/lib/push.ts`'s `sendToTokenRows`: it only
        checked the HTTP status of the Expo API call, not each message's own
        ticket status, so a credential failure like this was being silently
        counted as "sent" with zero log output. It now logs ticket-level
        errors and excludes them from the returned `sent` count.
      - **Incident during this verify session**: a stray automated tap on
        the vendor wallet screen accidentally triggered a real `POST
        /api/vendor/payouts` withdrawal (test-mode Paystack key, so no real
        funds moved — confirmed directly against Paystack's API, transfer
        status `abandoned`, never completed). Left the local vendor wallet
        incorrectly debited to ₦0 since the dev server has no public
        webhook URL for Paystack's `transfer.failed` event to self-heal it.
        Corrected manually by replicating `refundFailedPayout()`
        (`src/lib/payout.ts`) by hand: `paystack_transactions` row marked
        `failed`, wallet credited back via a `payout_reversal` ledger entry —
        same effect the real webhook would have produced. Worth remembering
        for any future device-automation session: the vendor wallet's
        Withdraw button is a real, live Paystack transfer call even in this
        dev build, not a mock.

## App-wide audit: dead buttons, mock data, real profile editing (2026-09-18)

_Cross-cutting pass across every screen, not tied to one milestone — a full
audit (3 parallel agents covering student/vendor/courier) found this
session's earlier bug pattern (decorative buttons with no `onPress`, screens
still rendering hardcoded arrays instead of calling `useApi()`) repeated
throughout the app. All confirmed findings fixed; `npx tsc` + `eslint` clean
throughout, matching this session's established bar._

**Wired dead buttons** to real destinations/data (no new backend needed):
student profile (real name/handle/order-count/wallet-balance, removed a
non-functional dark-mode toggle), wallet home + wallet history (both were
discarding or never fetching the real `GET /api/wallet/transactions`
response), Explore's "Become a Vendor" button, vendor profile's
Notifications/Help & Support/settings rows, vendor dashboard (real business
name — the "Mama Ngozi's Kitchen" bug from earlier this session, missed in
that pass — plus real wallet balance and real recent-orders/bookings, no
longer fake arrays), courier profile's Help & Support, and four
notification-bell icons that weren't even wrapped in a `Pressable` (vendor
dashboard/wallet, courier dashboard/wallet) — all four point at the existing
`/profile/notifications` stub, since a real notification feed is Milestone 9
scope, not this pass.

**Removed features that contradicted existing design** rather than wiring
them to something fake: "Fund wallet" buttons on the vendor dashboard and
wallet screen (vendor/courier wallets are earned-only in this app's money
model — `PLATFORM_FEE_MINOR`/`courier_earning`/`payout`, no top-up concept;
the button was a copy-paste leftover from the student wallet template, and
`POST /api/wallet/topup` only ever credits the student wallet regardless of
caller). Removed "Where are you?" location pickers on two Explore screens —
this is a single-campus pilot with no campus picker anywhere by design
(Revision note 5).

**Replaced remaining mock data** with real `GET /api/vendors` calls: Explore
home (dropped the fake "Near You" campus-zone section entirely — no backing
data model), Explore Search's idle-state "Trending" list (dropped the
`src/data/vendors.ts` import, now deleted — nothing else referenced it),
Explore Nearby (dropped fake distance/ETA/rating figures no backend
supports; "Open Now" now really filters by `isOpen`, which
`api/vendors+api.ts` didn't select before). Explore Search's "Recent
Searches" is real, session-scoped search history (an in-memory list, not a
hardcoded one). **Correction, 2026-09-19**: this was originally built against
`@react-native-async-storage/async-storage` for real persistence across app
restarts — installed via `npx expo install`, which only updates the JS/
package side. The already-built dev client on the test device had never been
rebuilt with that native module linked in, so the app crashed immediately on
launch (a native crash, not a JS error screen) the next time it was opened.
Reverted to the in-memory version and uninstalled the package rather than
have the user rebuild the dev client for a minor convenience feature — a
reminder that any future native dependency needs `npx expo run:android`
(or an EAS build) before it'll actually work on a device with an existing
dev-client install, not just `expo install` + a Metro reload. The dead
filter icons on Home and Explore Search both open
the same real type-filter sheet — extracted into
`src/components/VendorTypeFilterSheet.tsx` so there's one implementation,
not two.

**Real profile-editing screens** ("built out the functionalities" per the
application data already captured at vendor-application time): new
`GET`/`PATCH /api/vendor/profile+api.ts` (business info + KYC docs, any
offering type/status), `vendor/profile/business-info.tsx`,
`vendor/profile/verification.tsx` (status + re-uploadable KYC docs),
`courier/profile/vehicle.tsx`, `courier/profile/verification.tsx`. Repointed
vendor profile's "Business information"/"Verification" rows and courier
profile's "Vehicle & coverage area"/"Verification" rows (the latter two
previously had no `onPress` at all) to these. **Deleted
`vendor-application/kyc.tsx` and `kyc-business.tsx`** — confirmed
unreachable once repointed, and actively misleading before that: both were
local forms that never saved anywhere, and `kyc-business.tsx` was hardcoded
to fake pre-filled data ("Mama T's Kitchen", a fake email/phone/address) that
silently discarded whatever the vendor actually typed. This closes out the
"`(vendor)/profile/edit-application.tsx` not built" item from Milestone 10's
own checklist above.

**Also fixed while in the area**: the "Popular near you" 4-per-scroll
pagination on Home was silently breaking depending on which vendor sorted
first alphabetically — a card's category line was conditionally mounted
(courier vendors have no category at all), so the single sample card used to
measure page height didn't always match every other card's real height.
Fixed by always rendering the line, invisible when absent, so every card is
a uniform height.

**Correction, 2026-09-19 — real live-device bug found and fixed**: the
notification-bell and Help & Support/Settings icons on vendor and courier
screens were wired to `router.push("/profile/notifications")` etc. — real
screens, but they live under `(tabs)/profile/`, a **different, separate
top-level navigator** from `vendor/`/`courier/` (each its own `NativeTabs`
instance). Switching roles `replace`s the whole `(tabs)` navigator in and
out, and pushing directly into its nested profile Stack from outside it
(bypassing `(tabs)/profile/index.tsx`) left that Stack corrupted — caught
live: after visiting a vendor/courier screen's bell icon then switching back
to student, the Profile **tab** itself got stuck permanently showing the
notifications stub instead of resetting to the real profile screen when
tapped. Fixed by reverting all six of these (vendor dashboard/wallet/profile,
courier dashboard/wallet/profile) to a plain `Alert.alert("Coming soon", …)`
— they're stubs for genuinely unbuilt features anyway, so there was never a
good reason to navigate into a different navigator's internal state for
them. The pre-existing same-navigator uses (the student profile screen's own
menu rows, and Explore's bell — both already inside `(tabs)`) are unaffected
and were left as real navigation, since pushing within the same already-
mounted navigator doesn't have this failure mode.

Live-verified via this exact bug report from the user — the rest of this
changeset (20+ files) still hasn't had a full deliberate walkthrough beyond
what this fix required.

## 10. Hardening (Milestone 10)

_Built and live-verified 2026-09-20, `npx tsc` + `eslint` clean across the
whole project (9 pre-existing `react-hooks/set-state-in-effect`/`refs`
findings remain, all on lines untouched by this milestone — same ones
flagged out-of-scope in earlier milestones)._

- [x] Add Sentry error boundaries/breadcrumbs on client screens —
      `Sentry.ErrorBoundary` now wraps the whole app in `src/app/_layout.tsx`
      with a real fallback UI (`src/components/ErrorFallback.tsx`); breadcrumbs
      fire centrally on every API call (`src/lib/api.ts`'s `useApi`) and every
      navigation change (`_layout.tsx`'s `usePathname` effect), so this didn't
      need touching every screen individually.
- [x] Add Sentry capture in every `+api.ts` handler's catch path — new
      `withApi()` wrapper (`src/lib/apiHandler.ts`) applied via codemod to all
      60 route files (the 61st, `api/inngest+api.ts`, is Inngest's own `serve()`
      handler and correctly left untouched). Catches any uncaught error,
      calls `Sentry.captureException`, returns a generic 500 — and its
      side-effect import of `sentry-server.ts` closes a real gap where most
      routes never actually initialized Sentry at all (only ones that happened
      to import `wallet.ts` transitively did).
- [x] Audit every `+api.ts` handler for ownership/authorization checks — all
      68 routes reviewed in depth (two research passes); every one correctly
      scopes data to the caller or restricts to admin. Zero missing-check
      findings. Additionally hardened `confirmAppointment`/`cancelAppointment`/
      `noShowAppointment`/`completeAppointment` (`src/lib/appointments.ts`) and
      `cancelOrder`/`completeOrder` (`src/lib/orders.ts`) with an optional
      ownership parameter, defense-in-depth against a future caller that skips
      its own pre-check — every real HTTP call site now passes it.
- [x] Fill in empty/error states across all screens — new shared
      `src/components/ListState.tsx` (empty + error variants, error with a
      retry action); threaded a real `error` flag through 18 screens/hooks
      that previously collapsed a fetch failure into the same "nothing here"
      UI as a genuine empty result — preserving the deliberate "keep stale
      data on a failed background refresh" behavior a few of them already had.
- [x] Expand seed data for realistic QA — `src/db/seed.ts` now seeds 5
      additional vendors spanning all three offering types (browsable, not
      loggable-into — placeholder `clerk_user_id`s), their full catalogs and
      weekday service availability, plus sample orders/appointments/delivery
      jobs in varied lifecycle states under a dedicated seed student profile.
      Confirmed idempotent by running `db:seed` twice against the live DB.
      Live-verified: seeded vendors and their real availability appear
      correctly in the student Home feed and booking calendar.
- [x] Build remaining profile screens — `help-support.tsx` built for real
      (FAQ + contact) and wired up for student, vendor, and courier (all three
      previously pointed at dead `Alert.alert` stubs); `favorites.tsx` built
      end-to-end (`favoriteVendors` table had zero usages before this — added
      `api/favorites+api.ts` GET/POST, `api/favorites/[vendorId]+api.ts`
      DELETE, a heart toggle on the vendor storefront screen, and the list
      screen), live-verified: favoriting a vendor makes it appear in the list.
      `(vendor)/profile/edit-application.tsx` was **not** built at that literal
      path — `vendor/_layout.tsx`'s own approval gate redirects any non-approved
      vendor to `vendor-application/pending.tsx` before they could ever reach
      it, making a file there permanently unreachable dead code. That screen
      already has a working "Edit & resubmit" button; its only real gap was
      restarting the application wizard empty instead of pre-filled, fixed in
      `src/lib/vendorApplication.tsx` (hydrates the draft from the caller's
      existing application on mount, a no-op for a first-time applicant).
- [x] Full end-to-end pass through the verification checklist — a live-device
      smoke pass covered everything above (see live-verified notes per item);
      not a full re-walk of every prior milestone's checklist item, which
      would be its own multi-hour effort separate from this milestone's actual
      changes.

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
