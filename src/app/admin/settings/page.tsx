import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/shared/Navbar";
import Link from "next/link";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Настройки студии — Администрация" };

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const settings = await prisma.studioSettings.findUnique({ where: { id: "singleton" } });

  const defaults = {
    slotGranularity: settings?.slotGranularity ?? 15,
    bufferAfterMin: settings?.bufferAfterMin ?? 15,
    minLeadHours: settings?.minLeadHours ?? 2,
    maxAdvanceDays: settings?.maxAdvanceDays ?? 45,
    cancelCutoffH: settings?.cancelCutoffH ?? 24,
    reschedCutoffH: settings?.reschedCutoffH ?? 24,
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-porcelain pt-20 pb-16">
        <div className="max-w-xl mx-auto px-4 sm:px-6 pt-8">
          <Link href="/admin" className="text-sm text-mocha/50 hover:text-mocha mb-4 block">← Дашборд</Link>
          <h1 className="font-display text-3xl text-mocha mb-6">Настройки студии</h1>
          <SettingsForm defaults={defaults} />
        </div>
      </main>
    </>
  );
}
