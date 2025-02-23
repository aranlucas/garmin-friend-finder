"use client";

import type { Friend } from "@/types";
import dynamic from "next/dynamic";

const FriendsMap = dynamic(() => import("./FriendsMap"), {
  ssr: false,
});

export function MapWrapper({ friends }: { friends: Friend[] }) {
  return <FriendsMap friends={friends} />;
}
