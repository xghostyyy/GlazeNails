"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

export function CTASection() {
  const reduce = useReducedMotion();

  return (
    <section className="py-24 px-4 sm:px-6">
      <motion.div
        initial={reduce ? undefined : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto text-center"
      >
        {/* Pearl gradient decorative element */}
        <div
          className="w-16 h-1 bg-pearl rounded-full mx-auto mb-8"
          aria-hidden="true"
        />

        <h2 className="font-display text-4xl sm:text-5xl text-mocha mb-6 leading-tight">
          Готова к записи?
        </h2>
        <p className="text-lg text-mocha/60 mb-10 max-w-lg mx-auto">
          Выбери мастера и удобное время — всё займёт меньше минуты.
        </p>

        <Link
          href="/booking"
          className="inline-flex items-center justify-center px-10 py-4 rounded-full
                     bg-mocha text-porcelain text-base font-medium
                     hover:bg-mocha/90 transition-colors
                     focus-visible:ring-2 focus-visible:ring-champagne focus-visible:ring-offset-2
                     shadow-[var(--shadow-card)]"
        >
          Записаться онлайн
        </Link>

        {/* Slot chips decoration */}
        <div
          className="flex flex-wrap justify-center gap-2 mt-10 opacity-60"
          aria-hidden="true"
        >
          {["10:00", "11:30", "13:00", "14:30", "16:00", "17:30"].map((t) => (
            <span key={t} className="slot-chip text-sm">
              {t}
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
