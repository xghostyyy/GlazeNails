import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { MastersSection } from "@/components/shared/MastersSection";

export const metadata = { title: "Мастера" };

export default function MastersPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        <MastersSection />
      </main>
      <Footer />
    </>
  );
}
