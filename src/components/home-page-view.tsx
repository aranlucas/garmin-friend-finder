import type { ReactNode } from "react";

interface HomePageViewProps {
  signIn: ReactNode;
}

export function HomePageView({ signIn }: Readonly<HomePageViewProps>) {
  return (
    <main className="relative min-h-screen bg-linear-to-b from-background via-background to-secondary/20">
      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="mbe-24 flex flex-col items-center text-center">
          <h1 className="mbe-6 text-5xl font-bold md:text-6xl">Mountain Safety Together</h1>
          <p className="mbe-8 max-w-2xl text-xl text-muted-foreground drop-shadow-sm md:text-2xl">
            Connect your Garmin device and share your location with trusted friends while exploring
            the mountains. Stay safe, stay connected.
          </p>
          <div className="rounded-lg bg-background/80 p-4 backdrop-blur-sm">{signIn}</div>
        </div>

        {/* Features Grid */}
        <div className="mbe-24 grid gap-8 md:grid-cols-3">
          <div className="rounded-lg border bg-card/80 p-6 shadow-lg backdrop-blur-sm transition-shadow hover:shadow-xl">
            <h3 className="mbe-3 text-xl font-semibold">Real-Time Tracking</h3>
            <p className="text-muted-foreground">
              See your friends locations in real-time through their Garmin devices, perfect for
              group adventures.
            </p>
          </div>
          <div className="rounded-lg border bg-card/80 p-6 shadow-lg backdrop-blur-sm transition-shadow hover:shadow-xl">
            <h3 className="mbe-3 text-xl font-semibold">Safety First</h3>
            <p className="text-muted-foreground">
              Know exactly where your group members are during mountain activities, enhancing safety
              and coordination.
            </p>
          </div>
          <div className="rounded-lg border bg-card/80 p-6 shadow-lg backdrop-blur-sm transition-shadow hover:shadow-xl">
            <h3 className="mbe-3 text-xl font-semibold">Easy Setup</h3>
            <p className="text-muted-foreground">
              Quick device registration and friend connections get you ready for your next adventure
              in minutes.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mbe-16 text-center">
          <h2 className="mbe-8 text-3xl font-bold">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center">
              <div className="mbe-4 flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                1
              </div>
              <h3 className="mbe-2 text-xl font-semibold">Sign Up</h3>
              <p className="text-muted-foreground">
                Create your account and sign in with your preferred method
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="mbe-4 flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                2
              </div>
              <h3 className="mbe-2 text-xl font-semibold">Register Device</h3>
              <p className="text-muted-foreground">
                Connect your Garmin device to start sharing your location
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="mbe-4 flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                3
              </div>
              <h3 className="mbe-2 text-xl font-semibold">Add Friends</h3>
              <p className="text-muted-foreground">
                Connect with your mountain buddies and start tracking
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
