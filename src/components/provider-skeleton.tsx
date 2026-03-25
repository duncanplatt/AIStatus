export function ProviderSkeleton({ slug }: { slug?: string }) {
  return (
    <div
      id={slug}
      className="scroll-mt-6 row-span-4 grid grid-rows-subgrid gap-0 rounded-2xl border border-transparent bg-card p-5 sm:p-6 shadow-[0_0_15px_rgba(0,0,0,0.03)] dark:shadow-none ring-1 ring-card-border animate-pulse"
    >
      {/* Row 1: Header */}
      <div className="pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-full bg-card-border" />
          <div className="h-6 w-24 rounded bg-card-border" />
        </div>
        <div className="h-6 w-20 rounded-full bg-card-border" />
      </div>

      {/* Row 2: Probes placeholder */}
      <div className="pb-4 space-y-1.5">
        <div className="h-4 w-20 rounded bg-card-border mb-3" />
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2 w-full">
            <div className="h-2 w-2 rounded-full bg-card-border shrink-0" />
            <div className="h-4 w-1/3 rounded bg-card-border" />
            <div className="h-3 w-12 rounded bg-card-border ml-2" />
          </div>
          <div className="h-4 w-10 rounded bg-card-border shrink-0" />
        </div>
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2 w-full">
            <div className="h-2 w-2 rounded-full bg-card-border shrink-0" />
            <div className="h-4 w-1/4 rounded bg-card-border" />
            <div className="h-3 w-12 rounded bg-card-border ml-2" />
          </div>
          <div className="h-4 w-10 rounded bg-card-border shrink-0" />
        </div>
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2 w-full">
            <div className="h-2 w-2 rounded-full bg-card-border shrink-0" />
            <div className="h-4 w-2/5 rounded bg-card-border" />
            <div className="h-3 w-12 rounded bg-card-border ml-2" />
          </div>
          <div className="h-4 w-10 rounded bg-card-border shrink-0" />
        </div>
      </div>

      {/* Row 3: Services placeholder */}
      <div className="pb-4 space-y-1.5">
        <div className="h-4 w-16 rounded bg-card-border mb-3" />
        <div className="flex items-center gap-2 py-1">
          <div className="h-2 w-2 rounded-full bg-card-border shrink-0" />
          <div className="h-4 w-1/2 rounded bg-card-border" />
        </div>
        <div className="flex items-center gap-2 py-1">
          <div className="h-2 w-2 rounded-full bg-card-border shrink-0" />
          <div className="h-4 w-2/3 rounded bg-card-border" />
        </div>
        <div className="flex items-center gap-2 py-1">
          <div className="h-2 w-2 rounded-full bg-card-border shrink-0" />
          <div className="h-4 w-1/3 rounded bg-card-border" />
        </div>
      </div>

      {/* Row 4: empty */}
      <div />
    </div>
  );
}
