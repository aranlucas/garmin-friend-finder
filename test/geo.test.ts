import { expect, test } from "vitest";
import { calculateDistance } from "@/lib/geo";

test("distance preserves coincident points and a quarter circumference", () => {
  expect(calculateDistance(47, -122, 47, -122)).toBe(0);
  expect(calculateDistance(0, 0, 0, 90)).toBeCloseTo((Math.PI * 20902231) / 2, 3);
});
