interface LegalPageLayoutProps {
  title: string;
  children: React.ReactNode;
}

export default function LegalPageLayout({ title, children }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-milk">
      <div className="relative overflow-hidden bg-gradient-to-b from-powder-100 to-milk px-4 pb-12 pt-28 text-center md:pb-16 md:pt-36">
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #F4C6C6 0%, transparent 50%), radial-gradient(circle at 70% 20%, #EDE0D4 0%, transparent 40%)' }}
        />
        <div className="relative mx-auto max-w-2xl">
          <h1 className="font-sans text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h1>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-16">
        <div className="space-y-8 text-sm leading-relaxed text-foreground/80 md:text-base">
          {children}
        </div>
      </div>
    </div>
  );
}
