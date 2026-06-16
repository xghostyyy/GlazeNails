import { z } from "zod";

export const bookingSchema = z.object({
  serviceId: z.string().min(1, "Выберите услугу"),
  masterId: z.string().min(1, "Выберите мастера").or(z.literal("any")),
  startsAt: z.string().min(1, "Выберите время"),
  clientNote: z.string().max(500).optional(),
});

export const rescheduleSchema = z.object({
  appointmentId: z.string().min(1),
  masterId: z.string().min(1),
  startsAt: z.string().min(1),
});

export const cancelSchema = z.object({
  appointmentId: z.string().min(1),
});

export type BookingInput = z.infer<typeof bookingSchema>;
export type RescheduleInput = z.infer<typeof rescheduleSchema>;
export type CancelInput = z.infer<typeof cancelSchema>;
