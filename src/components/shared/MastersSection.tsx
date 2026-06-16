"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const SPECIALTY_LABELS: Record<string, string> = {
  MANICURE: "Маникюр",
  PEDICURE: "Педикюр",
  DESIGN: "Дизайн",
  EXTENSION: "Наращивание",
  REMOVAL: "Снятие",
};

const GRADIENTS = [
  "from-petal to-lilac-haze",
  "from-lilac-haze to-champagne",
  "from-champagne to-petal",
  "from-petal to-champagne",
];

const STATIC_MASTERS = [
  { id: "1", name: "Анна К.", specialties: ["MANICURE", "DESIGN"], ratingAvg: 4.9, ratingCount: 142, image: null, avatarUrl: null },
  { id: "2", name: "Мария Р.", specialties: ["PEDICURE", "MANICURE"], ratingAvg: 4.8, ratingCount: 98, image: null, avatarUrl: null },
  { id: "3", name: "Екатерина С.", specialties: ["DESIGN", "EXTENSION"], ratingAvg: 5.0, ratingCount: 76, image: null, avatarUrl: null },
  { id: "4", name: "Ольга П.", specialties: ["MANICURE", "PEDICURE"], ratingAvg: 4.7, ratingCount: 115, image: null, avatarUrl: null },
];

export interface MasterCardData {
  id: string;
  name: string;
  specialties: string[];
  ratingAvg: number;
  ratingCount: number;
  image: string | null;
  avatarUrl: string | null;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <span className="text-champagne text-sm" aria-hidden="true">{"★".repeat(full)}{"☆".repeat(5 - full)}</span>
      <span className="text-sm font-semibold text-mocha" aria-label={`Рейтинг ${rating}`}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

export function MastersSection({ compact = false, masters }: { compact?: boolean; masters?: MasterCardData[] }) {
  const reduce = useReducedMotion();
  const displayedMasters = masters && masters.length > 0 ? masters : STATIC_MASTERS;

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
          {displayedMasters.map((m, i) => {
            const avatarSrc = m.image || m.avatarUrl || null;
            const initials = getInitials(m.name);
            const gradient = GRADIENTS[i % GRADIENTS.length];
            const translatedSpecialties = m.specialties
              .map((s) => SPECIALTY_LABELS[s] ?? s)
              .slice(0, 2);

            return (
              <motion.div
                key={m.id}
                initial={reduce ? undefined : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.4, delay: i * 0.09 }}
              >
                <div className="group card-hover bg-white rounded-2xl p-5 sm:p-6 shadow-[var(--shadow-card)] text-center h-full flex flex-col items-center">
                  <div className={`p-0.5 rounded-full bg-gradient-to-br ${gradient} mb-4 group-hover:scale-105 transition-transform duration-200`}>
                    <Avatar className="w-16 h-16 sm:w-20 sm:h-20 ring-2 ring-white">
                      {avatarSrc && <AvatarImage src={avatarSrc} alt={m.name} />}
                      <AvatarFallback className="bg-porcelain text-mocha font-semibold text-base sm:text-lg">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <h3 className="font-semibold text-mocha text-sm sm:text-base mb-0.5 leading-snug">{m.name}</h3>
                  <StarRating rating={m.ratingAvg} />
                  <p className="text-xs text-mocha/40 mt-1 mb-3">{m.ratingCount} отзывов</p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {translatedSpecialties.map((s) => (
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
            );
          })}
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
