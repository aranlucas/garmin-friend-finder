"use client";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h2 className="mbe-4 text-2xl font-bold">Something went wrong!</h2>
      {error.digest && <p className="mbe-4">Error reference: {error.digest}</p>}
      <button
        type="button"
        className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        onClick={() => reset()}
      >
        Try again
      </button>
    </main>
  );
}
