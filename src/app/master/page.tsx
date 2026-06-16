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

export default async function MasterPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["MASTER", "ADMIN"].includes(session.user.role)) redirect("/");

  const masterProfile = await prisma.masterProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!masterProfile) redirect("/");

  const today = new Date();
  const todayAppts = await prisma.appointment.findMany({
    where: {
      masterId: masterProfile.id,
      startsAt: { gte: startOfDay(today), lte: endOfDay(today) },
      status: { notIn: ["CANCELLED", "REJECTED"] },
    },
    include: { service: true, client: true },
    orderBy: { startsAt: "asc" },
  });

  const pendingCount = await prisma.appointment.count({
    where: { masterId: masterProfile.id, status: "PENDING" },
  });

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-porcelain pt-20 pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-8">
          <div className="mb-8">
            <h1 className="font-display text-3xl text-mocha">Мой день</h1>
            <p className="text-mocha/50 mt-1">{format(today, "d MMMM, EEEE", { locale: ru })}</p>
          </div>

          {/* Quick nav */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { href: "/master/requests", label: "Запросы", count: pendingCount },
              { href: "/master/calendar", label: "Календарь", count: null },
              { href: "/master/schedule", label: "Расписание", count: null },
              { href: "/master/reviews", label: "Отзывы", count: null },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white rounded-2xl p-4 border border-border hover:border-mocha/30 hover:shadow-[var(--shadow-card)] transition-all text-center"
              >
                <p className="text-sm font-medium text-mocha">{item.label}</p>
                {item.count !== null && item.count > 0 && (
                  <Badge className="mt-1 bg-petal text-mocha border-0 text-xs">{item.count}</Badge>
                )}
              </Link>
            ))}
          </div>

          <h2 className="text-xs font-medium tracking-widest uppercase text-mocha/40 mb-4">Сегодня</h2>

          {todayAppts.length === 0 ? (
            <p className="text-mocha/40 text-sm">Записей на сегодня нет</p>
          ) : (
            <div className="space-y-3">
              {todayAppts.map((a) => (
                <div
                  key={a.id}
                  className="bg-white rounded-2xl p-4 border border-border shadow-[var(--shadow-card)]"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-mocha text-sm">{a.service.name}</p>
                      <p className="text-xs text-mocha/50">{a.client.name}</p>
                      <p className="text-xs text-mocha/70 mt-1">
                        {format(a.startsAt, "HH:mm")} — {format(a.endsAt, "HH:mm")}
                      </p>
                    </div>
                    <Badge
                      className={
                        a.status === "CONFIRMED"
                          ? "bg-lilac-haze/30 text-mocha border-0"
                          : "bg-champagne/30 text-mocha border-0"
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
