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
- Authenticated GET /api/friends lists all friends and their saved coordinates.
- Authenticated POST /api/friends accepts lat and lon form fields, updates only the signed-in user's location, then returns other located friends with distance and bearing from that point.
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

## Location access and account identity

Both friends endpoints require an Auth.js session. The current prototype shares all saved friend locations with every signed-in viewer; it does not implement private groups or invitations.

POST accepts one decimal latitude in [-90, 90] and one decimal longitude in [-180, 180]. Zero is valid. Missing, duplicate, blank, nonnumeric, nonfinite, file, and out-of-range fields return 400. The legacy id form field is ignored: ownership comes only from the verified session. Anonymous requests return 401 before reading the request body or database.

GitHub sign-in exposes a stable session.user.id of github:<GitHub account ID>. A matching users record must already exist before that account can share a location; otherwise POST returns 404 with user_not_found. For local test fixtures, use that authenticated ID as users.id. The initializer's sample device ID and previously registered device IDs are not automatically linked to GitHub accounts. A secure device-to-account linking flow is still needed before those devices can publish locations again; knowing a device ID is not proof of ownership. Sign out and back in after upgrading to obtain the stable identity.

The existing device registration endpoints remain prototype code and are not a device authentication mechanism. Review that workflow and the broad signed-in sharing policy before using real location data.

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
pnpm test
pnpm build
```

The tests run the actual friends route and location module against an isolated in-memory SQLite database, with Auth.js mocked. They never open friends.db or contact GitHub. The test runner uses Node's experimental module-mocking flag.
