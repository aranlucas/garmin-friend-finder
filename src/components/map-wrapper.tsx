"use client";

import type { LocatedFriend } from "@/types";
import dynamic from "next/dynamic";
import { ErrorBoundary } from "react-error-boundary";

const FriendsMap = dynamic(() => import("./friends-map"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-gray-200 dark:bg-gray-800" />,
});

interface MapWrapperProps {
  friends: LocatedFriend[];
}

export function MapWrapper({ friends }: MapWrapperProps) {
  return (
    <div className="size-full">
      <ErrorBoundary
        fallback={
          <div className="flex size-full items-center justify-center rounded-lg bg-gray-100 text-gray-600">
            Error loading map
          </div>
        }
      >
        <FriendsMap friends={friends} />
      </ErrorBoundary>
    </div>
  );
}
