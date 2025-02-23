import db from "@/lib/db";
import { MapWrapper } from "./components/MapWrapper";
import { type Friend } from "@/types";
import { Suspense } from "react";

async function getFriends(): Promise<Friend[]> {
  const friends = await db.all<Friend[]>("SELECT * FROM friends ORDER BY name");
  return friends;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const friends = await getFriends();

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <h1 className="text-4xl font-bold mb-8">Friends Locations</h1>

      <div className="w-full max-w-5xl mb-8">
        <Suspense
          fallback={
            <div className="w-full h-[400px] animate-pulse bg-gray-200 dark:bg-gray-800 rounded-lg" />
          }
        >
          <MapWrapper friends={friends} />
        </Suspense>
      </div>

      <div className="w-full max-w-2xl">
        <div className="grid gap-4">
          {friends.map((friend) => (
            <div
              key={friend.id}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-800"
            >
              <h2 className="text-xl font-semibold">{friend.name}</h2>
              <p className="text-gray-500 dark:text-gray-400">
                {friend.short_name} - Location: {friend.latitude.toFixed(6)},{" "}
                {friend.longitude.toFixed(6)}
              </p>
            </div>
          ))}
        </div>

        {friends.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No friends found. Add some friends to get started!
          </p>
        )}
      </div>
    </main>
  );
}
