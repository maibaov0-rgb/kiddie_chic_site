// Instant skeleton for the product page — gallery on the left, purchase
// panel on the right, matching ProductDetail's grid so nothing jumps.
export default function ProductLoading() {
  return (
    <section className="px-3 pt-28 pb-6 md:px-6 md:pt-32 md:pb-12" aria-busy="true">
      <div className="mx-auto max-w-6xl animate-pulse">
        {/* Breadcrumb */}
        <div className="mb-6 h-3 w-48 rounded-full bg-foreground/10 md:mb-8" />

        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          {/* Gallery */}
          <div>
            <div className="aspect-[3/4] w-full rounded-3xl bg-foreground/5 shadow-card md:rounded-[2rem]" />
            <div className="mt-3 hidden gap-2 md:flex">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] w-20 rounded-2xl bg-foreground/5" />
              ))}
            </div>
          </div>

          {/* Purchase panel */}
          <div className="md:pt-2">
            <div className="h-7 w-3/4 rounded-full bg-foreground/10 md:h-8" />
            <div className="mt-4 h-6 w-28 rounded-full bg-foreground/10" />
            <div className="mt-8 h-3 w-20 rounded-full bg-foreground/10" />
            <div className="mt-3 flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-11 w-20 rounded-full bg-foreground/5" />
              ))}
            </div>
            <div className="mt-8 h-14 w-full rounded-full bg-powder-100" />
            <div className="mt-8 space-y-3">
              <div className="h-3 w-full rounded-full bg-foreground/5" />
              <div className="h-3 w-5/6 rounded-full bg-foreground/5" />
              <div className="h-3 w-2/3 rounded-full bg-foreground/5" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
