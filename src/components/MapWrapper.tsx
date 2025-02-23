"use client";

import type { Friend } from "@/types";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const FriendsMap = dynamic(() => import("./FriendsMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full animate-pulse bg-gray-200 dark:bg-gray-800" />
  ),
});

interface MapWrapperProps {
  friends: Friend[];
}

export function MapWrapper({ friends }: MapWrapperProps) {
  return (
    <div className="w-full h-full">
      <Suspense
        fallback={
          <div className="w-full h-full animate-pulse bg-gray-200 dark:bg-gray-800" />
        }
      >
        <FriendsMap friends={friends} />
      </Suspense>
    </div>
  );
}
