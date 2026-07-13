// Instant skeleton while the catalog renders on the server — mirrors the
// real page layout (tabs header, desktop sidebar, product card grid) so the
// content swap doesn't shift anything.
export default function CatalogLoading() {
  return (
    <section className="px-3 pt-28 pb-4 md:px-6 md:pt-32 md:pb-8" aria-busy="true">
      <div className="mx-auto max-w-7xl animate-pulse">
        {/* Header: eyebrow + sub-menu tabs */}
        <header className="mb-7 flex flex-col items-center text-center md:mb-10">
          <div className="mb-3 h-3 w-24 rounded-full bg-foreground/10" />
          <div className="inline-flex items-center gap-1 rounded-full bg-white p-1.5 shadow-card">
            <div className="h-10 w-36 rounded-full bg-powder-100" />
            <div className="h-10 w-36 rounded-full bg-foreground/5" />
          </div>
        </header>

        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
          {/* Desktop filter sidebar */}
          <aside className="hidden w-64 shrink-0 md:block">
            <div className="rounded-3xl bg-white p-6 shadow-card">
              <div className="mb-6 h-4 w-24 rounded-full bg-foreground/10" />
              <div className="space-y-4">
                <div className="h-3 w-full rounded-full bg-foreground/5" />
                <div className="h-3 w-4/5 rounded-full bg-foreground/5" />
                <div className="h-3 w-full rounded-full bg-foreground/5" />
                <div className="h-3 w-3/5 rounded-full bg-foreground/5" />
              </div>
            </div>
          </aside>

          {/* Card grid */}
          <div className="min-w-0 flex-1">
            <div className="mb-5 h-4 w-28 rounded-full bg-foreground/10" />
            <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <div className="aspect-[3/4] rounded-3xl bg-foreground/5 shadow-card" />
                  <div className="mt-3 space-y-2 px-0.5">
                    <div className="h-3.5 w-3/4 rounded-full bg-foreground/10" />
                    <div className="h-3.5 w-1/3 rounded-full bg-foreground/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
