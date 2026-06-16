"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

export function HeroSection() {
  const reduce = useReducedMotion();

  const fadeRise = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
      };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Mesh gradient background */}
      <div
        className="absolute inset-0 mesh-gradient opacity-60"
        aria-hidden="true"
      />
      {/* Soft vignette overlay */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,var(--porcelain)_100%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-32 pt-40">
        <div className="max-w-2xl">
          <motion.p
            {...fadeRise}
            transition={{ duration: 0.5 }}
            className="text-xs font-medium tracking-widest uppercase text-mocha/50 mb-6"
          >
            Студия маникюра и педикюра
          </motion.p>

          <motion.h1
            {...fadeRise}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl text-mocha mb-6 leading-[1.05]"
          >
            Красота <span className="text-pearl">в каждой</span>{" "}
            детали
          </motion.h1>

          <motion.p
            {...fadeRise}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-mocha/70 mb-10 leading-relaxed max-w-lg"
          >
            Запишись за три шага — выбери услугу, мастера и удобное время.
            Реальные свободные окна, никаких звонков.
          </motion.p>

          <motion.div
            {...fadeRise}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              href="/booking"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full
                         bg-mocha text-porcelain text-base font-medium
                         hover:bg-mocha/90 transition-colors
                         focus-visible:ring-2 focus-visible:ring-champagne focus-visible:ring-offset-2"
            >
              Записаться
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full
                         border border-mocha/20 text-mocha text-base font-medium
                         hover:bg-mocha/5 transition-colors
                         focus-visible:ring-2 focus-visible:ring-champagne focus-visible:ring-offset-2"
            >
              Все услуги
            </Link>
          </motion.div>
        </div>

        {/* Decorative slot-chips (signature element preview) */}
        <motion.div
          {...(reduce ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 } })}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="absolute right-4 sm:right-12 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-2"
          aria-hidden="true"
        >
          {["10:00", "11:00", "12:00", "14:00", "15:30"].map((t, i) => (
            <motion.span
              key={t}
              initial={reduce ? undefined : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.7 + i * 0.08 }}
              className="slot-chip text-center w-20 select-none"
            >
              {t}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
