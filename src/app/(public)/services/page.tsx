import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { ServicesSection } from "@/components/shared/ServicesSection";
import { CTASection } from "@/components/shared/CTASection";

export const metadata = { title: "Услуги" };

export default function ServicesPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        {/* Page hero */}
        <div className="relative overflow-hidden bg-gradient-to-b from-petal/20 via-porcelain to-porcelain pt-20 pb-12 px-4 sm:px-6 text-center">
          <div className="absolute inset-0 mesh-gradient opacity-30 pointer-events-none" aria-hidden="true" />
          <div className="relative max-w-2xl mx-auto">
            <p className="text-xs font-medium tracking-widest uppercase text-mocha/40 mb-3">Glaze Studio</p>
            <h1 className="font-display text-5xl sm:text-6xl text-mocha mb-4">Услуги</h1>
            <p className="text-mocha/60 text-lg max-w-md mx-auto">
              Профессиональный уход за ногтями — от классики до сложного дизайна
            </p>
          </div>
        </div>
        <ServicesSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
