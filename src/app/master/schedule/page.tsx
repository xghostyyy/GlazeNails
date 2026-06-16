import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/shared/Navbar";
import { ScheduleEditor } from "./ScheduleEditor";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export const dynamic = "force-dynamic";
export const metadata = { title: "Моё расписание" };

const WEEKDAY_NAMES = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

function minToTime(min: number) {
  const h = Math.floor(min / 60).toString().padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export default async function MasterSchedulePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["MASTER", "ADMIN"].includes(session.user.role)) redirect("/");

  const masterProfile = await prisma.masterProfile.findUnique({ where: { userId: session.user.id } });
  if (!masterProfile) redirect("/master");

  const [workingHours, timeOffs] = await Promise.all([
    prisma.workingHours.findMany({ where: { masterId: masterProfile.id }, orderBy: { weekday: "asc" } }),
    prisma.timeOff.findMany({ where: { masterId: masterProfile.id, endsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" } }),
  ]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-porcelain pt-20 pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-8">
          <Link href="/master" className="text-sm text-mocha/50 hover:text-mocha mb-4 block">← Мой день</Link>
          <h1 className="font-display text-3xl text-mocha mb-6">Расписание</h1>

          {/* Working hours */}
          <section className="mb-8">
            <h2 className="text-xs font-medium tracking-widest uppercase text-mocha/40 mb-4">Рабочие часы</h2>
            <div className="bg-white rounded-2xl border border-border divide-y divide-border">
              {[1, 2, 3, 4, 5, 6, 0].map((wd) => {
                const wh = workingHours.find((h) => h.weekday === wd);
                return (
                  <div key={wd} className="flex items-center justify-between px-5 py-3 gap-3">
                    <span className="text-sm font-medium text-mocha w-8">{WEEKDAY_NAMES[wd]}</span>
                    {wh ? (
                      <span className="text-sm text-mocha/70 flex-1">
                        {minToTime(wh.startMin)} — {minToTime(wh.endMin)}
                      </span>
                    ) : (
                      <span className="text-sm text-mocha/30 flex-1">Выходной</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Time offs */}
          <section className="mb-8">
            <h2 className="text-xs font-medium tracking-widest uppercase text-mocha/40 mb-4">Отгулы и отпуск</h2>
            {timeOffs.length === 0 ? (
              <p className="text-sm text-mocha/40">Нет запланированных отгулов</p>
            ) : (
              <div className="space-y-2">
                {timeOffs.map((to) => (
                  <div key={to.id} className="bg-white rounded-xl p-4 border border-border flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-mocha">
                        {format(to.startsAt, "d MMM HH:mm", { locale: ru })} — {format(to.endsAt, "d MMM HH:mm", { locale: ru })}
                      </p>
                      {to.reason && <p className="text-xs text-mocha/50 mt-0.5">{to.reason}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <ScheduleEditor />
        </div>
      </main>
    </>
  );
}
