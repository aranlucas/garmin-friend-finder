# Keep the crew in view when the trail gets big

[![CI](https://github.com/aranlucas/garmin-friend-finder/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/aranlucas/garmin-friend-finder/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-local_location_data-003B57?logo=sqlite&logoColor=white)

A small location-sharing prototype for outdoor groups inspired by Garmin friend tracking. Sign in, share a location with the group, and see saved coordinates on a Leaflet map.

![Illustration of hikers and friends sharing trail locations](docs/images/readme-cover.png)

_Concept artwork for the outdoor safety use case; it is not a screenshot of the app._

## What works today

- GitHub sign-in through Auth.js.
- A map and friend list backed by SQLite.
- POST /api/friends accepts an id, lat, and lon, stores the submitted coordinates, then returns other friends' locations with distance and bearing from that point.
- SQLite schema migrations run automatically before the first database request.

The project does not currently connect to Garmin Connect or sync directly from a Garmin device. The map displays coordinates already written to the app's database.

## Try it locally

Requirements: Node.js 24 and pnpm 12.14.

```sh
pnpm install
```

Create .env.local with a GitHub OAuth app configured for https://garmin-friend-finder.localhost:

```dotenv
AUTH_GITHUB_ID=your-github-oauth-client-id
AUTH_GITHUB_SECRET=your-github-oauth-client-secret
AUTH_SECRET=replace-with-a-random-secret
AUTH_URL=https://garmin-friend-finder.localhost
```

Start the development server and open [https://garmin-friend-finder.localhost](https://garmin-friend-finder.localhost). `pnpm dev` runs through [Portless](https://github.com/vercel-labs/portless) (a dev dependency); its first run may ask for `sudo` to bind port 443 and trust a local certificate.

```sh
pnpm dev
```

The SQLite file defaults to friends.db in the project root. Set `DATABASE_PATH` in .env.local to use another file; its parent directory must already exist. The first database request applies pending migrations through the app's existing SQLite library. There is no separate initialization command or SQLite CLI requirement. Existing users, locations, and pending verification codes are preserved. Do not use a production database containing real location data for local development.

The database starts without demo records. To add the sample user during development, set `SEED_DEMO_DATA=true` in .env.local and restart `pnpm dev`. The seed runs when the database connection opens, preserves existing records, and is ignored in production.

Schema changes go in new numbered SQL files under db/migrations/. Keep previously released migrations unchanged and present: the library tracks applied versions and handles each migration's transaction. Migrations run once per process connection setup, before it is shared with callers; use a single migration runner before serving traffic if deploying multiple app processes against the same database.

## Find your way around

- src/app/ contains the landing page, authenticated dashboard, registration page, and API routes.
- src/services/friends.ts reads and updates SQLite friend and location records.
- src/lib/geo.ts calculates distance and bearing.
- src/components/FriendsMap.tsx renders friend markers with Leaflet.
- src/lib/db.ts opens the shared connection, enables foreign keys, and applies db/migrations/ before queries can run.
- db/seed.sql contains optional development demo data.

Available checks:

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```
