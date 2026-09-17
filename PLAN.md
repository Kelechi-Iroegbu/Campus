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

_UI shells + real slot logic built (mock-backed, `src/data/serviceBooking.ts`
+ pure `src/lib/booking.ts`): `book/[serviceId].tsx` (date + slot-grid),
`components/booking/MonthCalendar.tsx` + `SlotGrid.tsx`, and
`vendor/products/availability.tsx`. Service CRUD reuses the vendor
`products/` tab in "service" copy mode. No `services`/`service_availability`/
`appointments` schema, no API, no exclusion constraint._

- [ ] Build `(vendor)/services/` tab: CRUD on `services` (name, description,
      duration, price) — shares the mock-backed `vendor/products/` tab via the
      `vendorMode` toggle; no dedicated `services/` route or persistence
- [x] Build `(vendor)/services/availability.tsx` (recurring weekly windows +
      date-specific overrides) — UI shell built as
      `vendor/products/availability.tsx` (mock-backed)
- [ ] Build `api/services+api.ts`, `api/services/[id]+api.ts`,
      `api/services/[id]/availability+api.ts`
- [ ] Build `api/services/[id]/slots+api.ts` (on-demand slot computation from
      availability + existing appointments — no materialized slots table)
- [x] Build student service browse flow: service list on vendor detail → service
      detail → date/slot-grid screen → confirm — UI shell built
      (`book/[serviceId].tsx` + booking components, mock-backed; booking a slot
      appends to the in-memory store and shows on the vendor side same session)
- [ ] Build `api/appointments+api.ts` (POST book — re-verify slot open, insert
      protected by exclusion constraint + debit wallet in one transaction; handle
      the race-lost/slot-taken error path)
- [ ] Build `api/appointments/[id]+api.ts`,
      `.../confirm+api.ts`, `.../complete+api.ts`, `.../cancel+api.ts`,
      `.../no-show+api.ts` (no-show refunds the student per confirmed decision)
- [ ] Build `(vendor)/bookings/` tab (incoming appointments list/detail,
      confirm/complete/cancel/no-show actions) — incoming bookings render in
      the mock-backed vendor `orders` tab in "service" mode; no dedicated
      `bookings/` route or status actions
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

_UI shells built (mock-backed, `src/data/vendorWallet.ts`): `vendor/wallet/`
(`index` + `all`) and the courier wallet `courier/wallet/` (`index` + `all`).
No transfer/recipient code, no payout API, no `recipient_code` column._

- [ ] Build Paystack transfer recipient creation (on approval or first payout
      request), store `recipient_code` on `vendor_profiles`
- [ ] Build `api/vendor/payout+api.ts` (atomic conditional wallet debit, emits
      Inngest event) — works for product/service `kind='vendor'` wallets now;
      courier wallets exercised in milestone 8
- [ ] Build `lib/inngest/functions/payouts.ts` (batches payout events, calls
      Paystack Transfer API)
- [ ] Handle `transfer.success` / `transfer.failed` / `transfer.reversed` webhooks
      (update `paystack_transactions`, credit wallet back on failure/reversal)
- [x] Build `(vendor)/wallet/index.tsx`, `(vendor)/wallet/payout.tsx`
      — `vendor/wallet/index.tsx` + `all.tsx` UI shells built (mock-backed).
      Real: still needs the `payout.tsx` request screen + the payout API.
- [ ] Note: enable "disable OTP for transfers" in Paystack dashboard before this
      can run unattended
- [ ] Verify: payout request debits wallet immediately, Inngest batches + calls
      Paystack, webhook updates status correctly, reversal credits wallet back

## 8. Courier + delivery marketplace (Milestone 8)

_UI shells built (mock-backed, `src/data/courier.ts`): the dedicated
top-level `src/app/courier/` shell — `dashboard.tsx`, `deliveries.tsx`,
`profile.tsx`, `wallet/` (`index` + `all`) — plus `components/courier/*`
(`RequestCard`, `ActiveDeliveryCard`). Marking a delivery delivered updates
the in-memory stats + wallet ledger for the session. This **replaces** the
Milestone 8 plan of `(vendor)/jobs/` + `(vendor)/deliveries/` tabs under the
vendor group (see Revision note (4)). No `delivery_jobs` schema/API, no
`send-delivery.tsx` errand screen._

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
- [x] Build the courier "Deliveries" screen (open job feed + claim, courier
      only) — UI shell built as `courier/dashboard.tsx` + `courier/deliveries.tsx`
      in the dedicated `courier/` shell (mock-backed), not a `(vendor)/jobs/` tab
- [x] Build the courier "My Deliveries" screen (claimed + history, courier
      only) — covered by the mock-backed `courier/deliveries.tsx` history
      section, not a separate `(vendor)/deliveries/` tab
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
      — student profile sub-screens already exist as mock-backed UI shells
      (`(tabs)/profile/`: `favorites`, `saved-vendors`, `help-support`,
      `addresses`, `edit-profile`, `notifications`, `settings`,
      `payment-methods`); `(vendor)/profile/edit-application.tsx` not built
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
