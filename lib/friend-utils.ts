import type { Friend, FriendBearingInfo } from "../types";
import db from "./db";

let data = [
  {
    id: "1",
    name: "Wen",
    short_name: "WW",
    latitude: 37.7749,
    longitude: -122.4194,
  },
  {
    id: "2",
    name: "Case",
    short_name: "CW",
    latitude: 40.7128,
    longitude: -74.006,
  },
  {
    id: "3",
    name: "Lucas",
    short_name: "LA",
    latitude: 51.5074,
    longitude: -0.1278,
  },
];

export function updateLocations() {
  data = data.map((friend) => ({
    ...friend,
    latitude: friend.latitude + (Math.random() - 0.5) * 0.001,
    longitude: friend.longitude + (Math.random() - 0.5) * 0.001,
  }));
  return data;
}

export function calculateBearing(user: Friend, friend: Friend): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const toDegrees = (radians: number) => (radians * 180) / Math.PI;

  const lat1 = toRadians(user.latitude);
  const lat2 = toRadians(friend.latitude);
  const deltaLon = toRadians(friend.longitude - user.longitude);

  const y = Math.sin(deltaLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);

  let bearing = Math.atan2(y, x);
  bearing = toDegrees(bearing);
  bearing = (bearing + 360) % 360;

  return bearing;
}

export function getFriends(user: Friend): FriendBearingInfo[] {
  const friendIds = db.get<String[]>("friends") || [];

  return friendIds
    .map((id) => {
      if (id === user.id) return null;
      const friend = db.get<Friend>(`friend:${id}`);
      if (!friend) return null;

      const bearing = calculateBearing(user, friend);
      return {
        id: friend.id,
        short_name: friend.short_name,
        bearing,
      } as FriendBearingInfo;
    })
    .filter(Boolean) as FriendBearingInfo[];
}
