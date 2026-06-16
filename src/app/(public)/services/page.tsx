import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { ServicesSection } from "@/components/shared/ServicesSection";

export const metadata = { title: "Услуги" };

export default function ServicesPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        <ServicesSection />
      </main>
      <Footer />
    </>
  );
}
