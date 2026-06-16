---
name: prisma-conventions
description: Соглашения по Prisma 7, транзакции, advisory-lock, переходы статусов
---

## Импорт

```ts
import { prisma } from "@/lib/prisma";
// Типы берём из generated:
import type { Appointment, AppointmentStatus } from "@/generated/prisma";
```

Никогда не импортировать PrismaClient напрямую — только через singleton.

## Именование

- Модели: PascalCase (как в schema.prisma)
- Поля: camelCase; суффикс `Id` для FK (masterId, clientId)
- Индексы: `@@index([masterId, startsAt])` на Appointment — уже в схеме

## Транзакция + Advisory Lock (создание/перенос записи)

```ts
import { prisma } from "@/lib/prisma";

async function bookSlot(input: BookingInput) {
  return prisma.$transaction(async (tx) => {
    // Advisory lock: блокируем (masterId_hash XOR date_epoch)
    // pg_advisory_xact_lock принимает bigint
    const lockKey = hashLockKey(input.masterId, input.date);
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey})`;

    // Пересчитать занятость ВНУТРИ транзакции
    const existing = await tx.appointment.findMany({
      where: {
        masterId: input.masterId,
        status: { in: ["PENDING", "CONFIRMED"] },
        startsAt: { gte: startOfDay(input.date), lt: endOfDay(input.date) },
      },
    });

    // Проверить, что слот всё ещё свободен
    const isAvailable = checkSlotFree(existing, input.startsAt, input.endsAt, settings);
    if (!isAvailable) throw new ConflictError("Слот уже занят");

    // Создать запись
    return tx.appointment.create({ data: { ...input, status: "PENDING" } });
  });
}
```

## Переходы статусов (проверять на сервере)

```ts
const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING:   ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "NO_SHOW", "CANCELLED"],
  COMPLETED: [],
  REJECTED:  [],
  CANCELLED: [],
  NO_SHOW:   [],
};

function assertTransition(from: AppointmentStatus, to: AppointmentStatus) {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new Error(`Переход ${from} → ${to} запрещён`);
  }
}
```

Перенос (reschedule): допустим только из `PENDING`/`CONFIRMED`, не позже `cancelCutoffH` до начала.
Если переносится `CONFIRMED` → статус сбрасывается в `PENDING`.

## Seed

```ts
// prisma/seed.ts — запускается через: npx prisma db seed
// 6 мастеров, ~12 услуг, графики, демо-записи, отзывы
// Используй upsert чтобы seed был идемпотентным
```

## Ошибки

- Уникальный конфликт (P2002) → 409
- Record not found (P2025) → 404
- Advisory lock конфликт → 409 + «Выберите другое время»
