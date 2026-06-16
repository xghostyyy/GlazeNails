import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/shared/Navbar";
import Link from "next/link";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";
import { ru } from "date-fns/locale";

export const dynamic = "force-dynamic";
export const metadata = { title: "Общий календарь — Администрация" };

const STATUS_DOT: Record<string, string> = {
  PENDING: "bg-champagne",
  CONFIRMED: "bg-lilac-haze",
  COMPLETED: "bg-petal",
  CANCELLED: "bg-gray-200",
  REJECTED: "bg-gray-200",
  NO_SHOW: "bg-gray-200",
};

export default async function AdminCalendarPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const appts = await prisma.appointment.findMany({
    where: { startsAt: { gte: weekStart, lte: weekEnd } },
    include: { service: true, client: { select: { name: true } }, master: { include: { user: { select: { name: true } } } } },
    orderBy: { startsAt: "asc" },
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-porcelain pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
          <Link href="/admin" className="text-sm text-mocha/50 hover:text-mocha mb-4 block">← Дашборд</Link>
          <h1 className="font-display text-3xl text-mocha mb-2">Общий календарь</h1>
          <p className="text-sm text-mocha/40 mb-6">
            {format(weekStart, "d MMM", { locale: ru })} — {format(weekEnd, "d MMM yyyy", { locale: ru })}
          </p>

          <div className="space-y-6">
            {weekDays.map((day) => {
              const dayAppts = appts.filter(
                (a) => format(a.startsAt, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
              );
              return (
                <div key={day.toISOString()}>
                  <p className="text-xs font-medium tracking-wider uppercase text-mocha/40 mb-2">
                    {format(day, "EEEE, d MMMM", { locale: ru })}
                  </p>
                  {dayAppts.length === 0 ? (
                    <p className="text-sm text-mocha/30 ml-2">—</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-2">
                      {dayAppts.map((a) => (
                        <div key={a.id} className="bg-white rounded-xl p-3 border border-border flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${STATUS_DOT[a.status] ?? "bg-gray-200"}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-mocha truncate">{a.service.name}</p>
                            <p className="text-xs text-mocha/50">{a.client.name} → {a.master.user.name}</p>
                            <p className="text-xs text-mocha/40">{format(a.startsAt, "HH:mm")}–{format(a.endsAt, "HH:mm")}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
