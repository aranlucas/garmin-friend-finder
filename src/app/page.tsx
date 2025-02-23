import SignIn from "@/components/SignIn";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-secondary to-accent bg-clip-text">
            Mountain Safety Together
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-8">
            Connect your Garmin device and share your location with trusted friends while exploring the mountains. Stay safe, stay connected.
          </p>
          <SignIn />
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="p-6 rounded-lg bg-card shadow-lg">
            <h3 className="text-xl font-semibold mb-3">Real-Time Tracking</h3>
            <p className="text-muted-foreground">See your friends locations in real-time through their Garmin devices, perfect for group adventures.</p>
          </div>
          <div className="p-6 rounded-lg bg-card shadow-lg">
            <h3 className="text-xl font-semibold mb-3">Safety First</h3>
            <p className="text-muted-foreground">Know exactly where your group members are during mountain activities, enhancing safety and coordination.</p>
          </div>
          <div className="p-6 rounded-lg bg-card shadow-lg">
            <h3 className="text-xl font-semibold mb-3">Easy Setup</h3>
            <p className="text-muted-foreground">Quick device registration and friend connections get you ready for your next adventure in minutes.</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-8">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center mb-4">1</div>
              <h3 className="text-xl font-semibold mb-2">Sign Up</h3>
              <p className="text-muted-foreground">Create your account and sign in with your preferred method</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center mb-4">2</div>
              <h3 className="text-xl font-semibold mb-2">Register Device</h3>
              <p className="text-muted-foreground">Connect your Garmin device to start sharing your location</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center mb-4">3</div>
              <h3 className="text-xl font-semibold mb-2">Add Friends</h3>
              <p className="text-muted-foreground">Connect with your mountain buddies and start tracking</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
