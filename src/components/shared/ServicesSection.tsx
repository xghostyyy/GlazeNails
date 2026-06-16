"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

const SERVICES = [
  { category: "Маникюр", name: "Классический маникюр с покрытием", duration: "60 мин", price: "2 500 ₽", emoji: "💅", tag: "Хит" },
  { category: "Маникюр", name: "Маникюр с дизайном", duration: "90 мин", price: "3 500 ₽", emoji: "✨", tag: null },
  { category: "Педикюр", name: "Классический педикюр", duration: "75 мин", price: "3 000 ₽", emoji: "🌸", tag: null },
  { category: "Дизайн", name: "Нейл-арт (1 ноготь)", duration: "30 мин", price: "от 500 ₽", emoji: "🎨", tag: "Новинка" },
  { category: "Наращивание", name: "Наращивание гелем", duration: "120 мин", price: "5 000 ₽", emoji: "💎", tag: null },
  { category: "Снятие", name: "Снятие гель-лака", duration: "30 мин", price: "700 ₽", emoji: "🧴", tag: null },
];

const ACCENT_GRADIENTS = [
  "from-petal to-lilac-haze",
  "from-lilac-haze to-champagne",
  "from-champagne to-petal",
  "from-petal to-champagne",
  "from-lilac-haze to-petal",
  "from-champagne to-lilac-haze",
];

export function ServicesSection({ compact = false }: { compact?: boolean }) {
  const reduce = useReducedMotion();
  const router = useRouter();
  const displayedServices = compact ? SERVICES.slice(0, 6) : SERVICES;

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 max-w-6xl mx-auto" id="services">
      <motion.div
        initial={reduce ? undefined : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12 sm:mb-16"
      >
        <p className="text-xs font-medium tracking-widest uppercase text-mocha/40 mb-3">
          Что мы делаем
        </p>
        <h2 className="font-display text-4xl sm:text-5xl text-mocha">Услуги</h2>
        <div className="w-16 h-1 bg-pearl rounded-full mx-auto mt-5" aria-hidden="true" />
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {displayedServices.map((s, i) => (
          <motion.div
            key={s.name}
            initial={reduce ? undefined : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.08 }}
            transition={{ duration: 0.45, delay: i * 0.07 }}
          >
            <button
              onClick={() => router.push("/booking")}
              className="group card-hover bg-white rounded-2xl overflow-hidden shadow-[var(--shadow-card)] h-full flex flex-col w-full text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-champagne"
              aria-label={`Записаться на ${s.name}`}
            >
              {/* Pearl gradient top accent */}
              <div className={`h-1 bg-gradient-to-r ${ACCENT_GRADIENTS[i % ACCENT_GRADIENTS.length]} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
              <div className="p-6 flex flex-col flex-1">
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-200 inline-block">
                  {s.emoji}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium tracking-wider uppercase text-mocha/40">
                    {s.category}
                  </span>
                  {s.tag && (
                    <Badge className="text-xs bg-petal/80 text-mocha border-0 hover:bg-petal">
                      {s.tag}
                    </Badge>
                  )}
                </div>
                <h3 className="text-base font-semibold text-mocha mb-1 flex-1 leading-snug">{s.name}</h3>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <span className="text-sm text-mocha/50">{s.duration}</span>
                  <span className="text-sm font-bold text-mocha">{s.price}</span>
                </div>
                <div className="mt-3 text-xs font-medium text-mocha/40 group-hover:text-mocha/70 transition-colors flex items-center gap-1">
                  Записаться <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
                </div>
              </div>
            </button>
          </motion.div>
        ))}
      </div>

      {compact && (
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="text-center mt-10"
        >
          <Link
            href="/services"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-mocha/20
                       text-sm font-medium text-mocha hover:bg-mocha/5 hover:border-mocha/40 transition-all duration-200"
          >
            Смотреть все услуги
            <span className="text-mocha/40">→</span>
          </Link>
        </motion.div>
      )}
    </section>
  );
}
