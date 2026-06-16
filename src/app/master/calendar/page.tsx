import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/shared/Navbar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { MarkDoneButton } from "./MarkDoneButton";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";
import { ru } from "date-fns/locale";

export const dynamic = "force-dynamic";
export const metadata = { title: "Календарь" };

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-champagne/40 text-mocha border-0",
  CONFIRMED: "bg-lilac-haze/40 text-mocha border-0",
  COMPLETED: "bg-petal/40 text-mocha border-0",
  CANCELLED: "bg-muted text-muted-foreground border-0",
  REJECTED: "bg-muted text-muted-foreground border-0",
  NO_SHOW: "bg-muted text-muted-foreground border-0",
};

export default async function MasterCalendarPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["MASTER", "ADMIN"].includes(session.user.role)) redirect("/");

  const masterProfile = await prisma.masterProfile.findUnique({ where: { userId: session.user.id } });
  if (!masterProfile) redirect("/master");

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const appts = await prisma.appointment.findMany({
    where: { masterId: masterProfile.id, startsAt: { gte: weekStart, lte: weekEnd }, status: { notIn: ["CANCELLED", "REJECTED"] } },
    include: { service: true, client: true },
    orderBy: { startsAt: "asc" },
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-porcelain pt-20 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
          <Link href="/master" className="text-sm text-mocha/50 hover:text-mocha mb-4 block">← Мой день</Link>
          <h1 className="font-display text-3xl text-mocha mb-6">
            Неделя: {format(weekStart, "d MMM", { locale: ru })} — {format(weekEnd, "d MMM", { locale: ru })}
          </h1>

          <div className="space-y-4">
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
                    <div className="space-y-2">
                      {dayAppts.map((a) => (
                        <div key={a.id} className="bg-white rounded-xl p-3 border border-border flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-mocha">{a.service.name}</p>
                            <p className="text-xs text-mocha/50">{a.client.name} · {format(a.startsAt, "HH:mm")}–{format(a.endsAt, "HH:mm")}</p>
                          </div>
                          <div className="flex gap-2 items-center">
                            <Badge className={STATUS_COLORS[a.status] ?? "border-0"}>
                              {a.status === "CONFIRMED" ? "✓" : a.status === "PENDING" ? "?" : a.status}
                            </Badge>
                            {a.status === "CONFIRMED" && (
                              <MarkDoneButton appointmentId={a.id} />
                            )}
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
