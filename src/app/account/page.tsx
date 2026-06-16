import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main className="min-h-screen bg-porcelain p-8">
      <h1 className="font-display text-3xl text-mocha">Мои записи</h1>
      <p className="text-mocha/60 mt-2">Привет, {session.user.name}! Фаза 5.</p>
    </main>
  );
}
