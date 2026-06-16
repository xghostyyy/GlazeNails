"use server";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/schemas/auth";
import type { ActionResult } from "@/types/actions";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

export async function loginAction(formData: FormData): Promise<ActionResult> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
    return { ok: true, data: undefined };
  } catch (e) {
    if (e instanceof AuthError) {
      return { ok: false, error: "Неверный email или пароль" };
    }
    return { ok: false, error: "Что-то пошло не так. Попробуйте ещё раз." };
  }
}

export async function registerAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Проверьте введённые данные",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, email, password, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "Пользователь с таким email уже существует" };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, phone: phone || null, role: "CLIENT" },
    select: { id: true },
  });

  return { ok: true, data: { id: user.id } };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
