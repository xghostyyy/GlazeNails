import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/shared/Navbar";
import Link from "next/link";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { ru } from "date-fns/locale";

export const dynamic = "force-dynamic";
export const metadata = { title: "Администрация — Glaze" };

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-border">
      <p className="text-xs font-medium tracking-widest uppercase text-mocha/40 mb-1">{label}</p>
      <p className="font-display text-3xl text-mocha">{value}</p>
      {sub && <p className="text-xs text-mocha/40 mt-1">{sub}</p>}
    </div>
  );
}

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));

  const [
    thisMonthAppts,
    prevMonthAppts,
    totalClients,
    pendingCount,
    allMasters,
    topServices,
    unpublishedReviews,
  ] = await Promise.all([
    prisma.appointment.findMany({
      where: { startsAt: { gte: monthStart, lte: monthEnd }, status: "COMPLETED" },
      include: { service: true },
    }),
    prisma.appointment.findMany({
      where: { startsAt: { gte: prevMonthStart, lte: prevMonthEnd }, status: "COMPLETED" },
      include: { service: true },
    }),
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.appointment.count({ where: { status: "PENDING" } }),
    prisma.masterProfile.findMany({ include: { user: { select: { name: true } } }, orderBy: { ratingAvg: "desc" } }),
    prisma.service.findMany({
      where: { isActive: true },
      include: { _count: { select: { appointments: true } } },
      orderBy: { appointments: { _count: "desc" } },
      take: 5,
    }),
    prisma.review.count({ where: { isPublished: false } }),
  ]);

  const thisRevenue = thisMonthAppts.reduce((s, a) => s + a.service.priceCents, 0);
  const prevRevenue = prevMonthAppts.reduce((s, a) => s + a.service.priceCents, 0);
  const revDiff = prevRevenue > 0 ? Math.round(((thisRevenue - prevRevenue) / prevRevenue) * 100) : null;

  const navLinks = [
    { href: "/admin/services", label: "Услуги" },
    { href: "/admin/employees", label: "Мастера" },
    { href: "/admin/calendar", label: "Календарь" },
    { href: "/admin/reviews", label: `Отзывы${unpublishedReviews > 0 ? ` (${unpublishedReviews})` : ""}` },
    { href: "/admin/settings", label: "Настройки" },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-porcelain pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
          <h1 className="font-display text-3xl text-mocha mb-2">Администрация</h1>
          <p className="text-sm text-mocha/40 mb-8">{format(now, "LLLL yyyy", { locale: ru })}</p>

          {/* Quick nav */}
          <nav className="flex flex-wrap gap-2 mb-8">
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href} className="px-4 py-2 bg-white rounded-full text-sm text-mocha border border-border hover:bg-mocha hover:text-white transition-colors">
                {label}
              </Link>
            ))}
          </nav>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <StatCard
              label="Выручка месяц"
              value={`${(thisRevenue / 100).toLocaleString("ru-RU")} ₽`}
              sub={revDiff !== null ? `${revDiff >= 0 ? "+" : ""}${revDiff}% к пред. месяцу` : undefined}
            />
            <StatCard label="Завершённые" value={thisMonthAppts.length} sub="за текущий месяц" />
            <StatCard label="Ожидают" value={pendingCount} sub="запросов" />
            <StatCard label="Клиентов" value={totalClients} />
          </div>

          {/* Masters */}
          <section className="mb-8">
            <h2 className="text-xs font-medium tracking-widest uppercase text-mocha/40 mb-4">Мастера</h2>
            <div className="bg-white rounded-2xl border border-border divide-y divide-border">
              {allMasters.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-mocha">{m.user.name}</p>
                    <p className="text-xs text-mocha/40">{m.specialties.join(", ")}</p>
                  </div>
                  <span className="text-sm text-mocha/60">★ {m.ratingAvg.toFixed(1)} ({m.ratingCount})</span>
                </div>
              ))}
            </div>
          </section>

          {/* Top services */}
          <section>
            <h2 className="text-xs font-medium tracking-widest uppercase text-mocha/40 mb-4">Популярные услуги</h2>
            <div className="bg-white rounded-2xl border border-border divide-y divide-border">
              {topServices.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-5 py-3">
                  <p className="text-sm text-mocha">{s.name}</p>
                  <p className="text-sm text-mocha/50">{s._count.appointments} записей</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
