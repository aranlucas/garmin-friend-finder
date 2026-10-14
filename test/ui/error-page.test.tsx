import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import ErrorPage from "@/app/error";

test("the error page exposes a safe reference and a non-submit recovery button", () => {
  const error = Object.assign(new Error("Private error details"), { digest: "reference-123" });
  const reset = vi.fn();
  render(<ErrorPage error={error} reset={reset} />);

  expect(screen.getByText("Error reference: reference-123")).toBeDefined();
  expect(screen.queryByText("Private error details")).toBeNull();
  const button = screen.getByRole("button", { name: "Try again" });

  expect(button.getAttribute("type")).toBe("button");
  fireEvent.click(button);
  expect(reset).toHaveBeenCalledOnce();
});
