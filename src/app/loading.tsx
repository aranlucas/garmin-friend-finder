export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <h1 className="text-4xl font-bold mb-8">Friends Locations</h1>
      <div className="w-full max-w-5xl mb-8 h-[400px] animate-pulse bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
      <div className="w-full max-w-2xl space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 rounded-lg bg-gray-200 dark:bg-gray-800"></div>
          </div>
        ))}
      </div>
    </main>
  );
}
