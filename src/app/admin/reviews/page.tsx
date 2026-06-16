import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/shared/Navbar";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ReviewModerationCard } from "./ReviewModerationCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Модерация отзывов — Администрация" };

export default async function AdminReviewsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const reviews = await prisma.review.findMany({
    include: {
      client: { select: { name: true } },
      appointment: { include: { service: true, master: { include: { user: { select: { name: true } } } } } },
    },
    orderBy: [{ isPublished: "asc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-porcelain pt-20 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
          <Link href="/admin" className="text-sm text-mocha/50 hover:text-mocha mb-4 block">← Дашборд</Link>
          <h1 className="font-display text-3xl text-mocha mb-6">Отзывы</h1>

          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-border">
              <p className="text-mocha/50">Отзывов нет</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <ReviewModerationCard
                  key={r.id}
                  id={r.id}
                  clientName={r.client.name}
                  masterName={r.appointment.master.user.name}
                  serviceName={r.appointment.service.name}
                  rating={r.rating}
                  text={r.text ?? undefined}
                  isPublished={r.isPublished}
                  createdAt={format(r.createdAt, "d MMMM yyyy", { locale: ru })}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
