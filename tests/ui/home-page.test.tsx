import Link from "next/link";
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { HomePageView } from "../../src/components/home-page-view";

test("home page renders the mountain safety heading", () => {
  render(<HomePageView signIn={<Link href="/api/auth/signin">Get started</Link>} />);

  expect(
    screen.getByRole("heading", {
      level: 1,
      name: "Mountain Safety Together",
    }),
  ).toBeDefined();
  expect(screen.getByRole("link", { name: "Get started" }).getAttribute("href")).toBe(
    "/api/auth/signin",
  );
});
