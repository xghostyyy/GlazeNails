import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { auth } from "@/lib/auth";
import { SessionProvider } from "@/components/shared/SessionProvider";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Glaze — Студия маникюра и педикюра",
    template: "%s | Glaze",
  },
  description: "Запись онлайн за 3 шага. Профессиональный маникюр, педикюр, дизайн ногтей.",
  keywords: ["маникюр", "педикюр", "дизайн ногтей", "студия", "запись онлайн"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FAF6F3",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="ru" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="antialiased">
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
