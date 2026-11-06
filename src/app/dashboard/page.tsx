import { MapWrapper } from "@/components/map-wrapper";
import { getFriendsWithLocations } from "@/services/friends";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const friends = await getFriendsWithLocations();

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 p-8">
      <header className="flex w-full max-w-5xl items-center justify-between">
        <h1 className="text-4xl font-bold">Friend Locations</h1>
      </header>

      <section className="w-full max-w-5xl" aria-label="Map showing friend locations">
        <div className="aspect-21/9 overflow-hidden rounded-lg shadow-lg">
          <MapWrapper friends={friends} />
        </div>
      </section>

      <section className="w-full max-w-2xl" aria-label="Friends list">
        <div className="grid gap-4">
          {friends.map((friend) => (
            <div
              key={friend.id}
              className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
            >
              <h2 className="text-xl font-semibold">{friend.short_name}</h2>
              <p className="text-muted-foreground">
                Location: {friend.latitude.toFixed(6)}, {friend.longitude.toFixed(6)}
              </p>
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
