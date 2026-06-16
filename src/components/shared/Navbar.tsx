"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-porcelain/90 backdrop-blur-md shadow-[0_1px_0_0_var(--border)]"
          : "bg-transparent"
      }`}
    >
      <nav
        className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between"
        aria-label="Главная навигация"
      >
        <Link
          href="/"
          className="font-display text-xl font-semibold text-mocha tracking-tight"
        >
          Glaze
        </Link>

        <ul className="hidden md:flex items-center gap-8 text-sm font-medium text-mocha/70">
          <li>
            <Link href="/services" className="hover:text-mocha transition-colors">
              Услуги
            </Link>
          </li>
          <li>
            <Link href="/masters" className="hover:text-mocha transition-colors">
              Мастера
            </Link>
          </li>
        </ul>

        <Link
          href="/booking"
          className="px-5 py-2 rounded-full bg-mocha text-porcelain text-sm font-medium
                     hover:bg-mocha/90 transition-colors focus-visible:ring-2 focus-visible:ring-champagne"
        >
          Записаться
        </Link>
      </nav>
    </header>
  );
}
