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
import { loginSchema, type LoginInput } from "@/schemas/auth";

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setServerError(null);
    const res = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    if (res?.error) {
      setServerError("Неверный email или пароль");
      return;
    }
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
          <h1 className="text-xl font-semibold text-mocha mt-4">Войти</h1>
          <p className="text-sm text-mocha/50 mt-1">Управляй своими записями</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
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
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••"
              autoComplete="current-password"
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
            {isSubmitting ? "Входим…" : "Войти"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-mocha/50">
          Нет аккаунта?{" "}
          <Link href="/register" className="text-mocha font-medium underline-offset-2 hover:underline">
            Зарегистрироваться
          </Link>
        </div>
      </div>
    </div>
  );
}
