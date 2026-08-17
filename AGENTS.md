# CampUs — Agent Instructions

## Expo version pinning
Expo SDK 57 is new/has changed significantly. Read the exact versioned docs at
https://docs.expo.dev/versions/v57.0.0/ before writing any code against an Expo
or Expo Router API — do not rely on general/older-SDK knowledge.

## Tech stack
- **Framework**: Expo (SDK 57) + React Native 0.86 + React 19, TypeScript
- **Routing**: Expo Router, file-based, routes live in `src/app`
- **Navigation**: native tabs only — see hard requirement below
- **Styling**: NativeWind (Tailwind classes via `className`), not `StyleSheet.create`
  unless required for a native-driven animation
- **Animation**: Reanimated 4 + react-native-worklets
- **Database**: Postgres hosted on Neon
- **ORM**: Drizzle ORM, drizzle-kit for schema/migrations — no raw SQL client,
  no other ORM
- **Auth**: Clerk (`@clerk/clerk-expo`) — use the `clerk-expo` skill for setup,
  flows, and protected routes; don't hand-roll session/token logic
- **Image optimization**: ImageKit — user-facing images are served/transformed
  through ImageKit, not raw/unoptimized URLs
- **Background jobs**: Inngest — async or scheduled work goes through Inngest
  functions, not inline fire-and-forget calls
- **Error tracking & monitoring**: Sentry (`@sentry/react-native`), already
  wired via the `app.json` plugin

## Navigation rule (hard requirement)
This app always uses **native tabs** — the platform's real tab bar
(`UITabBarController` on iOS, `BottomNavigation` on Android), rendered through
Expo Router's native tabs API (`expo-router/unstable-native-tabs` as of SDK 57 —
confirm the current import path against the versioned docs above, since it may
stabilize/rename between SDKs).

Never use a JS-rendered tab bar — no `@react-navigation/bottom-tabs`, no custom
`View`-based tab bar, not even as a stopgap or for a single screen. If native
tabs don't support something a JS tab bar would, solve it within native tabs or
ask; don't silently swap in a JS implementation.

## Conventions
- Screens/routes: `src/app/**` (file-based routing)
- Styling: NativeWind `className`, Tailwind config in `tailwind.config.js`
- DB schema: Drizzle schema files; migrations via drizzle-kit against
  `DATABASE_URL` (Neon connection string in `.env`)
- Auth-gated routes: Clerk session checks per the `clerk-expo` skill

## Commands
- `npm run android` / `npm run ios` / `npm run web`
- `npm run lint` (expo lint)
- Drizzle: `drizzle-kit generate` / `drizzle-kit push` (once configured)

## Reference docs
- `DESIGN.md` — product/design spec
- `PLAN.md` — build plan
