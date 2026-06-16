"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cancelSchema, rescheduleSchema } from "@/schemas/booking";
import { reviewSchema } from "@/schemas/review";
import { isSlotFree } from "@/lib/slots";
import type { ActionResult } from "@/types/actions";
import { addHours, addMinutes, startOfDay, endOfDay, isBefore } from "date-fns";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING:   ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "NO_SHOW", "CANCELLED"],
  COMPLETED: [],
  REJECTED:  [],
  CANCELLED: [],
  NO_SHOW:   [],
};

function assertTransition(from: string, to: string): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

async function getSettings() {
  return prisma.studioSettings.findUnique({ where: { id: "singleton" } });
}

export async function cancelAppointmentAction(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Не авторизован" };

  const parsed = cancelSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Некорректные данные" };

  const appt = await prisma.appointment.findUnique({
    where: { id: parsed.data.appointmentId },
    select: { id: true, clientId: true, status: true, startsAt: true },
  });
  if (!appt) return { ok: false, error: "Запись не найдена" };
  if (appt.clientId !== session.user.id) return { ok: false, error: "Недостаточно прав" };
  if (!assertTransition(appt.status, "CANCELLED")) {
    return { ok: false, error: `Нельзя отменить запись со статусом ${appt.status}` };
  }

  const settings = await getSettings();
  const cutoffH = settings?.cancelCutoffH ?? 24;
  const cutoffTime = addHours(appt.startsAt, -cutoffH);
  if (isBefore(cutoffTime, new Date())) {
    return { ok: false, error: `Отменить можно не позже чем за ${cutoffH} ч до записи` };
  }

  await prisma.appointment.update({
    where: { id: appt.id },
    data: { status: "CANCELLED", updatedAt: new Date() },
  });

  return { ok: true, data: undefined };
}

export async function rescheduleAppointmentAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Не авторизован" };

  const parsed = rescheduleSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Некорректные данные", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const { appointmentId, masterId, startsAt: startsAtStr } = parsed.data;
  const startsAt = new Date(startsAtStr);

  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { service: true },
  });
  if (!appt) return { ok: false, error: "Запись не найдена" };
  if (appt.clientId !== session.user.id) return { ok: false, error: "Недостаточно прав" };
  if (!["PENDING", "CONFIRMED"].includes(appt.status)) {
    return { ok: false, error: "Перенести можно только ожидающие или подтверждённые записи" };
  }

  const settings = await getSettings();
  const cutoffH = settings?.cancelCutoffH ?? 24;
  const cutoffTime = addHours(appt.startsAt, -cutoffH);
  if (isBefore(cutoffTime, new Date())) {
    return { ok: false, error: `Перенести можно не позже чем за ${cutoffH} ч до записи` };
  }

  const endsAt = addMinutes(startsAt, appt.service.durationMin);
  const bufferAfterMin = settings?.bufferAfterMin ?? 15;

  // Advisory lock + slot verification
  function advisoryLockKey(mid: string, date: Date): bigint {
    let hash = 0;
    for (let i = 0; i < mid.length; i++) hash = (Math.imul(31, hash) + mid.charCodeAt(i)) | 0;
    const dayEpoch = Math.floor(date.getTime() / 86_400_000);
    return BigInt((hash >>> 0) ^ (dayEpoch & 0x7fffffff));
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const lockKey = advisoryLockKey(masterId, startsAt);
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey})`;

      const existingAppts = await tx.appointment.findMany({
        where: {
          masterId,
          id: { not: appointmentId }, // exclude self
          status: { in: ["PENDING", "CONFIRMED"] },
          startsAt: { gte: startOfDay(startsAt), lt: endOfDay(startsAt) },
        },
        select: { startsAt: true, endsAt: true, status: true },
      });

      if (!isSlotFree(startsAt, endsAt, existingAppts, bufferAfterMin)) {
        throw Object.assign(new Error("SLOT_TAKEN"), { code: "SLOT_TAKEN" });
      }

      // If rescheduling CONFIRMED → reset to PENDING (master re-confirms)
      const newStatus = appt.status === "CONFIRMED" ? "PENDING" : appt.status;

      return tx.appointment.update({
        where: { id: appointmentId },
        data: { masterId, startsAt, endsAt, status: newStatus, updatedAt: new Date() },
      });
    });

    return { ok: true, data: { id: updated.id } };
  } catch (e: unknown) {
    if (e instanceof Error && "code" in e && e.code === "SLOT_TAKEN") {
      return { ok: false, error: "Этот слот уже занят — выберите другое время" };
    }
    console.error(e);
    return { ok: false, error: "Не удалось перенести запись. Попробуйте ещё раз." };
  }
}

export async function createReviewAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Не авторизован" };

  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Проверьте данные", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const { appointmentId, rating, text } = parsed.data;

  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { review: true },
  });
  if (!appt) return { ok: false, error: "Запись не найдена" };
  if (appt.clientId !== session.user.id) return { ok: false, error: "Недостаточно прав" };
  if (appt.status !== "COMPLETED") return { ok: false, error: "Отзыв можно оставить только после завершённого визита" };
  if (appt.review) return { ok: false, error: "Отзыв уже оставлен" };

  const review = await prisma.$transaction(async (tx) => {
    const r = await tx.review.create({
      data: { appointmentId, clientId: session.user.id, rating, text: text ?? null, photoUrls: [], isPublished: true },
    });
    // Update master's denormalized rating cache
    const stats = await tx.review.aggregate({
      where: { appointment: { masterId: appt.masterId }, isPublished: true },
      _avg: { rating: true },
      _count: { id: true },
    });
    await tx.masterProfile.update({
      where: { id: appt.masterId },
      data: { ratingAvg: stats._avg.rating ?? 0, ratingCount: stats._count.id },
    });
    return r;
  });

  return { ok: true, data: { id: review.id } };
}
