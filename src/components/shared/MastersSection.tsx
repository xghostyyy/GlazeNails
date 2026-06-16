"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const MASTERS = [
  { name: "Анна К.", specialties: ["Маникюр", "Дизайн"], rating: 4.9, count: 142, initials: "АК", gradient: "from-petal to-lilac-haze" },
  { name: "Мария Р.", specialties: ["Педикюр", "Маникюр"], rating: 4.8, count: 98, initials: "МР", gradient: "from-lilac-haze to-champagne" },
  { name: "Екатерина С.", specialties: ["Дизайн", "Наращивание"], rating: 5.0, count: 76, initials: "ЕС", gradient: "from-champagne to-petal" },
  { name: "Ольга П.", specialties: ["Маникюр", "Педикюр"], rating: 4.7, count: 115, initials: "ОП", gradient: "from-petal to-champagne" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <span className="text-champagne text-sm">{"★".repeat(Math.round(rating))}</span>
      <span className="text-sm font-semibold text-mocha" aria-label={`Рейтинг ${rating}`}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

export function MastersSection({ compact = false }: { compact?: boolean }) {
  const reduce = useReducedMotion();
  const displayedMasters = compact ? MASTERS : MASTERS;

  return (
    <section className="py-20 sm:py-28 bg-gradient-to-b from-transparent via-petal/10 to-transparent" id="masters">
      <div className="px-4 sm:px-6 max-w-6xl mx-auto">
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 sm:mb-16"
        >
          <p className="text-xs font-medium tracking-widest uppercase text-mocha/40 mb-3">
            Наши специалисты
          </p>
          <h2 className="font-display text-4xl sm:text-5xl text-mocha">Мастера</h2>
          <div className="w-16 h-1 bg-pearl rounded-full mx-auto mt-5" aria-hidden="true" />
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {displayedMasters.map((m, i) => (
            <motion.div
              key={m.name}
              initial={reduce ? undefined : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.4, delay: i * 0.09 }}
            >
              <div className="group card-hover bg-white rounded-2xl p-5 sm:p-6 shadow-[var(--shadow-card)] text-center h-full flex flex-col items-center">
                {/* Avatar with pearl gradient ring */}
                <div className={`p-0.5 rounded-full bg-gradient-to-br ${m.gradient} mb-4 group-hover:scale-105 transition-transform duration-200`}>
                  <Avatar className="w-16 h-16 sm:w-20 sm:h-20 ring-2 ring-white">
                    <AvatarFallback className="bg-porcelain text-mocha font-semibold text-base sm:text-lg">
                      {m.initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <h3 className="font-semibold text-mocha text-sm sm:text-base mb-0.5 leading-snug">{m.name}</h3>
                <StarRating rating={m.rating} />
                <p className="text-xs text-mocha/40 mt-1 mb-3">{m.count} отзывов</p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {m.specialties.map((s) => (
                    <Badge
                      key={s}
                      variant="outline"
                      className="text-xs border-lilac-haze/60 text-mocha/60 py-0 px-2"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
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
              href="/masters"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-mocha/20
                         text-sm font-medium text-mocha hover:bg-mocha/5 hover:border-mocha/40 transition-all duration-200"
            >
              Все мастера
              <span className="text-mocha/40">→</span>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
