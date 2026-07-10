interface LegalPageLayoutProps {
  title: string;
  children: React.ReactNode;
}

export default function LegalPageLayout({ title, children }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-milk">
      <div className="bg-beige-100 px-4 py-12 text-center md:py-16">
        <h1 className="font-serif text-2xl font-semibold text-foreground md:text-3xl">{title}</h1>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-16">
        <div className="space-y-8 text-sm leading-relaxed text-foreground/80 md:text-base">
          {children}
        </div>
      </div>
    </div>
  );
}
