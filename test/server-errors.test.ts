import { afterEach, expect, test, vi } from "vitest";
import { reportServerError } from "@/lib/server-errors";

afterEach(() => vi.restoreAllMocks());

test("server diagnostics omit private exception messages, stacks, and custom names", () => {
  const diagnostic = vi.spyOn(process.stderr, "write").mockReturnValue(true);
  const error = new Error("Private verification code");
  error.name = "Private user identifier";
  reportServerError("registration_failed", error);

  expect(diagnostic).toHaveBeenCalledWith(
    `${JSON.stringify({ level: "error", event: "registration_failed", error: "Error" })}\n`,
  );
});

test("server diagnostics preserve standard error classes", () => {
  const diagnostic = vi.spyOn(process.stderr, "write").mockReturnValue(true);
  reportServerError("friends_failed", new TypeError("Private location data"));

  expect(diagnostic).toHaveBeenCalledWith(
    `${JSON.stringify({ level: "error", event: "friends_failed", error: "TypeError" })}\n`,
  );
});
