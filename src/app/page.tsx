import { MapWrapper } from "./components/MapWrapper";
import { Suspense } from "react";
import { getFriendsWithLocations } from "@/services/friends";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const friends = await getFriendsWithLocations();

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="w-full max-w-5xl flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Friends Locations</h1>
        <Link
          href="/account/register"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Register
        </Link>
      </div>

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
              <h2 className="text-xl font-semibold">{friend.short_name}</h2>
              {friend.latitude && friend.longitude && (
                <p className="text-gray-500 dark:text-gray-400">
                  Location: {friend.latitude.toFixed(6)},{" "}
                  {friend.longitude.toFixed(6)}
                </p>
              )}
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
