import { Navbar } from "@/components/shared/Navbar";
import { HeroSection } from "@/components/shared/HeroSection";
import { ServicesSection } from "@/components/shared/ServicesSection";
import { MastersSection } from "@/components/shared/MastersSection";
import { ReviewsSection } from "@/components/shared/ReviewsSection";
import { CTASection } from "@/components/shared/CTASection";
import { Footer } from "@/components/shared/Footer";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import type { ReviewData } from "@/components/shared/ReviewsSection";

const getPublishedReviews = unstable_cache(
  async (): Promise<ReviewData[]> => {
    const rows = await prisma.review.findMany({
      where: { isPublished: true },
      include: {
        client: { select: { name: true } },
        appointment: { include: { service: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return rows.map((r) => {
      const parts = r.client.name.split(" ");
      const initials = parts.map((p) => p[0]?.toUpperCase() ?? "").join("").slice(0, 2);
      return {
        id: r.id,
        author: r.client.name,
        initials,
        rating: r.rating,
        text: r.text ?? "",
        service: r.appointment.service.name,
      };
    });
  },
  ["published-reviews"],
  { revalidate: 300 }
);

export default async function HomePage() {
  const reviews = await getPublishedReviews();

  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <Separator className="bg-border/50" />
        <ServicesSection compact />
        <MastersSection compact />
        <Separator className="bg-border/50" />
        <ReviewsSection reviews={reviews} />
        <Separator className="bg-border/50" />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
