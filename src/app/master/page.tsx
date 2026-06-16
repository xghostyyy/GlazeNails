import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/shared/Navbar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format, startOfDay, endOfDay } from "date-fns";
import { ru } from "date-fns/locale";

export const dynamic = "force-dynamic";
export const metadata = { title: "Мой день" };

const NAV_ITEMS = [
  { href: "/master/requests", label: "Запросы", icon: "📋" },
  { href: "/master/calendar", label: "Календарь", icon: "📅" },
  { href: "/master/schedule", label: "Расписание", icon: "⏰" },
  { href: "/master/reviews", label: "Отзывы", icon: "★" },
];

export default async function MasterPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["MASTER", "ADMIN"].includes(session.user.role)) redirect("/");

  const masterProfile = await prisma.masterProfile.findUnique({ where: { userId: session.user.id } });
  if (!masterProfile) redirect("/");

  const today = new Date();
  const [todayAppts, pendingCount] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        masterId: masterProfile.id,
        startsAt: { gte: startOfDay(today), lte: endOfDay(today) },
        status: { notIn: ["CANCELLED", "REJECTED"] },
      },
      include: { service: true, client: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.appointment.count({ where: { masterId: masterProfile.id, status: "PENDING" } }),
  ]);

  const hour = today.getHours();
  const greeting = hour < 12 ? "Доброе утро" : hour < 17 ? "Добрый день" : "Добрый вечер";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-porcelain pb-16">
        {/* Header strip */}
        <div className="bg-gradient-to-b from-lilac-haze/15 to-transparent pt-24 pb-6 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto">
            <p className="text-xs font-medium tracking-widest uppercase text-mocha/40 mb-1">Кабинет мастера</p>
            <h1 className="font-display text-3xl sm:text-4xl text-mocha">
              {greeting}, {session.user.name?.split(" ")[0]}
            </h1>
            <p className="text-mocha/50 mt-1 capitalize">
              {format(today, "EEEE, d MMMM", { locale: ru })}
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4">
          {/* Quick nav */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white rounded-2xl p-4 border border-border hover:border-lilac-haze/60 hover:shadow-[var(--shadow-card)] hover:-translate-y-0.5 transition-all duration-200 text-center"
              >
                <span className="text-xl block mb-1.5" aria-hidden="true">{item.icon}</span>
                <p className="text-sm font-medium text-mocha">{item.label}</p>
                {item.href === "/master/requests" && pendingCount > 0 && (
                  <Badge className="mt-1.5 bg-petal text-mocha border-0 text-xs">{pendingCount}</Badge>
                )}
              </Link>
            ))}
          </div>

          {/* Today's schedule */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-medium tracking-widest uppercase text-mocha/40">Сегодня</h2>
            <Link href="/master/calendar" className="text-xs text-mocha/40 hover:text-mocha transition-colors">
              Вся неделя →
            </Link>
          </div>

          {todayAppts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="text-2xl mb-2" aria-hidden="true">✨</p>
              <p className="text-sm text-mocha/40">Записей на сегодня нет</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayAppts.map((a) => (
                <div
                  key={a.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-border shadow-[var(--shadow-card)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-mocha text-sm truncate">{a.service.name}</p>
                      <p className="text-xs text-mocha/50 mt-0.5">{a.client.name}</p>
                      <p className="text-sm font-medium text-mocha/70 mt-2">
                        {format(a.startsAt, "HH:mm")}
                        <span className="text-mocha/30 mx-1">—</span>
                        {format(a.endsAt, "HH:mm")}
                      </p>
                    </div>
                    <Badge
                      className={
                        a.status === "CONFIRMED"
                          ? "bg-lilac-haze/30 text-mocha border-0 shrink-0"
                          : "bg-champagne/30 text-mocha border-0 shrink-0"
                      }
                    >
                      {a.status === "CONFIRMED" ? "Подтверждена" : "Ожидает"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
