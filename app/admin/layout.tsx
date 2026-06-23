import "@/app/globals.css";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import { auth } from "@/auth";
import { logoutAction } from "./logout/actions";

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
});

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="uk" className={`h-full antialiased ${montserrat.variable}`}>
      <body className="min-h-full bg-[#FDF8F4] font-[family-name:var(--font-montserrat)] text-[#3d2f28]">
        {session?.user ? (
          <div className="flex min-h-screen flex-col">
            <header className="flex items-center justify-between gap-4 bg-white px-4 py-4 shadow-soft sm:px-8">
              <nav className="flex items-center gap-4">
                <Link href="/admin/products" className="text-lg font-semibold">
                  Kiddie Chic · Адмін
                </Link>
                <Link
                  href="/admin/products"
                  className="rounded-full px-3 py-2 text-base transition-all duration-300 ease-in-out hover:bg-[#FDF8F4]"
                >
                  Товари
                </Link>
              </nav>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-full px-4 py-2 text-base font-medium transition-all duration-300 ease-in-out hover:bg-[#FDF8F4]"
                >
                  Вийти
                </button>
              </form>
            </header>
            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-8 sm:py-10">
              {children}
            </main>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
