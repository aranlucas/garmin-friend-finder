"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { icon } from "leaflet";
import { useEffect } from "react";

// Fix for default marker icon in Leaflet
const ICON = icon({
  iconUrl: "/friend-marker.svg",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

type FriendsMapProps = {
  friends: Array<{
    id: string;
    name: string;
    short_name: string;
    latitude: number;
    longitude: number;
  }>;
};

export default function FriendsMap({ friends }: FriendsMapProps) {
  if (friends.length === 0) {
    return (
      <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
        No locations to display
      </div>
    );
  }

  // Calculate center point from all friends
  const center = friends.reduce(
    (acc, friend) => {
      return {
        lat: acc.lat + friend.latitude / friends.length,
        lng: acc.lng + friend.longitude / friends.length,
      };
    },
    { lat: 0, lng: 0 }
  );

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={4}
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
          icon={ICON}
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
