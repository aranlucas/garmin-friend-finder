export default function Loading() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="mbe-16 flex flex-col items-center text-center">
          <div className="mbe-6 h-16 w-96 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          <div className="mbe-8 h-24 w-2/3 max-w-2xl animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
        </div>

        {/* Features Grid */}
        <div className="mbe-16 grid gap-8 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={`skeleton-${index}`}
              className="animate-pulse rounded-lg bg-card p-6 shadow-lg"
            >
              <div className="mbe-3 h-6 w-32 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-20 w-full rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
