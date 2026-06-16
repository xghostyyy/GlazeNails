"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { ActionResult } from "@/types/actions";

async function assertAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "ADMIN") return null;
  return session;
}

// ── Services ──────────────────────────────────────────────────────────────────

const SPECIALTY_VALUES = ["MANICURE", "PEDICURE", "DESIGN", "EXTENSION", "REMOVAL"] as const;

const serviceSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  durationMin: z.number().int().min(15).max(480),
  priceCents: z.number().int().min(0),
  category: z.enum(SPECIALTY_VALUES),
  isActive: z.boolean().default(true),
});

const serviceIdSchema = z.object({ id: z.string().cuid() });

export async function createServiceAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  if (!await assertAdmin()) return { ok: false, error: "Недостаточно прав" };
  const parsed = serviceSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Некорректные данные", fieldErrors: parsed.error.flatten().fieldErrors };
  const service = await prisma.service.create({ data: parsed.data });
  return { ok: true, data: { id: service.id } };
}

export async function updateServiceAction(raw: unknown): Promise<ActionResult> {
  if (!await assertAdmin()) return { ok: false, error: "Недостаточно прав" };
  const parsed = serviceIdSchema.merge(serviceSchema.partial()).safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Некорректные данные", fieldErrors: parsed.error.flatten().fieldErrors };
  const { id, ...data } = parsed.data;
  await prisma.service.update({ where: { id }, data });
  return { ok: true, data: undefined };
}

export async function deleteServiceAction(id: string): Promise<ActionResult> {
  if (!await assertAdmin()) return { ok: false, error: "Недостаточно прав" };
  const { id: validId } = z.object({ id: z.string().cuid() }).parse({ id });
  await prisma.service.update({ where: { id: validId }, data: { isActive: false } });
  return { ok: true, data: undefined };
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export async function moderateReviewAction(raw: unknown): Promise<ActionResult> {
  if (!await assertAdmin()) return { ok: false, error: "Недостаточно прав" };
  const parsed = z.object({ id: z.string().cuid(), isPublished: z.boolean() }).safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Некорректные данные" };
  const { id, isPublished } = parsed.data;
  await prisma.review.update({ where: { id }, data: { isPublished } });
  return { ok: true, data: undefined };
}

// ── Studio Settings ────────────────────────────────────────────────────────────

const settingsSchema = z.object({
  slotGranularity: z.number().int().min(5).max(120),
  bufferAfterMin: z.number().int().min(0).max(120),
  minLeadHours: z.number().int().min(0).max(72),
  maxAdvanceDays: z.number().int().min(1).max(365),
  cancelCutoffH: z.number().int().min(0).max(168),
  reschedCutoffH: z.number().int().min(0).max(168),
});

export async function updateStudioSettingsAction(raw: unknown): Promise<ActionResult> {
  if (!await assertAdmin()) return { ok: false, error: "Недостаточно прав" };
  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Некорректные данные", fieldErrors: parsed.error.flatten().fieldErrors };
  await prisma.studioSettings.upsert({
    where: { id: "singleton" },
    update: parsed.data,
    create: { id: "singleton", ...parsed.data },
  });
  return { ok: true, data: undefined };
}

// ── Appointments (admin force-cancel) ──────────────────────────────────────────

export async function adminCancelAppointmentAction(appointmentId: string): Promise<ActionResult> {
  if (!await assertAdmin()) return { ok: false, error: "Недостаточно прав" };
  const { id } = z.object({ id: z.string().cuid() }).parse({ id: appointmentId });
  const appt = await prisma.appointment.findUnique({ where: { id }, select: { status: true } });
  if (!appt) return { ok: false, error: "Запись не найдена" };
  if (["COMPLETED", "CANCELLED", "REJECTED", "NO_SHOW"].includes(appt.status)) {
    return { ok: false, error: "Нельзя отменить запись в текущем статусе" };
  }
  await prisma.appointment.update({ where: { id }, data: { status: "CANCELLED" } });
  return { ok: true, data: undefined };
}
