import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminder24h } from "@/lib/notifications/emails";
import { addHours } from "date-fns";

// Called by Vercel Cron every hour (see vercel.json).
// Finds CONFIRMED appointments starting in 24–25 hours and sends one reminder.
// The window width equals the cron cadence (1h) so each appointment matches
// exactly once — no dedup field required.
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const windowStart = addHours(now, 24);
  const windowEnd = addHours(now, 25);

  const appointments = await prisma.appointment.findMany({
    where: {
      status: "CONFIRMED",
      startsAt: { gte: windowStart, lte: windowEnd },
    },
    include: {
      client: { select: { name: true, email: true } },
      master: { include: { user: { select: { name: true } } } },
      service: { select: { name: true, durationMin: true } },
    },
  });

  const results = await Promise.allSettled(
    appointments.map((a) =>
      sendReminder24h({
        clientEmail: a.client.email,
        clientName: a.client.name,
        masterName: a.master.user.name,
        serviceName: a.service.name,
        startsAt: a.startsAt,
      })
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ sent, failed, total: appointments.length });
}
