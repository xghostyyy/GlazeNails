"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { ActionResult } from "@/types/actions";
import { sendConfirmedToClient, sendRejectedToClient } from "@/lib/notifications/emails";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING:   ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "NO_SHOW", "CANCELLED"],
  COMPLETED: [],
  REJECTED:  [],
  CANCELLED: [],
  NO_SHOW:   [],
};

const updateStatusSchema = z.object({
  appointmentId: z.string().min(1),
  status: z.enum(["CONFIRMED", "REJECTED", "COMPLETED", "NO_SHOW"]),
  masterNote: z.string().max(500).optional(),
});

const workingHoursSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startMin: z.number().int().min(0).max(1440),
  endMin: z.number().int().min(1).max(1440),
});

const timeOffSchema = z.object({
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  reason: z.string().max(200).optional(),
});

async function getMasterProfile(userId: string) {
  return prisma.masterProfile.findUnique({ where: { userId } });
}

export async function updateAppointmentStatusAction(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Не авторизован" };
  if (!["MASTER", "ADMIN"].includes(session.user.role)) return { ok: false, error: "Недостаточно прав" };

  const parsed = updateStatusSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Некорректные данные" };

  const { appointmentId, status, masterNote } = parsed.data;

  const masterProfile = await getMasterProfile(session.user.id);
  if (!masterProfile) return { ok: false, error: "Профиль мастера не найден" };

  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      client: { select: { name: true, email: true } },
      service: { select: { name: true } },
      master: { include: { user: { select: { name: true } } } },
    },
  });
  if (!appt) return { ok: false, error: "Запись не найдена" };

  // Admin can modify any; master can only modify their own
  if (session.user.role !== "ADMIN" && appt.masterId !== masterProfile.id) {
    return { ok: false, error: "Нет доступа к этой записи" };
  }

  const allowed = ALLOWED_TRANSITIONS[appt.status] ?? [];
  if (!allowed.includes(status)) {
    return { ok: false, error: `Переход ${appt.status} → ${status} запрещён` };
  }

  if (status === "REJECTED" && !masterNote) {
    return { ok: false, error: "Укажите причину отклонения" };
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status, masterNote: masterNote ?? null, updatedAt: new Date() },
  });

  // Fire-and-forget notifications (no await — don't block response)
  if (status === "CONFIRMED") {
    sendConfirmedToClient({
      clientEmail: appt.client.email,
      clientName: appt.client.name,
      masterName: appt.master.user.name,
      serviceName: appt.service.name,
      startsAt: appt.startsAt,
    }).catch(console.error);
  } else if (status === "REJECTED") {
    sendRejectedToClient({
      clientEmail: appt.client.email,
      clientName: appt.client.name,
      masterName: appt.master.user.name,
      serviceName: appt.service.name,
      startsAt: appt.startsAt,
      masterNote: masterNote,
    }).catch(console.error);
  }

  return { ok: true, data: undefined };
}

export async function upsertWorkingHoursAction(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Не авторизован" };
  if (!["MASTER", "ADMIN"].includes(session.user.role)) return { ok: false, error: "Недостаточно прав" };

  const parsed = workingHoursSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Некорректные данные" };

  const masterProfile = await getMasterProfile(session.user.id);
  if (!masterProfile) return { ok: false, error: "Профиль мастера не найден" };

  const { weekday, startMin, endMin } = parsed.data;
  if (endMin <= startMin) return { ok: false, error: "Время окончания должно быть позже начала" };

  // Upsert by weekday (one working-hours entry per weekday per master)
  const existing = await prisma.workingHours.findFirst({
    where: { masterId: masterProfile.id, weekday },
  });

  if (existing) {
    await prisma.workingHours.update({ where: { id: existing.id }, data: { startMin, endMin } });
  } else {
    await prisma.workingHours.create({ data: { masterId: masterProfile.id, weekday, startMin, endMin } });
  }

  return { ok: true, data: undefined };
}

export async function deleteWorkingHoursAction(weekday: number): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Не авторизован" };
  if (!["MASTER", "ADMIN"].includes(session.user.role)) return { ok: false, error: "Недостаточно прав" };

  const masterProfile = await getMasterProfile(session.user.id);
  if (!masterProfile) return { ok: false, error: "Профиль мастера не найден" };

  await prisma.workingHours.deleteMany({
    where: { masterId: masterProfile.id, weekday },
  });

  return { ok: true, data: undefined };
}

export async function createTimeOffAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Не авторизован" };
  if (!["MASTER", "ADMIN"].includes(session.user.role)) return { ok: false, error: "Недостаточно прав" };

  const parsed = timeOffSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Некорректные данные" };

  const masterProfile = await getMasterProfile(session.user.id);
  if (!masterProfile) return { ok: false, error: "Профиль мастера не найден" };

  const { startsAt, endsAt, reason } = parsed.data;
  if (new Date(endsAt) <= new Date(startsAt)) {
    return { ok: false, error: "Время окончания должно быть позже начала" };
  }

  const timeOff = await prisma.timeOff.create({
    data: { masterId: masterProfile.id, startsAt: new Date(startsAt), endsAt: new Date(endsAt), reason: reason ?? null },
  });

  return { ok: true, data: { id: timeOff.id } };
}

export async function deleteTimeOffAction(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Не авторизован" };

  const masterProfile = await getMasterProfile(session.user.id);
  if (!masterProfile) return { ok: false, error: "Профиль мастера не найден" };

  const timeOff = await prisma.timeOff.findUnique({ where: { id } });
  if (!timeOff || (timeOff.masterId !== masterProfile.id && session.user.role !== "ADMIN")) {
    return { ok: false, error: "Нет доступа" };
  }

  await prisma.timeOff.delete({ where: { id } });
  return { ok: true, data: undefined };
}
