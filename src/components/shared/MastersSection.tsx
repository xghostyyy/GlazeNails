"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const MASTERS = [
  { name: "Анна К.", specialties: ["Маникюр", "Дизайн"], rating: 4.9, count: 142, initials: "АК" },
  { name: "Мария Р.", specialties: ["Педикюр", "Маникюр"], rating: 4.8, count: 98, initials: "МР" },
  { name: "Екатерина С.", specialties: ["Дизайн", "Наращивание"], rating: 5.0, count: 76, initials: "ЕС" },
  { name: "Ольга П.", specialties: ["Маникюр", "Педикюр"], rating: 4.7, count: 115, initials: "ОП" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-sm font-medium text-mocha" aria-label={`Рейтинг ${rating}`}>
      ★ {rating.toFixed(1)}
    </span>
  );
}

export function MastersSection() {
  const reduce = useReducedMotion();

  return (
    <section className="py-24 bg-petal/20" id="masters">
      <div className="px-4 sm:px-6 max-w-6xl mx-auto">
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="text-xs font-medium tracking-widest uppercase text-mocha/40 mb-3">
            Наши специалисты
          </p>
          <h2 className="font-display text-4xl sm:text-5xl text-mocha">Мастера</h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {MASTERS.map((m, i) => (
            <motion.div
              key={m.name}
              initial={reduce ? undefined : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <div className="card-hover bg-white rounded-2xl p-6 shadow-[var(--shadow-card)] text-center h-full flex flex-col items-center">
                <Avatar className="w-20 h-20 mb-4 ring-2 ring-lilac-haze ring-offset-2">
                  <AvatarFallback className="bg-pearl text-mocha font-semibold text-lg">
                    {m.initials}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-mocha text-base mb-1">{m.name}</h3>
                <StarRating rating={m.rating} />
                <p className="text-xs text-mocha/40 mb-3">{m.count} отзывов</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {m.specialties.map((s) => (
                    <Badge
                      key={s}
                      variant="outline"
                      className="text-xs border-lilac-haze text-mocha/70"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/masters"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-mocha/20
                       text-sm font-medium text-mocha hover:bg-mocha/5 transition-colors"
          >
            Все мастера →
          </Link>
        </div>
      </div>
    </section>
  );
}
