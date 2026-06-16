import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReviewRequest } from "@/lib/notifications/emails";
import { subHours } from "date-fns";

// Called by Vercel Cron every hour.
// Finds appointments completed in the past 1–25 hours and sends review requests.
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const windowStart = subHours(now, 25);
  const windowEnd = subHours(now, 1);

  // Find recently completed appointments that have no review yet
  const appointments = await prisma.appointment.findMany({
    where: {
      status: "COMPLETED",
      endsAt: { gte: windowStart, lte: windowEnd },
      review: null,
    },
    include: {
      client: { select: { name: true, email: true } },
      master: { include: { user: { select: { name: true } } } },
      service: { select: { name: true } },
    },
  });

  const results = await Promise.allSettled(
    appointments.map((a) =>
      sendReviewRequest({
        clientEmail: a.client.email,
        clientName: a.client.name,
        masterName: a.master.user.name,
        serviceName: a.service.name,
        appointmentId: a.id,
      })
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ sent, failed, total: appointments.length });
}
