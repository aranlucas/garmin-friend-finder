import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { Session } from "next-auth";

let session: Session | null = null;
const listLocations = mock.fn(async (_viewer: unknown) => [
  { id: "github:101", short_name: "A", latitude: 0, longitude: 0 },
]);
mock.module("../src/auth.ts", { exports: { auth: async () => session } });
mock.module("../src/services/friends.ts", {
  exports: { getFriendsWithLocations: listLocations },
});
mock.module("../src/components/MapWrapper.tsx", { exports: { MapWrapper: () => null } });
mock.module("next/navigation", {
  exports: {
    redirect: (path: string) => {
      throw new Error(`Redirect: ${path}`);
    },
  },
});
const { default: DashboardPage } = await import("../src/app/dashboard/page.tsx");

test("dashboard redirects anonymous visitors without reading locations", async () => {
  session = null;
  await assert.rejects(DashboardPage, /Redirect: \//);
  assert.equal(listLocations.mock.callCount(), 0);
});

test("dashboard passes verified identity and renders valid zero coordinates", async () => {
  session = { user: { id: "github:101" }, expires: "2099-01-01" };
  const markup = renderToStaticMarkup(await DashboardPage());
  assert.equal(listLocations.mock.calls[0].arguments[0], session.user);
  assert.match(markup, /Location: 0\.000000, 0\.000000/);
});
