import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import DashboardPage from "@/app/dashboard/page";

// oxlint-disable-next-line anti-slop/no-module-mocking -- Isolate server authentication/storage and browser-only Leaflet while asserting server-rendered coordinates.
vi.mock("@/auth", () => ({ auth: vi.fn().mockResolvedValue({ user: { name: "Friend" } }) }));

// oxlint-disable-next-line anti-slop/no-module-mocking -- Isolate server authentication/storage and browser-only Leaflet while asserting server-rendered coordinates.
vi.mock("@/services/friends", () => ({
  getFriendsWithLocations: vi
    .fn()
    .mockResolvedValue([{ id: "zero", short_name: "Equator friend", latitude: 0, longitude: 0 }]),
}));

// oxlint-disable-next-line anti-slop/no-module-mocking -- Isolate server authentication/storage and browser-only Leaflet while asserting server-rendered coordinates.
vi.mock("@/components/map-wrapper", () => ({ MapWrapper: () => null }));

test("dashboard displays located friends at zero latitude and longitude", async () => {
  render(await DashboardPage());
  expect(screen.getByText("Equator friend")).toBeDefined();
  expect(screen.getByText("Location: 0.000000, 0.000000")).toBeDefined();
});
