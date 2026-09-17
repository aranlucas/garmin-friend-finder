# Garmin Friend Finder

A Next.js app for finding and tracking Garmin friends.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19
- TypeScript 7
- Tailwind CSS v4 (CSS-first config)
- pnpm for package management
- oxlint for linting, oxfmt for formatting (replacing ESLint + Prettier)
- Auth.js v5 (next-auth beta) with GitHub provider
- SQLite (`sqlite` + `sqlite3`) for local storage
- Leaflet / react-leaflet for maps

## Prerequisites

- Node.js 24
- pnpm 10+ (`corepack enable` or install from https://pnpm.io)
- GitHub OAuth credentials for sign-in (`AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`)

## Run locally

```bash
pnpm install
pnpm run init-db
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verify

```bash
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm run build
pnpm audit --prod
```

All five pass on a clean checkout.

## Recent modernization

- **pnpm instead of npm**: `package-lock.json` removed, `pnpm-lock.yaml` +
  `pnpm-workspace.yaml` added (`allowBuilds` for `sqlite3`/`esbuild`),
  `packageManager` pinned, CI/Dependabot switched to pnpm.
- **oxlint / oxfmt**: `.eslintrc.json`, `.prettierrc`, `.prettierignore` and all
  `eslint-*` / `prettier` deps removed; `.oxlintrc.json` (nextjs + react +
  typescript plugins) and `.oxfmtrc.json` added; `lint`/`format` scripts use
  `oxlint` / `oxfmt`.
- **TypeScript 7**: `tsconfig.json` target raised `ES2017` → `ES2022`, stale
  `tailwind.config.js` include dropped.
- **Latest Next.js**: on Next 16.3.5; `next.config.js` → typed `next.config.ts`;
  removed deprecated `legacyBehavior`/`passHref` links, manual theme `<script>`
  in favor of `next-themes`, and needless `force-dynamic` on the static
  homepage.
- **Tailwind v4 cleanup**: `tailwind.config.ts` deleted (CSS-first),
  `tailwindcss-animate` → `tw-animate-css`, odd `cn` stub package replaced with
  `clsx` + `tailwind-merge`.
- **SQLite singleton**: top-level-await `db` export replaced with a cached
  `getDb()` (survives dev HMR); all services and API routes updated.
- `next-auth` beta refreshed to the latest beta (`5.0.0-beta.32`).
- Local `*.db` files are now gitignored; editor settings and CI point at
  oxlint/oxfmt.
