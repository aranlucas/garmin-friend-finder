import { expect, test } from "vitest";
import { calculateDistance } from "@/lib/geo";

test.each([
  [-58, 0, 58, 180],
  [-27, 0, 27, 180],
  [12, 0, -12, 180],
])("antipodal distance stays finite for %s / %s to %s / %s", (lat1, lon1, lat2, lon2) => {
  expect(calculateDistance(lat1, lon1, lat2, lon2)).toBeCloseTo(Math.PI * 20902231, 3);
});

test("distance preserves coincident points and a quarter circumference", () => {
  expect(calculateDistance(47, -122, 47, -122)).toBe(0);
  expect(calculateDistance(0, 0, 0, 90)).toBeCloseTo((Math.PI * 20902231) / 2, 3);
});
