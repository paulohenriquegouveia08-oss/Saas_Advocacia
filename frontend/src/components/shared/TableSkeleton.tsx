export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
      <div className="border-b border-zinc-800 bg-zinc-900/80 px-6 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 rounded bg-zinc-700/50 animate-pulse flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-zinc-800/50 px-6 py-4 flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="h-4 rounded bg-zinc-800/50 animate-pulse flex-1"
              style={{ animationDelay: `${(i * cols + j) * 50}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
