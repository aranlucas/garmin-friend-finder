# Friend Finder feature roadmap

Updated 2026-10-26. Proposed work; none of these milestones is a release claim.
Digits and MCP products take portfolio priority. This prototype is not an
emergency or rescue service.

## Starting point and chosen access model

Baseline: `ab681e050891e57d78e069ff11118ec4c1cb8ca4`. The
[README](README.md) and [API/access limitations](docs/architecture.md) describe
GitHub sign-in, a SQLite-backed map, submitted coordinates, distance and bearing.
There is no Garmin device or Garmin Connect synchronization. Dashboard sign-in
does not currently establish authorization for every location API.

The owner selected **only explicitly invited friends/groups**. Signing in alone
must not expose another person's position. Complete that boundary before a pilot
uses real locations; do not add public discovery or globally visible friends.

Target user: a small, consenting group coordinating a walk or outdoor meetup.

## Priorities

### 1. Create a private group and invite the right people

A group owner creates an outing, invites specific accounts, and sees accepted
members. Invite links, if used, must be expiring, single-use and bound to the
intended recipient rather than granting membership to any bearer.

Acceptance: every location read/write derives the actor from authentication and
checks current membership; a caller cannot choose another user's identity;
pending invitees and outsiders receive no group coordinates. Revocation removes
server access on subsequent requests. Test unauthenticated, cross-group,
expired-invite and removed-member cases through the actual APIs.

### 2. Deliberate sharing for one outing

Let each member start, pause and stop foreground phone location sharing, with a
visible audience and end time. Choose a short, documented retention policy for
the outing instead of building a permanent location history.

Acceptance: sharing requires a deliberate action, permission denial is
recoverable, stopping prevents further app submissions, and expired sharing
cannot be silently resumed. Explain that already viewed or copied coordinates
cannot be recalled. Background tracking is a separate platform capability.

### 3. A map that explains uncertainty

Show last update time, reported accuracy and unavailable/stale status beside each
member. Add a manually selected rendezvous point and a simple check-in.

Acceptance: an old coordinate never looks live; age remains legible after a
reconnect; bearing/distance are labeled as geometric estimates, not route or
arrival guidance. A check-in is an explicit action, not an inferred safety state.

### 4. Graceful loss of connectivity

Show that sharing has stopped updating, allow a fresh check-in after reconnect,
and distinguish pending from server-accepted updates.

Acceptance: retries cannot restore revoked membership or send an expired
outing's queued coordinates; any cached private data has an explicit cleanup
policy. Do not advertise offline live tracking or satellite delivery.

## First release and evidence

Start with invite acceptance, one foreground update and a correctly restricted
map for a single group. Use synthetic locations until authorization regressions
pass. Then observe one consenting group: setup assistance, time to see the
intended members, misunderstood stale positions, and successful stop/revoke
actions. Collect aggregate outcomes, not route history. A second outing is a
stronger value signal than the number of map loads.
