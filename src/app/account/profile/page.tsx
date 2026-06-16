import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/shared/Navbar";
import Link from "next/link";

export const metadata = { title: "Профиль" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-porcelain pt-20 pb-16">
        <div className="max-w-lg mx-auto px-4 sm:px-6 pt-8">
          <Link href="/account" className="text-sm text-mocha/50 hover:text-mocha">← Мои записи</Link>
          <h1 className="font-display text-3xl text-mocha mt-4 mb-6">Профиль</h1>
          <div className="bg-white rounded-3xl p-6 shadow-[var(--shadow-card)] space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-mocha/50">Имя</span><span>{session.user.name}</span></div>
            <div className="flex justify-between"><span className="text-mocha/50">Email</span><span>{session.user.email}</span></div>
            <div className="flex justify-between"><span className="text-mocha/50">Роль</span><span>{session.user.role}</span></div>
          </div>
        </div>
      </main>
    </>
  );
}
