import { randomUUID } from "node:crypto";
import { test } from "@e2e-dev/web";
import { expect } from "e2e";
import { z } from "zod";

test("device registration recovers from a wrong code and persists a usable account and location", async ({
  app,
  screen,
  browser,
}) => {
  const session = await fetch(`${app.baseUrl}/api/auth/session`);

  expect(session.status).toBe(200);
  expect(await session.json()).toBeNull();

  const id = `ci-${randomUUID()}`;

  const issued = await fetch(`${app.baseUrl}/api/account`, {
    method: "POST",
    body: new URLSearchParams({ id }),
  });

  expect(issued.status).toBe(201);
  const { code } = z.object({ code: z.string() }).parse(await issued.json());

  await app.open("/account/register");
  await screen.getByLabel("Code", { exact: true }).fill("invalid-code");
  await screen.getByLabel("Short Name").fill("CI Trail Friend");
  await screen.getByRole("button", { name: "Register", exact: true }).tap();
  await expect(
    screen
      .getByRole("alert")
      .filter({ hasText: "Registration failed. Check your code and try again." }),
  ).toContainText("Registration failed. Check your code and try again.");
  expect((await fetch(`${app.baseUrl}/api/account?id=${id}`)).status).toBe(204);

  await screen.getByLabel("Code", { exact: true }).fill(code);
  await screen.getByRole("button", { name: "Register", exact: true }).tap();
  await expect(browser).toHaveURL("/");
  expect((await fetch(`${app.baseUrl}/api/account?id=${id}`)).status).toBe(200);

  const replay = await fetch(`${app.baseUrl}/api/account/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, shortName: "Overwrite" }),
  });

  expect(replay.status).toBe(404);

  const location = await fetch(`${app.baseUrl}/api/friends`, {
    method: "POST",
    body: new URLSearchParams({ id, lat: "0", lon: "1" }),
  });

  expect(location.status).toBe(200);
  const friends = await fetch(`${app.baseUrl}/api/friends`);

  const saved = z
    .array(
      z.object({
        id: z.string(),
        short_name: z.string(),
        latitude: z.number().nullable(),
        longitude: z.number().nullable(),
      }),
    )
    .parse(await friends.json());

  expect(saved.find((friend) => friend.id === id)).toEqual({
    id,
    short_name: "CI Trail Friend",
    latitude: 0,
    longitude: 1,
  });
});
