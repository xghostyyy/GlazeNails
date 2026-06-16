"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, useReducedMotion } from "motion/react";

function FloatingOrb({
  className,
  delay = 0,
}: {
  className: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl opacity-40 pointer-events-none ${className}`}
      animate={
        reduce
          ? undefined
          : {
              y: [0, -24, 0],
              scale: [1, 1.08, 1],
            }
      }
      transition={{ duration: 7 + delay, repeat: Infinity, ease: "easeInOut", delay }}
      aria-hidden="true"
    />
  );
}

export function HeroSection() {
  const reduce = useReducedMotion();
  const { data: session } = useSession();

  const fadeRise = reduce
    ? {}
    : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } };

  const accountHref =
    session?.user?.role === "MASTER"
      ? "/master"
      : session?.user?.role === "ADMIN"
      ? "/admin"
      : "/account";

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Layered background */}
      <div className="absolute inset-0 mesh-gradient opacity-55" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(220,201,232,0.35),transparent)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,var(--porcelain)_100%)]"
        aria-hidden="true"
      />

      {/* Floating orbs */}
      <FloatingOrb className="w-80 h-80 bg-petal top-20 -left-20" delay={0} />
      <FloatingOrb className="w-64 h-64 bg-lilac-haze top-1/3 -right-16" delay={2.5} />
      <FloatingOrb className="w-48 h-48 bg-champagne bottom-32 left-1/4" delay={1.5} />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-32 pt-36 sm:pt-40 w-full">
        <div className="max-w-2xl">
          <motion.p
            {...fadeRise}
            transition={{ duration: 0.5 }}
            className="text-xs font-medium tracking-widest uppercase text-mocha/50 mb-5"
          >
            Студия маникюра и педикюра
          </motion.p>

          <motion.h1
            {...fadeRise}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl text-mocha mb-6 leading-[1.05]"
          >
            Красота{" "}
            <span className="text-pearl inline-block">в каждой</span>
            <br className="hidden sm:block" /> детали
          </motion.h1>

          <motion.p
            {...fadeRise}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-mocha/65 mb-10 leading-relaxed max-w-lg"
          >
            Запишись за три шага — выбери услугу, мастера и удобное время.
            Реальные свободные окна, никаких звонков.
          </motion.p>

          <motion.div
            {...fadeRise}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Link
              href="/booking"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full
                         bg-mocha text-porcelain text-base font-medium shadow-[var(--shadow-card)]
                         hover:bg-mocha/90 hover:shadow-[var(--shadow-card-hover)]
                         transition-all duration-200
                         focus-visible:ring-2 focus-visible:ring-champagne focus-visible:ring-offset-2"
            >
              Записаться онлайн
            </Link>
            {session ? (
              <Link
                href={accountHref}
                className="inline-flex items-center justify-center px-8 py-4 rounded-full
                           border border-mocha/20 text-mocha text-base font-medium
                           hover:bg-mocha/5 hover:border-mocha/40 transition-all duration-200
                           focus-visible:ring-2 focus-visible:ring-champagne focus-visible:ring-offset-2"
              >
                Мои записи →
              </Link>
            ) : (
              <Link
                href="/services"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full
                           border border-mocha/20 text-mocha text-base font-medium
                           hover:bg-mocha/5 hover:border-mocha/40 transition-all duration-200
                           focus-visible:ring-2 focus-visible:ring-champagne focus-visible:ring-offset-2"
              >
                Все услуги
              </Link>
            )}
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            {...(reduce ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 } })}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="flex flex-wrap items-center gap-6 mt-10"
          >
            {[
              { icon: "★", text: "Рейтинг 4.9" },
              { icon: "✓", text: "200+ клиентов" },
              { icon: "⏱", text: "Запись за 3 шага" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm text-mocha/50">
                <span className="text-champagne">{icon}</span>
                {text}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Decorative slot-chips — desktop */}
        <motion.div
          {...(reduce ? {} : { initial: { opacity: 0, x: 30 }, animate: { opacity: 1, x: 0 } })}
          transition={{ duration: 0.7, delay: 0.65 }}
          className="absolute right-4 sm:right-8 lg:right-16 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-2.5"
          aria-hidden="true"
        >
          {["10:00", "11:30", "13:00", "14:30", "16:00"].map((t, i) => (
            <motion.span
              key={t}
              initial={reduce ? undefined : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.75 + i * 0.09 }}
              className="slot-chip-deco text-center w-24 text-sm"
            >
              {t}
            </motion.span>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          {...(reduce ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 } })}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
          aria-hidden="true"
        >
          <motion.div
            animate={reduce ? undefined : { y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-5 h-8 rounded-full border-2 border-mocha/20 flex items-start justify-center pt-1.5"
          >
            <div className="w-1 h-1.5 bg-mocha/40 rounded-full" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
