"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { icon, latLngBounds, LatLngBounds, LatLngTuple } from "leaflet";
import type { Friend } from "@/types";
import { ErrorBoundary } from "react-error-boundary";

const MAP_CONFIG = {
  SEATTLE: {
    position: [47.6062, -122.3321] as LatLngTuple,
    zoom: 12,
  },
  BOUNDS_PADDING: 0.2,
  ATTRIBUTION:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  TILE_URL: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
} as const;

const FRIEND_ICON = icon({
  iconUrl: "/friend-marker.svg",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function calculateBounds(friends: Friend[]): LatLngBounds | null {
  if (friends.length === 0) return null;

  const coordinates = friends.map(
    (friend): LatLngTuple => [friend.latitude, friend.longitude],
  );
  return latLngBounds(coordinates).pad(MAP_CONFIG.BOUNDS_PADDING);
}

function FallbackComponent() {
  return (
    <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
      Error loading map
    </div>
  );
}

export default function FriendsMap({ friends }: { friends: Friend[] }) {
  const bounds = calculateBounds(friends);

  return (
    <ErrorBoundary FallbackComponent={FallbackComponent}>
      <MapContainer
        bounds={bounds || undefined}
        zoom={bounds ? undefined : MAP_CONFIG.SEATTLE.zoom}
        center={bounds ? undefined : MAP_CONFIG.SEATTLE.position}
        className="w-full h-full rounded-lg z-0"
      >
        <TileLayer
          attribution={MAP_CONFIG.ATTRIBUTION}
          url={MAP_CONFIG.TILE_URL}
        />
        {friends.map((friend) => (
          <Marker
            key={friend.id}
            position={[friend.latitude, friend.longitude]}
            icon={FRIEND_ICON}
          >
            <Popup className="text-sm font-medium">{friend.short_name}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </ErrorBoundary>
  );
}
