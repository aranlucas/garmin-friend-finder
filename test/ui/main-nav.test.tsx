import { fireEvent, render, screen } from "@testing-library/react";
import { SessionProvider } from "next-auth/react";
import { afterEach, expect, test, vi } from "vitest";
import { MainNav } from "@/components/main-nav";

afterEach(() => vi.restoreAllMocks());

test("sign-out failure stays visible after the menu closes and permits another attempt", async () => {
  const fetchRequest = vi
    .spyOn(globalThis, "fetch")
    .mockRejectedValue(new Error("Connection lost"));

  render(
    <SessionProvider session={{ user: { name: "Trail friend" }, expires: "2099-01-01T00:00:00Z" }}>
      <MainNav />
    </SessionProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "User menu" }));
  fireEvent.click(await screen.findByRole("menuitem", { name: "Sign out" }));

  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    "Unable to sign out. Please try again.",
  );
  expect(fetchRequest).toHaveBeenCalled();
  const attempts = fetchRequest.mock.calls.length;
  fireEvent.click(screen.getByRole("button", { name: "User menu" }));
  fireEvent.click(await screen.findByRole("menuitem", { name: "Sign out" }));

  expect(await screen.findByRole("alert")).toBeDefined();
  expect(fetchRequest.mock.calls.length).toBeGreaterThan(attempts);
});
