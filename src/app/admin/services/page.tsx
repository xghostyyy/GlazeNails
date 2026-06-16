import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/shared/Navbar";
import Link from "next/link";
import { ServiceForm } from "./ServiceForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Услуги — Администрация" };

const CATEGORY_LABELS: Record<string, string> = {
  MANICURE: "Маникюр",
  PEDICURE: "Педикюр",
  DESIGN: "Дизайн",
  EXTENSION: "Наращивание",
  REMOVAL: "Снятие",
};

export default async function AdminServicesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const services = await prisma.service.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] });

  const grouped: Record<string, typeof services> = {};
  for (const s of services) {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-porcelain pt-20 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
          <Link href="/admin" className="text-sm text-mocha/50 hover:text-mocha mb-4 block">← Дашборд</Link>
          <h1 className="font-display text-3xl text-mocha mb-6">Услуги</h1>

          {Object.entries(grouped).map(([cat, list]) => (
            <section key={cat} className="mb-6">
              <h2 className="text-xs font-medium tracking-widest uppercase text-mocha/40 mb-3">{CATEGORY_LABELS[cat] ?? cat}</h2>
              <div className="bg-white rounded-2xl border border-border divide-y divide-border">
                {list.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-5 py-3 gap-3">
                    <div>
                      <p className={`text-sm font-medium ${s.isActive ? "text-mocha" : "text-mocha/30 line-through"}`}>{s.name}</p>
                      <p className="text-xs text-mocha/40">{s.durationMin} мин · {(s.priceCents / 100).toLocaleString("ru-RU")} ₽</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <div className="mt-8">
            <h2 className="text-xs font-medium tracking-widest uppercase text-mocha/40 mb-4">Новая услуга</h2>
            <ServiceForm />
          </div>
        </div>
      </main>
    </>
  );
}
