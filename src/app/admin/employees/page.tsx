import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/shared/Navbar";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Мастера — Администрация" };

export default async function AdminEmployeesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const masters = await prisma.masterProfile.findMany({
    include: {
      user: { select: { name: true, email: true, phone: true, avatarUrl: true } },
      workingHours: { orderBy: { weekday: "asc" } },
    },
    orderBy: { user: { name: "asc" } },
  });

  const WEEKDAY = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-porcelain pt-20 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
          <Link href="/admin" className="text-sm text-mocha/50 hover:text-mocha mb-4 block">← Дашборд</Link>
          <h1 className="font-display text-3xl text-mocha mb-6">Мастера</h1>

          <div className="space-y-4">
            {masters.map((m) => (
              <div key={m.id} className="bg-white rounded-2xl border border-border p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-mocha">{m.user.name}</p>
                    <p className="text-xs text-mocha/40">{m.user.email}</p>
                    {m.user.phone && <p className="text-xs text-mocha/40">{m.user.phone}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-mocha/60">★ {m.ratingAvg.toFixed(1)} ({m.ratingCount})</p>
                    <p className={`text-xs mt-0.5 ${m.canTakeBookings ? "text-green-600" : "text-mocha/30"}`}>
                      {m.canTakeBookings ? "Принимает записи" : "Не принимает"}
                    </p>
                  </div>
                </div>
                {m.bio && <p className="text-sm text-mocha/60 mb-3 line-clamp-2">{m.bio}</p>}
                <div className="flex flex-wrap gap-1 mb-3">
                  {m.specialties.map((s) => (
                    <span key={s} className="text-xs bg-lilac-haze/30 text-mocha/70 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
                {m.workingHours.length > 0 && (
                  <p className="text-xs text-mocha/40">
                    Рабочие дни: {m.workingHours.map((wh) => WEEKDAY[wh.weekday]).join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
