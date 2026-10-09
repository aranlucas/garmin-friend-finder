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
- The local database initializer creates the schema and a sample user.

The project does not currently connect to Garmin Connect or sync directly from a Garmin device. The map displays coordinates already written to the app's database.

## Try it locally

Requirements: Node.js 24 and pnpm 12.6.

```sh
pnpm install
pnpm run init-db
```

Create .env.local with a GitHub OAuth app configured for http://localhost:3000:

```dotenv
AUTH_GITHUB_ID=your-github-oauth-client-id
AUTH_GITHUB_SECRET=your-github-oauth-client-secret
AUTH_SECRET=replace-with-a-random-secret
AUTH_URL=http://localhost:3000
```

Start the development server and open [http://localhost:3000](http://localhost:3000):

```sh
pnpm dev
```

The SQLite file is friends.db in the project root. Do not use a production database containing real location data for local development.

### Named local URL with Portless (optional)

After the normal project setup, use [Portless](https://github.com/vercel-labs/portless/tree/v0.15.7)
to run this app alongside other repositories without choosing a port. Use Node.js
24 or newer, within this project's supported Node version, and install the CLI once:

```sh
npm install -g portless@0.15.7
pnpm dev:portless
```

With default proxy settings, the primary checkout is available at
[https://garmin-friend-finder.localhost](https://garmin-friend-finder.localhost). Portless runs the
existing `dev` script with an available `PORT`. Linked Git worktrees get a branch
prefix; use the exact URL printed at startup. The proxy reuses its most recent
settings, so a custom port or domain can change that URL.

Run the first launch in an interactive terminal: the default HTTPS setup may ask
to trust a local certificate authority and request administrator access for port
443 and local hostname entries. Use `portless list` to see routes and
`portless doctor` for connection or certificate problems.

For GitHub sign-in, set `AUTH_URL=https://garmin-friend-finder.localhost` in
`.env.local` and configure your development GitHub OAuth app with the callback
`https://garmin-friend-finder.localhost/api/auth/callback/github`. Keep the existing
`AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, and `AUTH_SECRET` setup. Each worktree URL
needs a matching OAuth callback; use the normal localhost workflow when the OAuth
app is still configured for `http://localhost:3000`.

Use `pnpm dev` for the original localhost workflow.

## Find your way around

- src/app/ contains the landing page, authenticated dashboard, registration page, and API routes.
- src/services/friends.ts reads and updates SQLite friend and location records.
- src/lib/geo.ts calculates distance and bearing.
- src/components/FriendsMap.tsx renders friend markers with Leaflet.
- scripts/init-db.ts creates the local schema and inserts a sample record.

Available checks:

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```
