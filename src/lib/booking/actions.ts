"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bookingSchema } from "@/schemas/booking";
import { getAvailableSlots, isSlotFree } from "@/lib/slots";
import type { ActionResult } from "@/types/actions";
import { addMinutes, startOfDay, endOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

// Stable bigint hash for advisory lock key: combines masterId hash with date epoch
function advisoryLockKey(masterId: string, date: Date): bigint {
  let hash = 0;
  for (let i = 0; i < masterId.length; i++) {
    hash = (Math.imul(31, hash) + masterId.charCodeAt(i)) | 0;
  }
  const dayEpoch = Math.floor(date.getTime() / 86_400_000);
  // combine into a 53-bit safe integer (BigInt)
  return BigInt((hash >>> 0) ^ (dayEpoch & 0x7fffffff));
}

export async function createBookingAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Не авторизован" };

  const parsed = bookingSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Проверьте данные", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const { serviceId, masterId: rawMasterId, startsAt: startsAtStr, clientNote } = parsed.data;

  const service = await prisma.service.findUnique({ where: { id: serviceId, isActive: true } });
  if (!service) return { ok: false, error: "Услуга не найдена" };

  const settings = await prisma.studioSettings.findUnique({ where: { id: "singleton" } });
  const tz = settings?.timezone ?? "Europe/Amsterdam";
  const bufferAfterMin = settings?.bufferAfterMin ?? 15;

  const startsAt = new Date(startsAtStr);
  const endsAt = addMinutes(startsAt, service.durationMin);

  // Resolve "any" master → first available
  let masterId = rawMasterId;
  if (rawMasterId === "any") {
    const masters = await prisma.masterProfile.findMany({
      where: { canTakeBookings: true, services: { some: { id: serviceId } } },
      select: { id: true, user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    });
    for (const m of masters) {
      const dayStart = startOfDay(toZonedTime(startsAt, tz));
      const appts = await prisma.appointment.findMany({
        where: { masterId: m.id, status: { in: ["PENDING", "CONFIRMED"] }, startsAt: { gte: startOfDay(startsAt), lt: endOfDay(startsAt) } },
        select: { startsAt: true, endsAt: true, status: true },
      });
      void dayStart;
      if (isSlotFree(startsAt, endsAt, appts, bufferAfterMin)) {
        masterId = m.id;
        break;
      }
    }
    if (masterId === "any") return { ok: false, error: "Нет свободных мастеров в это время. Выберите другое время." };
  }

  const masterProfile = await prisma.masterProfile.findUnique({
    where: { id: masterId, canTakeBookings: true },
  });
  if (!masterProfile) return { ok: false, error: "Мастер не найден или недоступен" };

  try {
    const appointment = await prisma.$transaction(async (tx) => {
      const lockKey = advisoryLockKey(masterId, startsAt);
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey})`;

      const existingAppts = await tx.appointment.findMany({
        where: { masterId, status: { in: ["PENDING", "CONFIRMED"] }, startsAt: { gte: startOfDay(startsAt), lt: endOfDay(startsAt) } },
        select: { startsAt: true, endsAt: true, status: true },
      });

      if (!isSlotFree(startsAt, endsAt, existingAppts, bufferAfterMin)) {
        throw Object.assign(new Error("SLOT_TAKEN"), { code: "SLOT_TAKEN" });
      }

      return tx.appointment.create({
        data: {
          clientId: session.user.id,
          masterId,
          serviceId,
          startsAt,
          endsAt,
          status: "PENDING",
          clientNote: clientNote ?? null,
        },
      });
    });

    return { ok: true, data: { id: appointment.id } };
  } catch (e: unknown) {
    if (e instanceof Error && "code" in e && e.code === "SLOT_TAKEN") {
      return { ok: false, error: "Этот слот уже занят — выберите другое время" };
    }
    console.error(e);
    return { ok: false, error: "Не удалось создать запись. Попробуйте ещё раз." };
  }
}

export async function getAvailableSlotsAction(
  masterId: string,
  serviceId: string,
  dateStr: string
): Promise<ActionResult<string[]>> {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) return { ok: false, error: "Услуга не найдена" };

  const settings = await prisma.studioSettings.findUnique({ where: { id: "singleton" } });
  const tz = settings?.timezone ?? "Europe/Amsterdam";
  const stSettings = {
    slotGranularity: settings?.slotGranularity ?? 15,
    bufferAfterMin: settings?.bufferAfterMin ?? 15,
    minLeadHours: settings?.minLeadHours ?? 2,
    maxAdvanceDays: settings?.maxAdvanceDays ?? 45,
  };

  const date = new Date(dateStr);

  let masterIds: string[];
  if (masterId === "any") {
    const masters = await prisma.masterProfile.findMany({
      where: { canTakeBookings: true, services: { some: { id: serviceId } } },
      select: { id: true },
    });
    masterIds = masters.map((m) => m.id);
  } else {
    masterIds = [masterId];
  }

  const allSlots = new Set<string>();
  const now = new Date();

  for (const mid of masterIds) {
    const [workingHours, timeOffs, existingAppointments] = await Promise.all([
      prisma.workingHours.findMany({ where: { masterId: mid } }),
      prisma.timeOff.findMany({ where: { masterId: mid, startsAt: { lte: endOfDay(date) }, endsAt: { gte: startOfDay(date) } } }),
      prisma.appointment.findMany({ where: { masterId: mid, status: { in: ["PENDING", "CONFIRMED"] }, startsAt: { gte: startOfDay(date), lt: endOfDay(date) } } }),
    ]);

    const slots = getAvailableSlots({
      workingHours,
      timeOffs,
      existingAppointments,
      settings: stSettings,
      date,
      durationMin: service.durationMin,
      now,
      timezone: tz,
    });

    slots.forEach((s) => allSlots.add(s.toISOString()));
  }

  const sorted = [...allSlots].sort();
  return { ok: true, data: sorted };
}
