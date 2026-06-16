import { Navbar } from "@/components/shared/Navbar";
import { BookingWizard } from "@/components/shared/BookingWizard";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Запись" };

export default async function BookingPage() {
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
    serviceIds: [] as string[], // populated client-side
  }));

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 px-4 sm:px-6 max-w-3xl mx-auto pb-16">
        <div className="pt-10 mb-8">
          <h1 className="font-display text-4xl text-mocha">Запись</h1>
          <p className="text-mocha/50 mt-2">Выбери услугу, мастера и удобное время</p>
        </div>
        <BookingWizard services={services} masters={serializableMasters} />
      </main>
    </>
  );
}
