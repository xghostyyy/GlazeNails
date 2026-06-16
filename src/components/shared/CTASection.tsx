"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

export function CTASection() {
  const reduce = useReducedMotion();

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden">
      {/* Pearl background */}
      <div className="absolute inset-0 bg-gradient-to-br from-lilac-haze/20 via-petal/15 to-champagne/20 rounded-none" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" aria-hidden="true" />

      {/* Decorative blobs */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-petal/20 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-lilac-haze/20 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      <motion.div
        initial={reduce ? undefined : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto text-center relative z-10"
      >
        <p className="text-xs font-medium tracking-widest uppercase text-mocha/40 mb-5">
          Начните сейчас
        </p>

        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-mocha mb-6 leading-tight">
          Готова к записи?
        </h2>
        <p className="text-lg text-mocha/60 mb-10 max-w-md mx-auto">
          Выбери мастера и удобное время — всё займёт меньше минуты.
        </p>

        <Link
          href="/booking"
          className="inline-flex items-center justify-center px-10 py-4 rounded-full
                     bg-mocha text-porcelain text-base font-medium
                     hover:bg-mocha/90 hover:shadow-[var(--shadow-card-hover)]
                     transition-all duration-200
                     focus-visible:ring-2 focus-visible:ring-champagne focus-visible:ring-offset-2
                     shadow-[var(--shadow-card)]"
        >
          Записаться онлайн
        </Link>

        {/* Slot chips decoration */}
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-2 mt-10"
          aria-hidden="true"
        >
          {["10:00", "11:30", "13:00", "14:30", "16:00", "17:30"].map((t, i) => (
            <motion.span
              key={t}
              initial={reduce ? undefined : { opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 0.65, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.4 + i * 0.06 }}
              className="slot-chip text-sm"
            >
              {t}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
