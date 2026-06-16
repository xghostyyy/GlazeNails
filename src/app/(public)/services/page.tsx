import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { CTASection } from "@/components/shared/CTASection";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import Link from "next/link";

export const metadata = { title: "Услуги" };

const CATEGORY_LABELS: Record<string, string> = {
  MANICURE: "Маникюр",
  PEDICURE: "Педикюр",
  DESIGN: "Дизайн",
  EXTENSION: "Наращивание",
  REMOVAL: "Снятие",
};

const CATEGORY_EMOJI: Record<string, string> = {
  MANICURE: "💅",
  PEDICURE: "🌸",
  DESIGN: "🎨",
  EXTENSION: "💎",
  REMOVAL: "🧴",
};

const ACCENT_GRADIENTS = [
  "from-petal to-lilac-haze",
  "from-lilac-haze to-champagne",
  "from-champagne to-petal",
  "from-petal to-champagne",
  "from-lilac-haze to-petal",
  "from-champagne to-lilac-haze",
];

const getServices = unstable_cache(
  async () =>
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
  ["all-services"],
  { revalidate: 300 }
);

export default async function ServicesPage() {
  const services = await getServices();

  const grouped = services.reduce(
    (acc, s) => {
      const cat = CATEGORY_LABELS[s.category] ?? s.category;
      (acc[cat] ??= []).push(s);
      return acc;
    },
    {} as Record<string, typeof services>
  );

  return (
    <>
      <Navbar />
      <main className="pt-16">
        {/* Page hero */}
        <div className="relative overflow-hidden bg-gradient-to-b from-petal/20 via-porcelain to-porcelain pt-20 pb-12 px-4 sm:px-6 text-center">
          <div className="absolute inset-0 mesh-gradient opacity-30 pointer-events-none" aria-hidden="true" />
          <div className="relative max-w-2xl mx-auto">
            <p className="text-xs font-medium tracking-widest uppercase text-mocha/40 mb-3">Glaze Studio</p>
            <h1 className="font-display text-5xl sm:text-6xl text-mocha mb-4">Услуги</h1>
            <p className="text-mocha/60 text-lg max-w-md mx-auto">
              Профессиональный уход за ногтями — от классики до сложного дизайна
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          {Object.entries(grouped).map(([cat, svcs]) => (
            <section key={cat} className="mb-14">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-2xl">{CATEGORY_EMOJI[Object.keys(CATEGORY_LABELS).find(k => CATEGORY_LABELS[k] === cat) ?? ""] ?? "✨"}</span>
                <h2 className="font-display text-2xl sm:text-3xl text-mocha">{cat}</h2>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {svcs.map((s, i) => (
                  <Link
                    key={s.id}
                    href="/booking"
                    className="group card-hover bg-white rounded-2xl overflow-hidden shadow-[var(--shadow-card)] flex flex-col"
                  >
                    <div className={`h-1 bg-gradient-to-r ${ACCENT_GRADIENTS[i % ACCENT_GRADIENTS.length]} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
                    <div className="p-5 flex flex-col flex-1">
                      <p className="font-semibold text-mocha text-base leading-snug mb-1">{s.name}</p>
                      {s.description && (
                        <p className="text-sm text-mocha/50 leading-relaxed mb-3 line-clamp-2">{s.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                        <span className="text-sm text-mocha/50">{s.durationMin} мин</span>
                        <span className="text-sm font-bold text-mocha">
                          {(s.priceCents / 100).toLocaleString("ru-RU")} ₽
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-mocha/35 group-hover:text-mocha/60 transition-colors flex items-center gap-1">
                        Записаться <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}

          {services.length === 0 && (
            <div className="text-center py-16 text-mocha/40">
              <p className="text-lg">Услуги пока не добавлены</p>
              <p className="text-sm mt-1">Загляните позже</p>
            </div>
          )}
        </div>

        <CTASection />
      </main>
      <Footer />
    </>
  );
}
