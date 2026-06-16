import { Navbar } from "@/components/shared/Navbar";
import { HeroSection } from "@/components/shared/HeroSection";
import { ServicesSection } from "@/components/shared/ServicesSection";
import { MastersSection } from "@/components/shared/MastersSection";
import { ReviewsSection } from "@/components/shared/ReviewsSection";
import { CTASection } from "@/components/shared/CTASection";
import { Footer } from "@/components/shared/Footer";
import { Separator } from "@/components/ui/separator";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <Separator className="bg-border/50" />
        <ServicesSection />
        <MastersSection />
        <Separator className="bg-border/50" />
        <ReviewsSection />
        <Separator className="bg-border/50" />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
