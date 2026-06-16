import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/shared/Navbar";

export const metadata = { title: "Мои записи" };

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Ожидает подтверждения",
  CONFIRMED: "Подтверждена",
  COMPLETED: "Выполнена",
  REJECTED: "Отклонена",
  CANCELLED: "Отменена",
  NO_SHOW: "Не пришёл",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-champagne/30 text-mocha border-0",
  CONFIRMED: "bg-lilac-haze/30 text-mocha border-0",
  COMPLETED: "bg-petal/30 text-mocha border-0",
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
      <main className="min-h-screen bg-porcelain pt-20 pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="pt-8 mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl text-mocha">Мои записи</h1>
              <p className="text-mocha/50 mt-1">Привет, {session.user.name}!</p>
            </div>
            <Link href="/booking">
              <Button className="rounded-full">Записаться</Button>
            </Link>
          </div>

          {upcoming.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xs font-medium tracking-widest uppercase text-mocha/40 mb-4">Предстоящие</h2>
              <div className="space-y-3">
                {upcoming.map((a) => (
                  <Link key={a.id} href={`/account/appointments/${a.id}`} className="block">
                    <div className="bg-white rounded-2xl p-4 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow border border-border">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-mocha text-sm">{a.service.name}</p>
                          <p className="text-xs text-mocha/50 mt-0.5">{a.master.user.name}</p>
                          <p className="text-xs text-mocha/70 mt-1">
                            {format(a.startsAt, "d MMMM, HH:mm", { locale: ru })}
                          </p>
                        </div>
                        <Badge className={STATUS_COLORS[a.status]}>
                          {STATUS_LABELS[a.status]}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {upcoming.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-border mb-8">
              <p className="text-mocha/50 mb-4">Нет предстоящих записей</p>
              <Link href="/booking">
                <Button className="rounded-full">Записаться сейчас</Button>
              </Link>
            </div>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="text-xs font-medium tracking-widest uppercase text-mocha/40 mb-4">История</h2>
              <div className="space-y-3">
                {past.map((a) => (
                  <Link key={a.id} href={`/account/appointments/${a.id}`} className="block">
                    <div className="bg-white rounded-2xl p-4 border border-border hover:shadow-[var(--shadow-card)] transition-shadow">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-mocha text-sm">{a.service.name}</p>
                          <p className="text-xs text-mocha/50 mt-0.5">{a.master.user.name}</p>
                          <p className="text-xs text-mocha/40 mt-1">
                            {format(a.startsAt, "d MMMM yyyy, HH:mm", { locale: ru })}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge className={STATUS_COLORS[a.status]}>
                            {STATUS_LABELS[a.status]}
                          </Badge>
                          {a.status === "COMPLETED" && !a.review && (
                            <span className="text-xs text-champagne font-medium">Оставить отзыв →</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
