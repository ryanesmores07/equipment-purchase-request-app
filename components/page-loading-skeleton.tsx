export function PageLoadingSkeleton({
  variant = "detail",
}: {
  variant?: "list" | "detail" | "form";
}) {
  const blocks =
    variant === "list"
      ? ["h-8 w-48", "h-10 w-full", "h-56 w-full"]
      : variant === "form"
        ? ["h-5 w-32", "h-8 w-64", "h-10 w-full", "h-10 w-full", "h-10 w-full", "h-32 w-full"]
        : ["h-5 w-32", "h-8 w-64", "h-40 w-full", "h-28 w-full"];

  return (
    <section
      aria-label="読み込み中"
      aria-busy="true"
      className="grid max-w-2xl gap-4"
    >
      <p className="text-sm font-medium text-zinc-600">読み込み中...</p>
      {blocks.map((block, index) => (
        <div
          className={`${block} animate-pulse rounded-md bg-zinc-200`}
          key={`${block}-${index}`}
        />
      ))}
    </section>
  );
}
