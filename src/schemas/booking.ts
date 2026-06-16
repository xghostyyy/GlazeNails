import { z } from "zod";

export const bookingSchema = z.object({
  serviceId: z.string().cuid("Выберите услугу"),
  masterId: z.string().cuid("Выберите мастера").or(z.literal("any")),
  startsAt: z.string().datetime("Некорректное время"),
  clientNote: z.string().max(500).optional(),
});

export const rescheduleSchema = z.object({
  appointmentId: z.string().cuid(),
  masterId: z.string().cuid(),
  startsAt: z.string().datetime("Некорректное время"),
});

export const cancelSchema = z.object({
  appointmentId: z.string().cuid(),
});

export type BookingInput = z.infer<typeof bookingSchema>;
export type RescheduleInput = z.infer<typeof rescheduleSchema>;
export type CancelInput = z.infer<typeof cancelSchema>;
