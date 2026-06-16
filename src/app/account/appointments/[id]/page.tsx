import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppointmentActions } from "./AppointmentActions";
import { Navbar } from "@/components/shared/Navbar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";
import { addHours, isBefore } from "date-fns";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Ожидает подтверждения",
  CONFIRMED: "Подтверждена",
  COMPLETED: "Выполнена",
  REJECTED: "Отклонена",
  CANCELLED: "Отменена",
  NO_SHOW: "Не пришёл",
};

export default async function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: {
      service: true,
      master: { include: { user: true } },
      review: true,
    },
  });

  if (!appt || appt.clientId !== session.user.id) notFound();

  const settings = await prisma.studioSettings.findUnique({ where: { id: "singleton" } });
  const cutoffH = settings?.cancelCutoffH ?? 24;
  const cutoffTime = addHours(appt.startsAt, -cutoffH);
  const canModify = !isBefore(cutoffTime, new Date()) && ["PENDING", "CONFIRMED"].includes(appt.status);
  const canReview = appt.status === "COMPLETED" && !appt.review;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-porcelain pt-20 pb-16">
        <div className="max-w-lg mx-auto px-4 sm:px-6">
          <div className="pt-8 mb-6">
            <Link href="/account" className="text-sm text-mocha/50 hover:text-mocha transition-colors">
              ← Мои записи
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-[var(--shadow-card)] p-6 space-y-5">
            <div className="flex items-start justify-between">
              <h1 className="font-semibold text-mocha text-lg">{appt.service.name}</h1>
              <Badge className="text-xs">{STATUS_LABELS[appt.status]}</Badge>
            </div>

            <div className="space-y-3 text-sm">
              <Row label="Мастер" value={appt.master.user.name} />
              <Row label="Дата" value={format(appt.startsAt, "d MMMM yyyy, EEEE", { locale: ru })} />
              <Row label="Время" value={format(appt.startsAt, "HH:mm")} />
              <Row label="Длительность" value={`${appt.service.durationMin} мин`} />
              <Row label="Стоимость" value={`${(appt.service.priceCents / 100).toLocaleString("ru-RU")} ₽`} />
              {appt.clientNote && <Row label="Пожелания" value={appt.clientNote} />}
              {appt.masterNote && (
                <Row label="Комментарий мастера" value={appt.masterNote} />
              )}
            </div>

            {appt.review && (
              <div className="border-t border-border pt-4">
                <p className="text-xs font-medium tracking-widest uppercase text-mocha/40 mb-2">Ваш отзыв</p>
                <p className="text-champagne">{"★".repeat(appt.review.rating)}</p>
                {appt.review.text && <p className="text-sm text-mocha/70 mt-1">{appt.review.text}</p>}
              </div>
            )}

            <AppointmentActions
              appointmentId={appt.id}
              masterId={appt.masterId}
              serviceId={appt.serviceId}
              canModify={canModify}
              canReview={canReview}
            />
          </div>
        </div>
      </main>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-mocha/50">{label}</span>
      <span className="text-mocha text-right">{value}</span>
    </div>
  );
}
