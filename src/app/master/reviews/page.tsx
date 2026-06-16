import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/shared/Navbar";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export const dynamic = "force-dynamic";
export const metadata = { title: "Мои отзывы" };

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-champagne">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < Math.round(rating) ? "opacity-100" : "opacity-20"}>★</span>
      ))}
    </span>
  );
}

export default async function MasterReviewsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["MASTER", "ADMIN"].includes(session.user.role)) redirect("/");

  const masterProfile = await prisma.masterProfile.findUnique({ where: { userId: session.user.id } });
  if (!masterProfile) redirect("/master");

  const reviews = await prisma.review.findMany({
    where: { appointment: { masterId: masterProfile.id } },
    include: { client: { select: { name: true } }, appointment: { include: { service: true } } },
    orderBy: { createdAt: "desc" },
  });

  const avg = masterProfile.ratingAvg;
  const count = masterProfile.ratingCount;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-porcelain pt-20 pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-8">
          <Link href="/master" className="text-sm text-mocha/50 hover:text-mocha mb-4 block">← Мой день</Link>
          <h1 className="font-display text-3xl text-mocha mb-2">Мои отзывы</h1>

          {count > 0 && (
            <div className="flex items-center gap-3 mb-6">
              <Stars rating={avg} />
              <span className="font-semibold text-mocha">{avg.toFixed(1)}</span>
              <span className="text-sm text-mocha/40">{count} {count === 1 ? "отзыв" : count < 5 ? "отзыва" : "отзывов"}</span>
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-border">
              <p className="text-mocha/50">Отзывов пока нет</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl p-5 border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-mocha">{r.client.name}</p>
                      <p className="text-xs text-mocha/40">{r.appointment.service.name} · {format(r.createdAt, "d MMMM yyyy", { locale: ru })}</p>
                    </div>
                    <Stars rating={r.rating} />
                  </div>
                  {r.text && (
                    <p className="text-sm text-mocha/70 italic">&ldquo;{r.text}&rdquo;</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
