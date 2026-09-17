export default function Loading() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="h-16 w-96 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse mb-6"></div>
          <div className="h-24 w-2/3 max-w-2xl bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse mb-8"></div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-6 rounded-lg bg-card shadow-lg animate-pulse">
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded mb-3"></div>
              <div className="h-20 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
