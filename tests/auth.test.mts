import assert from "node:assert/strict";
import { mock, test } from "node:test";
import type { NextAuthConfig } from "next-auth";

let config: NextAuthConfig;
mock.module("next-auth", {
  exports: {
    default: (options: NextAuthConfig) => {
      config = options;
      return {};
    },
  },
});
await import("../src/auth.ts");

async function signIn(providerAccountId: string, temporaryId: string) {
  return config.callbacks!.jwt!({
    token: { sub: temporaryId },
    user: { id: temporaryId },
    account: { provider: "github", providerAccountId, type: "oauth" },
    trigger: "signIn",
  });
}

test("verified GitHub identity stays stable across sign-ins and distinct across accounts", async () => {
  const first = await signIn("101", "first-random-authjs-id");
  const returning = await signIn("101", "second-random-authjs-id");
  const other = await signIn("202", "third-random-authjs-id");
  assert.equal(first?.sub, "github:101");
  assert.equal(returning?.sub, first?.sub);
  assert.equal(other?.sub, "github:202");
});

test("client session updates cannot choose a location owner", async () => {
  const token = await config.callbacks!.jwt!({
    token: { sub: "github:101" },
    user: {},
    account: null,
    trigger: "update",
    session: { user: { id: "github:202" } },
  });
  assert.equal(token?.sub, "github:101");
});

test("server session exposes the signed subject as the location owner", async () => {
  const session = await config.callbacks!.session!({
    session: {
      sessionToken: "unused-jwt-session-token",
      userId: "unused-jwt-session-user",
      user: { id: "untrusted-session-field", email: "fixture@example.test", emailVerified: null },
      expires: new Date("2099-01-01") as Date & string,
    },
    user: { id: "unused", email: "fixture@example.test", emailVerified: null },
    token: { sub: "github:101" },
    newSession: {},
    trigger: "update",
  });
  assert.equal(session.user?.id, "github:101");
});

test("a missing signed subject cannot preserve an injected session owner", async () => {
  const session = await config.callbacks!.session!({
    session: {
      sessionToken: "unused",
      userId: "unused",
      user: { id: "github:202", email: "fixture@example.test", emailVerified: null },
      expires: new Date("2099-01-01") as Date & string,
    },
    user: { id: "unused", email: "fixture@example.test", emailVerified: null },
    token: {},
    newSession: {},
    trigger: "update",
  });
  assert.equal(session.user?.id, "");
});
