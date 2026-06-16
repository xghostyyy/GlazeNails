import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Glaze — Студия маникюра и педикюра",
  description: "Запись онлайн за 3 шага. Маникюр, педикюр, дизайн ногтей.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
