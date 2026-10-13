"use client";

import type { Friend } from "@/types";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const FriendsMap = dynamic(() => import("./friends-map"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-gray-200 dark:bg-gray-800" />,
});

interface MapWrapperProps {
  friends: Friend[];
}

export function MapWrapper({ friends }: MapWrapperProps) {
  return (
    <div className="size-full">
      <Suspense fallback={<div className="size-full animate-pulse bg-gray-200 dark:bg-gray-800" />}>
        <FriendsMap friends={friends} />
      </Suspense>
    </div>
  );
}
