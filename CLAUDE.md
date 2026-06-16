# CLAUDE.md — Glaze Studio

## Источник правды

Перед каждой фазой читай SPEC.md (раздел, относящийся к фазе) и активируй нужный skill.
Skill активируется строкой «Активирую skill X» — это сигнал подгрузить .claude/skills/<X>/SKILL.md.

## Стек

- **Next.js 15** (App Router, Turbopack) + **TypeScript strict**
- **Tailwind CSS v4** + **shadcn/ui** (компоненты в src/components/ui/)
- **Motion** (анимации — бывш. Framer Motion)
- **Prisma 7** → PostgreSQL (**Neon**); клиент генерируется в `src/generated/prisma`
- **Auth.js v5** (NextAuth beta) — email+пароль, Google OAuth, сессии в БД
- **Zod v4** — валидация на всех границах (формы, Server Actions, Route Handlers)
- **React Hook Form** + @hookform/resolvers/zod
- **date-fns + date-fns-tz** — вся арифметика дат и TZ
- **Resend** — транзакционные письма
- **Vitest** — unit-тесты (особенно алгоритм слотов)
- **Vercel** (деплой) + **Neon** (БД)

## Команды

```bash
npm run dev          # дев-сервер (Turbopack)
npm run build        # продакшн-сборка (должна быть зелёной перед коммитом)
npm run lint         # ESLint
npx vitest run       # все тесты
npx vitest run src/lib/slots/   # только тесты слотов
npx prisma generate  # регенерировать Prisma Client
npx prisma migrate dev --name <name>   # новая миграция
npx prisma db seed   # сид-данные
npx prisma studio    # GUI БД
```

## Структура папок

```
src/
  app/
    (public)/         — лендинг, /services, /masters, /booking, /login, /register
    account/          — кабинет клиента
    master/           — кабинет мастера
    admin/            — админка
    api/
      auth/[...nextauth]/  — Auth.js handler
      cron/           — Vercel Cron jobs
  components/
    ui/               — shadcn/ui компоненты (копируются в проект)
    shared/           — переиспользуемые компоненты проекта
  generated/
    prisma/           — сгенерированный Prisma Client (не редактировать вручную)
  lib/
    prisma.ts         — singleton PrismaClient
    auth/             — Auth.js config (handlers, signIn, signOut, auth)
    slots/            — чистые функции алгоритма слотов (Фаза 3)
    notifications/    — NotificationChannel абстракция (Фаза 8)
  schemas/            — Zod-схемы (auth.ts, booking.ts, etc.)
  types/
    enums.ts          — Role, AppointmentStatus, Specialty
    next-auth.d.ts    — расширение сессии (id, role)
  middleware.ts       — защита маршрутов по роли
prisma/
  schema.prisma       — единственный источник правды для схемы БД
  seed.ts             — сид-данные (Фаза 2)
  migrations/         — история миграций
```

## Конвенции (обязательные)

- TypeScript strict — без `any` на публичных границах (параметры функций, возврат Server Actions)
- Все мутации валидируются Zod-схемой ДО обращения к БД
- Права и переходы статусов проверяются только на сервере; клиент показывает/скрывает UI, но не даёт гарантий
- `getAvailableSlots` и связанные функции — чистые (принимают данные, не делают запросов к БД)
- Создание/перенос записи — транзакция + `pg_advisory_xact_lock(masterId_hash, date_epoch)`
- Коммиты: Conventional Commits с `(phase-N)` → `feat(phase-2): add prisma schema + seed`
- Перед коммитом: `npm run build` зелёный + `npx vitest run` зелёный
- Импорт Prisma: `import { prisma } from "@/lib/prisma"` — только singleton

## Решения (принятые без согласования)

- **Timezone по умолчанию** → `Europe/Amsterdam` (из StudioSettings в SPEC)
- **«Наименее загруженный мастер»** → первый по name среди свободных (детерминировано; ранжирование — в следующей версии)
- **In-app уведомления** → бейдж по статусам записей (без отдельной таблицы Notification)
- **Google OAuth avatarUrl** → сохраняется в `user.image` (поле Auth.js); `avatarUrl` — для ручной загрузки
- **Prisma 7** — импорт из `@/generated/prisma`, не из `@prisma/client`

## Состояние

Текущая фаза: **0 (каркас)**
Что дальше: завершить каркас (тесты, сборка), commit, перейти к Фазе 1
