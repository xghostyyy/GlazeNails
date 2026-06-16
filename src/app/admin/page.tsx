import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  return (
    <main className="min-h-screen bg-porcelain p-8">
      <h1 className="font-display text-3xl text-mocha">Админ-панель</h1>
      <p className="text-mocha/60 mt-2">Дашборд и аналитика — Фаза 7.</p>
    </main>
  );
}
