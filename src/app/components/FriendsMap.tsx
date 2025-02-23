"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { icon, latLngBounds, LatLngBounds } from "leaflet";
import { Friend } from "@/types";

// Fix for default marker icon in Leaflet
const FriendIcon = icon({
  iconUrl: "/friend-marker.svg",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

type FriendsMapProps = {
  friends: Friend[];
};

export default function FriendsMap({ friends }: FriendsMapProps) {
  if (friends.length === 0) {
    return (
      <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
        No locations to display
      </div>
    );
  }

  // Calculate bounds from all friends
  const bounds = friends.reduce((acc: LatLngBounds | null, friend) => {
    const latLng = [friend.latitude, friend.longitude] as [number, number];
    if (!acc) {
      return latLngBounds([latLng]);
    }
    return acc.extend(latLng);
  }, null);

  // Add padding to bounds
  const paddedBounds = bounds?.pad(0.2);

  return (
    <MapContainer
      bounds={paddedBounds || undefined}
      zoom={paddedBounds ? undefined : 4}
      center={paddedBounds ? undefined : [0, 0]}
      className="h-[400px] rounded-lg z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {friends.map((friend) => (
        <Marker
          key={friend.id}
          position={[friend.latitude, friend.longitude]}
          icon={FriendIcon}
        >
          <Popup>
            <div className="text-sm">
              <strong>{friend.name}</strong>
              <br />
              {friend.short_name}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
