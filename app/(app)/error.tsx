"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error({
    op: "app-route-error",
    digest: error.digest,
    message: error.message,
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <section className="rounded-md border border-red-200 bg-red-50 p-4">
        <h1 className="font-semibold text-red-800">Something went wrong</h1>
        <p className="mt-1 text-sm text-red-700">
          Please try again. If this keeps happening, check the server logs.
        </p>
        <button
          className="mt-4 rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-800"
          onClick={reset}
          type="button"
        >
          Retry
        </button>
      </section>
    </main>
  );
}
