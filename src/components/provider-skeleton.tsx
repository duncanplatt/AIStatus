export function ProviderSkeleton() {
  return (
    <div className="row-span-4 grid grid-rows-subgrid gap-0 rounded-2xl border border-transparent bg-card p-6 shadow-[0_0_15px_rgba(0,0,0,0.03)] dark:shadow-none ring-1 ring-card-border animate-pulse">
      {/* Row 1: Header */}
      <div className="pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-full bg-card-border" />
          <div className="h-5 w-24 rounded bg-card-border" />
        </div>
        <div className="h-4 w-20 rounded bg-card-border" />
      </div>
      {/* Row 2: Probes placeholder */}
      <div className="pb-4 space-y-2">
        <div className="h-3 w-16 rounded bg-card-border" />
        <div className="h-3 w-full rounded bg-card-border" />
        <div className="h-3 w-full rounded bg-card-border" />
      </div>
      {/* Row 3: Services placeholder */}
      <div className="pb-4 space-y-2">
        <div className="h-3 w-16 rounded bg-card-border" />
        <div className="h-3 w-full rounded bg-card-border" />
        <div className="h-3 w-3/4 rounded bg-card-border" />
      </div>
      {/* Row 4: empty */}
      <div />
    </div>
  );
}
