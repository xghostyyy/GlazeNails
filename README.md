# Glaze Studio

Онлайн-запись для студии маникюра и педикюра. Клиенты бронируют за 3 тапа, мастера подтверждают из своего кабинета, владелец видит всю аналитику.

## Стек

- **Next.js 15** (App Router, Turbopack) + TypeScript strict
- **Tailwind CSS v4** + shadcn/ui
- **Prisma 7** → PostgreSQL (Neon)
- **Auth.js v5** — email+пароль, Google OAuth
- **Zod v4** — валидация на всех границах
- **Resend** — транзакционные письма
- **Vitest** — unit-тесты алгоритма слотов
- **Vercel** (деплой) + Neon (БД)

## Быстрый старт

```bash
npm install
cp .env.example .env.local   # заполни переменные
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Открой [http://localhost:3000](http://localhost:3000)

### Тестовые учётки (после seed)

| Роль | Email | Пароль |
|------|-------|--------|
| Admin | admin@glaze.studio | admin123 |
| Master | anna@glaze.studio | master123 |
| Client | client@glaze.studio | client123 |

## Команды

```bash
npm run dev          # дев-сервер
npm run build        # продакшн-сборка
npm run lint         # ESLint
npx vitest run       # все тесты
npx prisma studio    # GUI базы данных
```

## Структура

```
src/app/
  (public)/          — лендинг, /services, /masters, /booking, /login, /register
  account/           — кабинет клиента
  master/            — кабинет мастера
  admin/             — админ-панель
  api/
    auth/            — Auth.js handler
    cron/            — Vercel Cron (напоминания, просьбы об отзыве)
src/lib/
  slots/             — алгоритм расчёта слотов (чистые функции + тесты)
  booking/           — Server Action бронирования с pg_advisory_xact_lock
  appointments/      — отмена, перенос, отзыв
  master/            — действия мастера
  admin/             — действия администратора
  notifications/     — NotificationChannel abstraction + Resend
```

## Деплой на Vercel

1. Подключи репозиторий на [vercel.com](https://vercel.com)
2. Добавь переменные из `.env.example` в настройки проекта
3. Vercel Cron активируется автоматически через `vercel.json`
4. Для Neon: создай проект, скопируй `DATABASE_URL` в Vercel

> Перед первым деплоем в продакшн выполни `npx prisma migrate deploy` и `npx prisma db seed`
