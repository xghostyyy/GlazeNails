# Glaze Studio 💅

Онлайн-запись для студии маникюра и педикюра. Клиент выбирает услугу, мастера и
время за три шага; мастер подтверждает запись и ведёт расписание; администратор
управляет услугами, сотрудниками, отзывами и настройками студии.

Фирменный «перламутровый» дизайн (lilac → petal → champagne) на тёплом молочном фоне.

---

## Содержание

- [Стек](#стек)
- [Возможности](#возможности)
- [Быстрый старт (локально)](#быстрый-старт-локально)
- [Тестовые аккаунты](#тестовые-аккаунты)
- [Переменные окружения](#переменные-окружения)
- [Команды](#команды)
- [Структура проекта](#структура-проекта)
- [Развёртывание на Vercel + Neon](#развёртывание-на-vercel--neon)
- [Cron-задачи](#cron-задачи)
- [Безопасность](#безопасность)

---

## Стек

| Слой | Технология |
|------|-----------|
| Фреймворк | **Next.js 15** (App Router), React 19 |
| Язык | **TypeScript** (strict) |
| Стили | **Tailwind CSS v4** + **shadcn/ui** (Base UI) |
| Анимации | **Motion** (бывш. Framer Motion) |
| БД | **PostgreSQL** (Neon) через **Prisma 7** + адаптер `@prisma/adapter-pg` |
| Аутентификация | **Auth.js v5** (NextAuth) — email/пароль + Google OAuth, стратегия JWT |
| Валидация | **Zod v4** на всех границах + React Hook Form |
| Даты/TZ | **date-fns** + **date-fns-tz** |
| Почта | **Resend** (транзакционные письма) |
| Тесты | **Vitest** (алгоритм слотов) |
| Хостинг | **Vercel** + **Neon** |

---

## Возможности

**Клиент**
- Запись в 3 шага: услуга → мастер (или «любой свободный») → дата и время
- Личный кабинет: предстоящие и прошедшие записи, отмена и перенос (с учётом cutoff)
- Отзыв после завершённого визита
- Редактирование профиля (имя, телефон)

**Мастер**
- Лента запросов: подтвердить / отклонить (с причиной)
- Календарь дня, отметка «выполнено» / «не пришёл»
- Управление рабочими часами и выходными
- Свои отзывы и рейтинг

**Администратор**
- CRUD услуг
- Общий календарь студии на неделю
- Карточки мастеров
- Модерация отзывов (публикация / скрытие)
- Настройки студии (гранулярность слотов, буферы, окна отмены/переноса)

**Системное**
- Письма: новая запись → мастеру; подтверждение/отказ → клиенту; напоминание за
  24 ч; запрос отзыва после визита
- Защита от двойного бронирования через `pg_advisory_xact_lock` + проверку слота
  внутри транзакции
- Кэширование публичных данных (`unstable_cache`, TTL 5 мин)

---

## Быстрый старт (локально)

### Требования

- **Node.js 20+**
- **PostgreSQL** — проще всего бесплатная база на [Neon](https://neon.tech)
  (подойдёт и локальный Postgres)

### Шаги

```bash
# 1. Установить зависимости
npm install

# 2. Создать .env из примера и заполнить значения
cp .env.example .env
#   как минимум укажите DATABASE_URL и AUTH_SECRET

# 3. Сгенерировать Prisma Client
npx prisma generate

# 4. Применить миграции к базе
npx prisma migrate deploy        # или: npx prisma migrate dev

# 5. Заполнить демо-данными (услуги, мастера, записи, отзыв)
npx prisma db seed

# 6. Запустить дев-сервер
npm run dev
```

Откройте <http://localhost:3000>.

> **Генерация секрета:**
> `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

> **Предупреждение про SSL при старте?** Если в консоли видно
> `SECURITY WARNING: The SSL modes ... treated as aliases for 'verify-full'` —
> поменяйте в `DATABASE_URL` параметр `sslmode=require` на `sslmode=verify-full`.
> Neon отдаёт валидный сертификат, поэтому `verify-full` работает без доп. настроек.

---

## Тестовые аккаунты

После `npx prisma db seed` доступны:

| Роль | Email | Пароль |
|------|-------|--------|
| Администратор | `admin@glaze.studio` | `admin123` |
| Клиент | `client@glaze.studio` | `client123` |
| Мастер | `anna@glaze.studio` | `master123` |
| Мастер | `maria@glaze.studio` | `master123` |
| Мастер | `kate@glaze.studio` | `master123` |
| Мастер | `olga@glaze.studio` | `master123` |
| Мастер | `lena@glaze.studio` | `master123` |
| Мастер | `yulia@glaze.studio` | `master123` |

> ⚠️ Это демо-пароли только для разработки. **Смените или удалите их перед
> публичным запуском** (не запускайте seed на проде).

---

## Переменные окружения

| Переменная | Обязательна | Назначение |
|-----------|:-----------:|-----------|
| `DATABASE_URL` | ✅ | Строка подключения к PostgreSQL (Neon). Реком. `sslmode=verify-full` |
| `AUTH_SECRET` | ✅ | Секрет для подписи JWT-сессий (32 байта) |
| `NEXTAUTH_URL` | ✅ (прод) | Базовый URL приложения — для писем и OAuth callback |
| `AUTH_GOOGLE_ID` | — | Client ID Google OAuth. Без него кнопка Google скрыта |
| `AUTH_GOOGLE_SECRET` | — | Client Secret Google OAuth |
| `RESEND_API_KEY` | — | Ключ Resend. Без него письма пишутся в консоль (no-op) |
| `RESEND_FROM` | — | Адрес отправителя, напр. `Glaze Studio <noreply@domain.com>` |
| `CRON_SECRET` | — | Защита эндпоинтов `/api/cron/*`. Vercel Cron шлёт его автоматически |

Полный шаблон — в [`.env.example`](./.env.example).

---

## Команды

```bash
npm run dev          # дев-сервер (http://localhost:3000)
npm run build        # продакшн-сборка
npm run start        # запуск собранного приложения
npm run lint         # ESLint

npx vitest run                   # все тесты
npx vitest run src/lib/slots/    # только тесты алгоритма слотов

npx prisma generate              # регенерировать Prisma Client
npx prisma migrate dev --name x  # создать миграцию
npx prisma migrate deploy        # применить миграции (прод)
npx prisma db seed               # демо-данные
npx prisma studio                # GUI базы данных
```

---

## Структура проекта

```
src/
  app/
    (public)/        — лендинг, /services, /masters, /booking, /login, /register
    account/         — кабинет клиента
    master/          — кабинет мастера
    admin/           — админка
    api/
      auth/[...nextauth]/  — обработчик Auth.js
      cron/                — эндпоинты Vercel Cron
  components/
    ui/              — компоненты shadcn/ui
    shared/          — компоненты проекта (Navbar, Hero, секции…)
  lib/
    prisma.ts        — singleton PrismaClient
    auth/            — конфигурация Auth.js + server actions
    slots/           — чистые функции алгоритма доступных слотов
    booking/         — создание записи (advisory lock)
    appointments/    — отмена, перенос, отзывы
    master/          — действия мастера
    admin/           — действия администратора
    notifications/   — абстракция канала + письма (Resend)
  schemas/           — Zod-схемы
  generated/prisma/  — сгенерированный Prisma Client (не редактировать)
  middleware.ts      — защита маршрутов по роли
prisma/
  schema.prisma      — источник правды для схемы БД
  seed.ts            — демо-данные
  migrations/        — история миграций
vercel.json          — расписание Cron
```

---

## Развёртывание на Vercel + Neon

### 1. База данных (Neon)

1. Создайте проект на [neon.tech](https://neon.tech) и скопируйте connection string.
2. Используйте `sslmode=verify-full` в конце строки.

### 2. Применение схемы

Локально, указав прод-`DATABASE_URL`:

```bash
npx prisma migrate deploy
```

(seed на проде запускать не нужно — он содержит демо-аккаунты с известными паролями).

### 3. Vercel

1. Импортируйте репозиторий на [vercel.com](https://vercel.com) (фреймворк
   определится как Next.js автоматически).
2. В **Settings → Environment Variables** добавьте переменные из таблицы выше
   (как минимум `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL` = ваш прод-домен).
3. Если используете почту — добавьте `RESEND_API_KEY` и `RESEND_FROM`
   (домен отправителя должен быть верифицирован в Resend).
4. Для Cron задайте `CRON_SECRET`.
5. **Deploy.**

> Команда сборки по умолчанию — `next build`. Если на Vercel Prisma Client не
> сгенерировался, задайте Build Command: `prisma generate && next build`.

### 4. Google OAuth (опционально)

1. В [Google Cloud Console](https://console.cloud.google.com) создайте OAuth
   Client ID (тип Web).
2. Authorized redirect URI:
   `https://<ваш-домен>/api/auth/callback/google`
3. Добавьте `AUTH_GOOGLE_ID` и `AUTH_GOOGLE_SECRET` в переменные Vercel.

---

## Cron-задачи

Расписание описано в [`vercel.json`](./vercel.json):

| Эндпоинт | Расписание | Действие |
|----------|-----------|----------|
| `/api/cron/reminders` | каждый час (`0 * * * *`) | Напоминание за 24 ч клиентам с подтверждённой записью |
| `/api/cron/review-requests` | каждый час (`30 * * * *`) | Запрос отзыва клиентам, у кого визит завершился 1–2 ч назад |

Ширина временного окна в каждом задании равна периоду запуска (1 час), поэтому
каждая запись попадает в выборку **ровно один раз** — без дублей писем.

> **Важно:** на тарифе Vercel **Hobby** Cron запускается максимум раз в сутки.
> Для почасового расписания нужен план **Pro**. Эндпоинты защищены
> `CRON_SECRET`: при заданной переменной запрос без заголовка
> `Authorization: Bearer <CRON_SECRET>` получит `401`.

---

## Безопасность

- `.env` в `.gitignore` — в репозиторий попадает только `.env.example` (без секретов).
- Все мутации проходят валидацию **Zod** до обращения к БД.
- Права и переходы статусов записей проверяются **на сервере** (клиент лишь
  показывает/скрывает UI).
- Бронирование и перенос — в транзакции с `pg_advisory_xact_lock`; при гонке
  слот-конфликт возвращается как ошибка, а не 500.
- Пароли хешируются `bcrypt` (cost 12).
- Пользовательские данные экранируются перед вставкой в HTML писем.
- HTTP-заголовки безопасности (`X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`) заданы в `next.config.ts`.

---

Created by [xghostyyy](https://t.me/xghostyyy)
