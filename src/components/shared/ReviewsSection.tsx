"use client";

import { motion, useReducedMotion } from "motion/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const REVIEWS = [
  {
    author: "Алина В.",
    initials: "АВ",
    rating: 5,
    text: "Записалась впервые и не пожалела! Анна сделала невероятный дизайн, всё быстро и чисто. Буду приходить снова.",
    service: "Маникюр с дизайном",
  },
  {
    author: "Катя М.",
    initials: "КМ",
    rating: 5,
    text: "Очень удобная запись онлайн — выбрала время, мастера, получила подтверждение. Результат отличный, салон уютный.",
    service: "Классический маникюр",
  },
  {
    author: "Даша Л.",
    initials: "ДЛ",
    rating: 5,
    text: "Педикюр на высшем уровне. Мария очень внимательна к деталям, всё сделала аккуратно и быстро. Рекомендую!",
    service: "Классический педикюр",
  },
];

function Stars({ count }: { count: number }) {
  return (
    <span aria-label={`${count} из 5 звёзд`} className="text-champagne text-base">
      {"★".repeat(count)}
    </span>
  );
}

export function ReviewsSection() {
  const reduce = useReducedMotion();

  return (
    <section className="py-24 px-4 sm:px-6" id="reviews">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="text-xs font-medium tracking-widest uppercase text-mocha/40 mb-3">
            Клиенты о нас
          </p>
          <h2 className="font-display text-4xl sm:text-5xl text-mocha">Отзывы</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {REVIEWS.map((r, i) => (
            <motion.div
              key={r.author}
              initial={reduce ? undefined : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-[var(--shadow-card)] flex flex-col"
            >
              <Stars count={r.rating} />
              <p className="text-sm text-mocha/80 mt-3 leading-relaxed flex-1">
                &ldquo;{r.text}&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-5 pt-4 border-t border-border">
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-lilac-haze text-mocha text-xs font-semibold">
                    {r.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-mocha">{r.author}</p>
                  <p className="text-xs text-mocha/40">{r.service}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
