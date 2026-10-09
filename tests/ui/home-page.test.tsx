import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("@/components/SignIn", () => ({
  default: () => <a href="/api/auth/signin">Get started</a>,
}));

import HomePage from "../../src/app/page";

test("home page renders the mountain safety heading", () => {
  render(<HomePage />);

  expect(
    screen.getByRole("heading", {
      level: 1,
      name: "Mountain Safety Together",
    }),
  ).toBeDefined();
});
