import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/shared/Navbar";
import { ProfileForm } from "./ProfileForm";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Профиль" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true, role: true },
  });
  if (!user) redirect("/login");

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-porcelain pt-20 pb-16">
        <div className="max-w-lg mx-auto px-4 sm:px-6 pt-8">
          <Link href="/account" className="text-sm text-mocha/50 hover:text-mocha transition-colors">
            ← Мои записи
          </Link>
          <h1 className="font-display text-3xl text-mocha mt-4 mb-6">Профиль</h1>

          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-card)] space-y-4 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-mocha/50">Email</span>
              <span className="text-mocha font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-mocha/50">Роль</span>
              <span className="text-mocha/70">
                {user.role === "ADMIN" ? "Администратор" : user.role === "MASTER" ? "Мастер" : "Клиент"}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-card)]">
            <h2 className="font-semibold text-mocha mb-5">Личные данные</h2>
            <ProfileForm defaultName={user.name} defaultPhone={user.phone ?? ""} />
          </div>
        </div>
      </main>
    </>
  );
}
