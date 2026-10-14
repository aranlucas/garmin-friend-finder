import {
  AppRouterContext,
  type AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import RegisterPage from "../../src/app/account/register/page";

afterEach(() => vi.restoreAllMocks());

function renderRegistration() {
  const push = vi.fn();

  const router: AppRouterInstance = {
    bfcacheId: "registration-test",
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    push,
    replace: vi.fn(),
    prefetch: vi.fn(),
  };

  render(
    <AppRouterContext.Provider value={router}>
      <RegisterPage />
    </AppRouterContext.Provider>,
  );
  fireEvent.change(screen.getByLabelText("Code"), { target: { value: "valid-code" } });
  fireEvent.change(screen.getByLabelText("Short Name"), { target: { value: "Trail friend" } });

  return push;
}

test("registration reports rejected requests and allows a successful retry", async () => {
  const fetchRequest = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(new Response(null, { status: 400 }))
    .mockResolvedValueOnce(new Response(null, { status: 200 }));

  const push = renderRegistration();
  fireEvent.click(screen.getByRole("button", { name: "Register" }));

  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    "Registration failed. Check your code and try again.",
  );
  expect(push).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Register" }));
  await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  expect(screen.queryByRole("alert")).toBeNull();
  expect(fetchRequest).toHaveBeenCalledTimes(2);
  expect(fetchRequest).toHaveBeenLastCalledWith("/api/account/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "valid-code", shortName: "Trail friend" }),
  });
});

test("registration displays network failure and restores the submit button", async () => {
  vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network unavailable"));
  const push = renderRegistration();
  fireEvent.click(screen.getByRole("button", { name: "Register" }));

  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    "Unable to register. Check your connection and try again.",
  );
  expect(screen.getByRole("button", { name: "Register" })).toHaveProperty("disabled", false);
  expect(push).not.toHaveBeenCalled();
});

test("registration disables repeat clicks while its request is pending", async () => {
  const pending = Promise.withResolvers<Response>();
  const fetchRequest = vi.spyOn(globalThis, "fetch").mockReturnValue(pending.promise);
  renderRegistration();
  fireEvent.click(screen.getByRole("button", { name: "Register" }));
  const submitting = screen.getByRole("button", { name: "Registering…" });

  expect(submitting).toHaveProperty("disabled", true);
  fireEvent.click(submitting);
  expect(fetchRequest).toHaveBeenCalledOnce();
  pending.resolve(new Response(null, { status: 400 }));
  expect(await screen.findByRole("alert")).toBeDefined();
  expect(screen.getByRole("button", { name: "Register" })).toHaveProperty("disabled", false);
});
