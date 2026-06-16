import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function MasterPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["MASTER", "ADMIN"].includes(session.user.role)) redirect("/");

  return (
    <main className="min-h-screen bg-porcelain p-8">
      <h1 className="font-display text-3xl text-mocha">Кабинет мастера</h1>
      <p className="text-mocha/60 mt-2">Расписание на сегодня — Фаза 6.</p>
    </main>
  );
}
