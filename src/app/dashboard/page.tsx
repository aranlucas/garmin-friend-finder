import { MapWrapper } from "@/components/MapWrapper";
import { Suspense } from "react";
import { getFriendsWithLocations } from "@/services/friends";
import { ErrorBoundary } from "react-error-boundary";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  const friends = await getFriendsWithLocations();

  return (
    <main className="flex min-h-screen flex-col items-center p-8 gap-8">
      <header className="w-full max-w-5xl flex justify-between items-center">
        <h1 className="text-4xl font-bold">Friend Locations</h1>
      </header>

      <section
        className="w-full max-w-5xl"
        aria-label="Map showing friend locations"
      >
        <div className="aspect-[21/9] rounded-lg overflow-hidden shadow-lg">
          <ErrorBoundary
            fallback={
              <div className="w-full h-full bg-red-50 dark:bg-red-900/10 flex items-center justify-center text-red-500">
                Error loading map
              </div>
            }
          >
            <Suspense
              fallback={
                <div className="w-full h-full animate-pulse bg-gray-200 dark:bg-gray-800" />
              }
            >
              <MapWrapper friends={friends} />
            </Suspense>
          </ErrorBoundary>
        </div>
      </section>

      <section className="w-full max-w-2xl" aria-label="Friends list">
        <div className="grid gap-4">
          {friends.map((friend) => (
            <div
              key={friend.id}
              className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
            >
              <h2 className="text-xl font-semibold">{friend.short_name}</h2>
              {friend.latitude && friend.longitude && (
                <p className="text-muted-foreground">
                  Location: {friend.latitude.toFixed(6)},{" "}
                  {friend.longitude.toFixed(6)}
                </p>
              )}
            </div>
          ))}
        </div>

        {friends.length === 0 && (
          <p className="text-center text-muted-foreground">
            No friends found. Add some friends to get started!
          </p>
        )}
      </section>
    </main>
  );
}
