import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { MastersSection } from "@/components/shared/MastersSection";
import { CTASection } from "@/components/shared/CTASection";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export const metadata = { title: "Мастера" };

const getMasters = unstable_cache(
  async () =>
    prisma.masterProfile.findMany({
      where: { canTakeBookings: true },
      include: { user: { select: { name: true, image: true, avatarUrl: true } } },
      orderBy: { ratingAvg: "desc" },
    }),
  ["public-masters"],
  { revalidate: 300 }
);

export default async function MastersPage() {
  const raw = await getMasters();
  const masters = raw.map((m) => ({
    id: m.id,
    name: m.user.name,
    specialties: m.specialties as string[],
    ratingAvg: m.ratingAvg,
    ratingCount: m.ratingCount,
    image: m.user.image,
    avatarUrl: m.user.avatarUrl,
  }));

  return (
    <>
      <Navbar />
      <main className="pt-16">
        <div className="relative overflow-hidden bg-gradient-to-b from-lilac-haze/20 via-porcelain to-porcelain pt-20 pb-12 px-4 sm:px-6 text-center">
          <div className="absolute inset-0 mesh-gradient opacity-30 pointer-events-none" aria-hidden="true" />
          <div className="relative max-w-2xl mx-auto">
            <p className="text-xs font-medium tracking-widest uppercase text-mocha/40 mb-3">Наша команда</p>
            <h1 className="font-display text-5xl sm:text-6xl text-mocha mb-4">Мастера</h1>
            <p className="text-mocha/60 text-lg max-w-md mx-auto">
              Опытные специалисты с индивидуальным подходом к каждому клиенту
            </p>
          </div>
        </div>
        <MastersSection masters={masters} />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
