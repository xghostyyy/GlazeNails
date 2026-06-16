"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Badge } from "@/components/ui/badge";

const SERVICES = [
  {
    category: "Маникюр",
    name: "Классический маникюр с покрытием",
    duration: "60 мин",
    price: "2 500 ₽",
    emoji: "💅",
    tag: "Хит",
  },
  {
    category: "Маникюр",
    name: "Маникюр с дизайном",
    duration: "90 мин",
    price: "3 500 ₽",
    emoji: "✨",
    tag: null,
  },
  {
    category: "Педикюр",
    name: "Классический педикюр",
    duration: "75 мин",
    price: "3 000 ₽",
    emoji: "🌸",
    tag: null,
  },
  {
    category: "Дизайн",
    name: "Нейл-арт (1 ноготь)",
    duration: "30 мин",
    price: "от 500 ₽",
    emoji: "🎨",
    tag: "Новинка",
  },
  {
    category: "Наращивание",
    name: "Наращивание гелем",
    duration: "120 мин",
    price: "5 000 ₽",
    emoji: "💎",
    tag: null,
  },
  {
    category: "Снятие",
    name: "Снятие гель-лака",
    duration: "30 мин",
    price: "700 ₽",
    emoji: "🧴",
    tag: null,
  },
];

export function ServicesSection() {
  const reduce = useReducedMotion();

  return (
    <section className="py-24 px-4 sm:px-6 max-w-6xl mx-auto" id="services">
      <motion.div
        initial={reduce ? undefined : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-14"
      >
        <p className="text-xs font-medium tracking-widest uppercase text-mocha/40 mb-3">
          Что мы делаем
        </p>
        <h2 className="font-display text-4xl sm:text-5xl text-mocha">Услуги</h2>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {SERVICES.map((s, i) => (
          <motion.div
            key={s.name}
            initial={reduce ? undefined : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.4, delay: i * 0.07 }}
          >
            <div className="card-hover bg-white rounded-2xl p-6 shadow-[var(--shadow-card)] h-full flex flex-col">
              <div className="text-3xl mb-4">{s.emoji}</div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium tracking-wider uppercase text-mocha/40">
                  {s.category}
                </span>
                {s.tag && (
                  <Badge className="text-xs bg-petal text-mocha border-0 hover:bg-petal">
                    {s.tag}
                  </Badge>
                )}
              </div>
              <h3 className="text-base font-semibold text-mocha mb-1 flex-1">{s.name}</h3>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <span className="text-sm text-mocha/50">{s.duration}</span>
                <span className="text-sm font-semibold text-mocha">{s.price}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-10">
        <Link
          href="/services"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-mocha/20
                     text-sm font-medium text-mocha hover:bg-mocha/5 transition-colors"
        >
          Все услуги →
        </Link>
      </div>
    </section>
  );
}
