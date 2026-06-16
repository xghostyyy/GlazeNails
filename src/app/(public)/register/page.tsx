"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { registerSchema, type RegisterInput } from "@/schemas/auth";
import { registerAction } from "@/lib/auth/actions";

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterInput) {
    setServerError(null);
    const res = await registerAction(data);
    if (!res.ok) {
      setServerError(res.error);
      return;
    }
    // Auto-login after registration
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    router.push("/account");
    router.refresh();
  }

  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[var(--shadow-card)] p-8 sm:p-10">
        <div className="mb-8">
          <Link href="/" className="font-display text-2xl font-semibold text-mocha">
            Glaze
          </Link>
          <h1 className="text-xl font-semibold text-mocha mt-4">Регистрация</h1>
          <p className="text-sm text-mocha/50 mt-1">Создай аккаунт для онлайн-записи</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="name">Имя</Label>
            <Input
              id="name"
              type="text"
              placeholder="Как тебя зовут?"
              autoComplete="name"
              {...register("name")}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-xs text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...register("email")}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">
              Телефон <span className="text-mocha/40">(необязательно)</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+7 999 000 00 00"
              autoComplete="tel"
              {...register("phone")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              placeholder="Минимум 6 символов"
              autoComplete="new-password"
              {...register("password")}
              aria-describedby={errors.password ? "pw-error" : undefined}
            />
            {errors.password && (
              <p id="pw-error" className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {serverError && (
            <p role="alert" className="text-sm text-destructive">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
            {isSubmitting ? "Создаём аккаунт…" : "Зарегистрироваться"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-mocha/50">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-mocha font-medium underline-offset-2 hover:underline">
            Войти
          </Link>
        </div>
      </div>
    </div>
  );
}
