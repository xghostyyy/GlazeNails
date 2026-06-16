---
name: server-action-patterns
description: Паттерны Server Actions: Zod-валидация, проверка роли, формат ответа
---

## Стандартный тип возврата

```ts
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
```

Никогда не бросать необработанные исключения из Server Action — всегда возвращать `ActionResult`.

## Шаблон Server Action

```ts
"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/actions";

const schema = z.object({
  // ... поля
});

export async function myAction(raw: unknown): Promise<ActionResult<MyReturnType>> {
  // 1. Проверить сессию
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Не авторизован" };

  // 2. Проверить роль (если нужно)
  if (session.user.role !== "MASTER") return { ok: false, error: "Недостаточно прав" };

  // 3. Валидация входных данных
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Некорректные данные",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // 4. Бизнес-логика (с try/catch)
  try {
    const result = await prisma.someModel.create({ data: parsed.data });
    return { ok: true, data: result };
  } catch (e) {
    // Логировать, но не показывать стек клиенту
    console.error(e);
    return { ok: false, error: "Что-то пошло не так. Попробуйте ещё раз." };
  }
}
```

## Toast-сообщения (тон бренда)

- Успех: позитивный, конкретный → «Запись перенесена на 15 ноября в 14:00»
- Ошибка: что пошло не так + что делать → «Этот слот уже занят — выберите другое время»
- Нейтральный: на «ты», глаголы-действия

## Проверка прав по роли

```ts
// Утилита
import { auth } from "@/lib/auth";
import type { Role } from "@/types/enums";

export async function requireRole(role: Role | Role[]) {
  const session = await auth();
  const allowed = Array.isArray(role) ? role : [role];
  if (!session?.user || !allowed.includes(session.user.role)) {
    throw new Error("Forbidden");
  }
  return session.user;
}
```

## Идемпотентность

- PUT/PATCH операции должны быть идемпотентны (повторный вызов с теми же данными = тот же результат)
- Создание записи (Appointment) — нет: используем advisory-lock + проверку слота

## Валидация переноса/отмены (cancelCutoffH)

```ts
const settings = await prisma.studioSettings.findUnique({ where: { id: "singleton" } });
const cutoff = addHours(appointment.startsAt, -(settings?.cancelCutoffH ?? 24));
if (isBefore(cutoff, new Date())) {
  return { ok: false, error: `Отменить можно не позже чем за ${settings?.cancelCutoffH ?? 24} ч до записи` };
}
```
