import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/shared/Navbar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Мои записи" };

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Ожидает",
  CONFIRMED: "Подтверждена",
  COMPLETED: "Выполнена",
  REJECTED: "Отклонена",
  CANCELLED: "Отменена",
  NO_SHOW: "Не пришёл",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-champagne/30 text-mocha border-0",
  CONFIRMED: "bg-lilac-haze/40 text-mocha border-0",
  COMPLETED: "bg-petal/40 text-mocha border-0",
  REJECTED: "bg-destructive/10 text-destructive border-0",
  CANCELLED: "bg-muted text-muted-foreground border-0",
  NO_SHOW: "bg-muted text-muted-foreground border-0",
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const now = new Date();

  const [upcoming, past] = await Promise.all([
    prisma.appointment.findMany({
      where: { clientId: session.user.id, startsAt: { gte: now }, status: { notIn: ["CANCELLED", "REJECTED"] } },
      include: { service: true, master: { include: { user: true } } },
      orderBy: { startsAt: "asc" },
    }),
    prisma.appointment.findMany({
      where: { clientId: session.user.id, OR: [{ startsAt: { lt: now } }, { status: { in: ["CANCELLED", "REJECTED"] } }] },
      include: { service: true, master: { include: { user: true } }, review: true },
      orderBy: { startsAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-porcelain pb-16">
        {/* Hero strip */}
        <div className="bg-gradient-to-b from-petal/15 to-transparent pt-24 pb-8 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium tracking-widest uppercase text-mocha/40 mb-1">Личный кабинет</p>
              <h1 className="font-display text-3xl sm:text-4xl text-mocha">
                Привет, {session.user.name?.split(" ")[0]}!
              </h1>
              <p className="text-mocha/50 mt-1 text-sm">
                {upcoming.length > 0
                  ? `${upcoming.length} предстоящ${upcoming.length === 1 ? "ая" : "их"} запис${upcoming.length === 1 ? "ь" : "ей"}`
                  : "Нет предстоящих записей"}
              </p>
            </div>
            <Link href="/booking">
              <Button className="rounded-full shrink-0">+ Записаться</Button>
            </Link>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6">
          {/* Upcoming */}
          {upcoming.length > 0 ? (
            <section className="mb-10">
              <h2 className="text-xs font-medium tracking-widest uppercase text-mocha/40 mb-4">
                Предстоящие
              </h2>
              <div className="space-y-3">
                {upcoming.map((a) => (
                  <Link key={a.id} href={`/account/appointments/${a.id}`} className="block group">
                    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-[var(--shadow-card)] group-hover:shadow-[var(--shadow-card-hover)] transition-all duration-200 border border-transparent group-hover:border-lilac-haze/30">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-mocha text-sm truncate">{a.service.name}</p>
                          <p className="text-xs text-mocha/50 mt-0.5">{a.master.user.name}</p>
                          <p className="text-sm font-medium text-mocha/70 mt-2">
                            {format(a.startsAt, "d MMMM, HH:mm", { locale: ru })}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <Badge className={STATUS_COLORS[a.status]}>
                            {STATUS_LABELS[a.status]}
                          </Badge>
                          <span className="text-xs text-mocha/30 group-hover:text-mocha/60 transition-colors">
                            →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : (
            <div className="text-center py-14 bg-white rounded-2xl border border-dashed border-border mb-8">
              <p className="text-3xl mb-3" aria-hidden="true">💅</p>
              <p className="text-mocha font-medium mb-1">Нет предстоящих записей</p>
              <p className="text-sm text-mocha/40 mb-5">Запишитесь к мастеру прямо сейчас</p>
              <Link href="/booking">
                <Button className="rounded-full">Записаться</Button>
              </Link>
            </div>
          )}

          {/* History */}
          {past.length > 0 && (
            <section>
              <h2 className="text-xs font-medium tracking-widest uppercase text-mocha/40 mb-4">
                История
              </h2>
              <div className="space-y-2.5">
                {past.map((a) => (
                  <Link key={a.id} href={`/account/appointments/${a.id}`} className="block group">
                    <div className="bg-white rounded-2xl p-4 border border-border group-hover:border-lilac-haze/40 group-hover:shadow-[var(--shadow-card)] transition-all duration-200">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-mocha text-sm truncate">{a.service.name}</p>
                          <p className="text-xs text-mocha/50 mt-0.5">{a.master.user.name}</p>
                          <p className="text-xs text-mocha/40 mt-1">
                            {format(a.startsAt, "d MMMM yyyy, HH:mm", { locale: ru })}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <Badge className={STATUS_COLORS[a.status]}>
                            {STATUS_LABELS[a.status]}
                          </Badge>
                          {a.status === "COMPLETED" && !a.review && (
                            <span className="text-xs text-champagne font-medium">Оставить отзыв →</span>
                          )}
                          {a.review && (
                            <span className="text-xs text-mocha/30">★ Отзыв оставлен</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Quick links */}
          <div className="mt-10 pt-6 border-t border-border flex flex-wrap gap-3">
            <Link href="/account/profile">
              <Button variant="outline" size="sm" className="rounded-full text-xs">
                Мой профиль
              </Button>
            </Link>
            <Link href="/booking">
              <Button variant="outline" size="sm" className="rounded-full text-xs">
                Новая запись
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
