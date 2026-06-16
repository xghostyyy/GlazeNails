import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/shared/Navbar";
import { RequestCard } from "./RequestCard";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export const dynamic = "force-dynamic";
export const metadata = { title: "Входящие запросы" };

export default async function MasterRequestsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["MASTER", "ADMIN"].includes(session.user.role)) redirect("/");

  const masterProfile = await prisma.masterProfile.findUnique({ where: { userId: session.user.id } });
  if (!masterProfile) redirect("/master");

  const pending = await prisma.appointment.findMany({
    where: { masterId: masterProfile.id, status: "PENDING" },
    include: { service: true, client: true },
    orderBy: { startsAt: "asc" },
  });

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-porcelain pt-20 pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-8">
          <Link href="/master" className="text-sm text-mocha/50 hover:text-mocha mb-4 block">← Мой день</Link>
          <h1 className="font-display text-3xl text-mocha mb-6">Входящие запросы</h1>

          {pending.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-border">
              <p className="text-mocha/50">Нет новых запросов</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map((a) => (
                <RequestCard
                  key={a.id}
                  appointmentId={a.id}
                  serviceName={a.service.name}
                  clientName={a.client.name}
                  startsAt={format(a.startsAt, "d MMMM, HH:mm", { locale: ru })}
                  durationMin={a.service.durationMin}
                  clientNote={a.clientNote ?? undefined}
                  priceCents={a.service.priceCents}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
