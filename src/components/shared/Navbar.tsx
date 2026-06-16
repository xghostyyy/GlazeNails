"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const reduce = useReducedMotion();
  const { data: session } = useSession();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close mobile menu on route change / resize
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const accountHref = session?.user?.role === "MASTER"
    ? "/master"
    : session?.user?.role === "ADMIN"
    ? "/admin"
    : "/account";

  const navLinks = [
    { href: "/services", label: "Услуги" },
    { href: "/masters", label: "Мастера" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || mobileOpen
          ? "bg-porcelain/95 backdrop-blur-md shadow-[0_1px_0_0_var(--border)]"
          : "bg-transparent"
      }`}
    >
      <nav
        className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between"
        aria-label="Главная навигация"
      >
        {/* Logo */}
        <Link
          href="/"
          className="font-display text-xl font-semibold text-mocha tracking-tight shrink-0"
          onClick={() => setMobileOpen(false)}
        >
          Glaze
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8 text-sm font-medium text-mocha/70">
          {navLinks.map(({ href, label }) => (
            <li key={href}>
              <Link href={href} className="hover:text-mocha transition-colors">
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop right CTA */}
        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <>
              <Link
                href={accountHref}
                className="text-sm font-medium text-mocha/70 hover:text-mocha transition-colors"
              >
                {session.user?.role === "ADMIN" ? "Админка" : session.user?.role === "MASTER" ? "Кабинет" : "Мои записи"}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm text-mocha/40 hover:text-mocha transition-colors"
              >
                Выйти
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-mocha/70 hover:text-mocha transition-colors"
            >
              Войти
            </Link>
          )}
          <Link
            href="/booking"
            className="px-5 py-2 rounded-full bg-mocha text-porcelain text-sm font-medium
                       hover:bg-mocha/90 transition-colors focus-visible:ring-2 focus-visible:ring-champagne"
          >
            Записаться
          </Link>
        </div>

        {/* Mobile: hamburger */}
        <button
          className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-xl
                     text-mocha focus-visible:ring-2 focus-visible:ring-champagne"
          aria-label={mobileOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span
            className={`block h-0.5 w-5 bg-current rounded-full transition-all duration-200 ${
              mobileOpen ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-5 bg-current rounded-full transition-all duration-200 ${
              mobileOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-5 bg-current rounded-full transition-all duration-200 ${
              mobileOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>
      </nav>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="md:hidden overflow-hidden bg-porcelain/98 backdrop-blur-md border-t border-border"
          >
            <div className="px-4 py-5 space-y-1">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="block py-3 text-base font-medium text-mocha/80 hover:text-mocha border-b border-border/60 last:border-0 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </Link>
              ))}
              {session ? (
                <>
                  <Link
                    href={accountHref}
                    className="block py-3 text-base font-medium text-mocha/80 hover:text-mocha border-b border-border/60 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    {session.user?.role === "ADMIN" ? "Админка" : session.user?.role === "MASTER" ? "Кабинет мастера" : "Мои записи"}
                  </Link>
                  <button
                    onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }}
                    className="block w-full text-left py-3 text-base font-medium text-mocha/50 hover:text-mocha transition-colors"
                  >
                    Выйти
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="block py-3 text-base font-medium text-mocha/80 hover:text-mocha border-b border-border/60 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Войти
                </Link>
              )}
              <div className="pt-3">
                <Link
                  href="/booking"
                  className="block w-full text-center py-3.5 rounded-full bg-mocha text-porcelain font-medium
                             hover:bg-mocha/90 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Записаться
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
