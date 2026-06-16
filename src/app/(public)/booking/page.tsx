import { Navbar } from "@/components/shared/Navbar";
import { BookingWizard } from "@/components/shared/BookingWizard";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Запись" };

export default async function BookingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [services, masters] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: { id: true, name: true, category: true, durationMin: true, priceCents: true },
    }),
    prisma.masterProfile.findMany({
      where: { canTakeBookings: true },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  const serializableMasters = masters.map((m) => ({
    id: m.id,
    name: m.user.name,
    avatarUrl: m.user.avatarUrl,
    specialties: m.specialties,
    serviceIds: [] as string[],
  }));

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16 pb-16">
        {/* Hero strip */}
        <div className="bg-gradient-to-b from-lilac-haze/15 to-transparent px-4 sm:px-6 pt-12 pb-8">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs font-medium tracking-widest uppercase text-mocha/40 mb-2">Онлайн-запись</p>
            <h1 className="font-display text-4xl sm:text-5xl text-mocha">Запись</h1>
            <p className="text-mocha/50 mt-2 text-base">Выбери услугу, мастера и удобное время</p>
          </div>
        </div>
        <div className="px-4 sm:px-6 max-w-3xl mx-auto mt-6">
          <BookingWizard services={services} masters={serializableMasters} />
        </div>
      </main>
    </>
  );
}
