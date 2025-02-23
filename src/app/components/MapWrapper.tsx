"use client";

import dynamic from "next/dynamic";
import { type Friend } from "@/types";

const FriendsMap = dynamic(() => import("./FriendsMap"), {
  ssr: false,
});

export function MapWrapper({ friends }: { friends: Friend[] }) {
  return <FriendsMap friends={friends} />;
}
