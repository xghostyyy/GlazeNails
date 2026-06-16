# SPEC.md — Студия маникюра и педикюра «Glaze»

> Этот файл — единый источник правды для проекта. Положи его в корень репозитория.
> Claude Code должен читать его перед каждой фазой и сверять реализацию с ним.

---

## 1. Концепция и аудитория

Онлайн-запись и управление для студии маникюра/педикюра.

- **Аудитория:** молодые девушки 18–30, мобайл-first, привыкли к Instagram-эстетике и быстрым сценариям.
- **Масштаб:** ~200 записей/месяц, 5–6 мастеров. Нагрузка низкая — не нужен сложный инфраструктурный оверинжиниринг.
- **Главная ценность для клиента:** записаться за 3 тапа, видеть реальное свободное время, управлять своими записями.
- **Главная ценность для студии:** мастер сам подтверждает/отклоняет запись, владелец видит всю картину.

---

## 2. Роли и права

| Роль | Может |
|------|-------|
| **CLIENT** (клиент) | Просматривать услуги/мастеров, бронировать, видеть свои записи, переносить/отменять (по правилам), оставлять отзыв после визита, редактировать профиль |
| **MASTER** (мастер/сотрудник) | Видеть свой график и входящие записи, подтверждать/отклонять запись, отмечать «выполнено»/«не пришёл», управлять своими рабочими часами и отгулами, видеть свои отзывы и рейтинг |
| **ADMIN** (владелец) | Всё, что мастер, плюс: CRUD мастеров и услуг, общий календарь всех мастеров, аналитика (выручка, загрузка, популярные услуги), модерация отзывов, настройки студии |

Один пользователь — одна роль. ADMIN может быть и MASTER (флаг `canTakeBookings`).

---

## 3. Доменная модель (Prisma-схема, целевая)

```prisma
model User {
  id            String   @id @default(cuid())
  role          Role     @default(CLIENT)
  name          String
  phone         String?  @unique
  email         String   @unique
  passwordHash  String?          // null, если только OAuth
  avatarUrl     String?
  createdAt     DateTime @default(now())

  // если пользователь — мастер:
  masterProfile MasterProfile?

  appointments  Appointment[]   @relation("ClientAppointments")
  reviews       Review[]
}

enum Role { CLIENT MASTER ADMIN }

model MasterProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  bio             String?
  specialties     Specialty[]      // что умеет: MANICURE / PEDICURE / DESIGN ...
  canTakeBookings Boolean  @default(true)
  ratingAvg       Float    @default(0)   // денормализованный кэш
  ratingCount     Int      @default(0)

  workingHours    WorkingHours[]
  timeOff         TimeOff[]
  appointments    Appointment[] @relation("MasterAppointments")
  services        Service[]     @relation("MasterServices") // какие услуги оказывает
}

enum Specialty { MANICURE PEDICURE DESIGN EXTENSION REMOVAL }

model Service {
  id            String   @id @default(cuid())
  name          String
  description   String?
  category      Specialty
  durationMin   Int               // длительность в минутах (драйвер расчёта слотов)
  priceCents    Int
  imageUrl      String?
  isActive      Boolean  @default(true)
  masters       MasterProfile[] @relation("MasterServices")
  appointments  Appointment[]
}

// Регулярный недельный график мастера. Несколько записей на день = смены с перерывом.
model WorkingHours {
  id        String  @id @default(cuid())
  masterId  String
  master    MasterProfile @relation(fields: [masterId], references: [id])
  weekday   Int     // 0=Вс ... 6=Сб
  startMin  Int     // минуты от полуночи, напр. 600 = 10:00
  endMin    Int     // напр. 1200 = 20:00
}

// Разовые исключения: отпуск, отгул, праздник. Перекрывает WorkingHours.
model TimeOff {
  id        String   @id @default(cuid())
  masterId  String
  master    MasterProfile @relation(fields: [masterId], references: [id])
  startsAt  DateTime
  endsAt    DateTime
  reason    String?
}

model Appointment {
  id          String   @id @default(cuid())
  clientId    String
  client      User     @relation("ClientAppointments", fields: [clientId], references: [id])
  masterId    String
  master      MasterProfile @relation("MasterAppointments", fields: [masterId], references: [id])
  serviceId   String
  service     Service  @relation(fields: [serviceId], references: [id])

  startsAt    DateTime          // момент начала
  endsAt      DateTime          // startsAt + service.durationMin (хранить явно для запросов)
  status      AppointmentStatus @default(PENDING)
  clientNote  String?
  masterNote  String?           // причина отклонения и т.п.

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  review      Review?

  @@index([masterId, startsAt])
}

enum AppointmentStatus {
  PENDING      // ждёт подтверждения мастера
  CONFIRMED    // мастер подтвердил
  COMPLETED    // визит состоялся
  REJECTED     // мастер отклонил
  CANCELLED    // клиент отменил
  NO_SHOW      // клиент не пришёл
}

model Review {
  id            String   @id @default(cuid())
  appointmentId String   @unique     // 1 отзыв на 1 запись
  appointment   Appointment @relation(fields: [appointmentId], references: [id])
  clientId      String
  client        User     @relation(fields: [clientId], references: [id])
  rating        Int                 // 1..5
  text          String?
  photoUrls     String[]
  isPublished   Boolean  @default(true) // для модерации админом
  createdAt     DateTime @default(now())
}

model StudioSettings {
  id              String @id @default("singleton")
  slotGranularity Int    @default(15)  // шаг сетки слотов, мин
  bufferAfterMin  Int    @default(15)  // уборка/дезинфекция между записями
  minLeadHours    Int    @default(2)   // нельзя бронировать ближе чем за N часов
  maxAdvanceDays  Int    @default(45)  // горизонт записи вперёд
  cancelCutoffH   Int    @default(24)  // отмена/перенос не позже чем за N часов
  timezone        String @default("Europe/Amsterdam")
}
```

---

## 4. Ключевая логика

### 4.1 Жизненный цикл записи (state machine)

```
            (клиент бронирует)
                  │
                  ▼
              PENDING ──(мастер отклонил)──► REJECTED
                  │
       (мастер подтвердил)
                  ▼
              CONFIRMED ──(клиент отменил ≥ cutoff)──► CANCELLED
                  │
        (визит прошёл / мастер отметил)
            ┌─────┴─────┐
            ▼           ▼
        COMPLETED     NO_SHOW
            │
   (клиент может оставить отзыв)
```

Разрешённые переходы строго проверяются на сервере (нельзя из COMPLETED уйти в PENDING и т.п.).

- **Перенос (reschedule):** редактирование `startsAt`/услуги допустимо только для `PENDING`/`CONFIRMED` и не позже `cancelCutoffH` до начала. Перенос = полная переｐроверка доступности нового слота в транзакции. Если меняется время у `CONFIRMED` — статус сбрасывается в `PENDING` (мастер подтверждает заново).
- **Отзыв:** только когда `status = COMPLETED`, ровно один на запись.

### 4.2 Алгоритм расчёта свободных слотов (ядро системы)

Функция `getAvailableSlots(masterId, serviceId, date) → Date[]`.

Вход: мастер, услуга (даёт `durationMin`), дата. Настройки из `StudioSettings`.

Шаги:
1. **Рабочие интервалы дня.** Берём `WorkingHours` мастера для `weekday(date)`. Может быть несколько (смены) → список `[startMin, endMin]`.
2. **Вычесть отгулы.** Из интервалов вырезаем пересечения с `TimeOff`.
3. **Вычесть занятость.** Берём `Appointment` мастера на эту дату со `status ∈ {PENDING, CONFIRMED}`. Каждая занимает `[startsAt, endsAt + bufferAfterMin]`. Вырезаем → получаем «свободные интервалы».
4. **Нарезать слоты.** Для каждого свободного интервала `[fs, fe]` генерим стартовые времена `t = fs, fs+granularity, …` пока `t + durationMin ≤ fe`.
5. **Отсечь прошлое.** Если `date == сегодня`, оставляем только `t ≥ now + minLeadHours`. Также отсекаем дальше `maxAdvanceDays`.
6. Вернуть отсортированный уникальный список начал слотов (в TZ студии).

**«Любой свободный мастер»:** считаем объединение слотов всех мастеров, умеющих услугу; при бронировании назначаем конкретного (первого свободного / наименее загруженного).

**Гонки (race conditions).** Слоты не хранятся строками, поэтому два клиента могут выбрать одно время. При создании/переносе:
- открыть транзакцию,
- взять advisory-lock по `(masterId, date)` (`pg_advisory_xact_lock`),
- пересчитать доступность внутри транзакции,
- вставить запись только если слот всё ещё свободен, иначе вернуть 409 и попросить выбрать другое время.

Алгоритм должен быть **чистой функцией** над данными (интервальная арифметика отдельно от БД) и покрыт unit-тестами: смены с перерывом, отгул посреди дня, буфер между записями, граница «сегодня + lead time», переход через полночь (запрещаем), DST-переходы (через `date-fns-tz`).

### 4.3 Уведомления (события → каналы)

| Событие | Кому | Канал (MVP) |
|---------|------|-------------|
| Новая запись `PENDING` | мастер | in-app + email |
| Запись `CONFIRMED` / `REJECTED` | клиент | in-app + email |
| Напоминание за 24ч | клиент | email (cron) |
| Просьба об отзыве после `COMPLETED` | клиент | email |

In-app — таблица `Notification` (опционально) или просто бейдж непрочитанного по статусам. Email через Resend. SMS — отдельной фазой позже, интерфейс уведомлений абстрагировать (`NotificationChannel`), чтобы добавить SMS без переписывания.

---

## 5. Структура приложения (маршруты)

**Публичные**
- `/` — лендинг (hero, услуги, мастера, галерея работ, отзывы, CTA «Записаться»)
- `/services` — каталог услуг
- `/masters` — мастера с рейтингом и портфолио
- `/booking` — мастер бронирования (шаг 1 услуга → шаг 2 мастер → шаг 3 дата/время → шаг 4 подтверждение)
- `/login`, `/register`

**Кабинет клиента** `/account`
- `/account` — мои записи (ближайшие / прошедшие)
- `/account/appointments/[id]` — детали: перенос, отмена, оставить отзыв
- `/account/profile`

**Кабинет мастера** `/master`
- `/master` — расписание на сегодня
- `/master/requests` — входящие `PENDING` (подтвердить/отклонить)
- `/master/calendar` — недельный/дневной календарь
- `/master/schedule` — свои рабочие часы и отгулы
- `/master/reviews` — отзывы и рейтинг

**Админка** `/admin`
- `/admin` — дашборд + аналитика
- `/admin/employees` — CRUD мастеров, их услуги и графики
- `/admin/services` — CRUD услуг
- `/admin/calendar` — общий календарь всех мастеров
- `/admin/reviews` — модерация
- `/admin/settings` — `StudioSettings`

Доступ к группам маршрутов — через middleware по роли.

---

## 6. Стек технологий

Принцип: **один язык end-to-end, один репозиторий, деплой в один клик, щедрые free-tier'ы.** Для 200 записей/мес инфраструктура почти бесплатна.

**Рекомендуемый стек:**
- **Next.js 15 (App Router) + TypeScript (strict)** — фронт и бэк в одном проекте, Server Actions + Route Handlers вместо отдельного сервера.
- **Tailwind CSS v4 + shadcn/ui** — быстрый, консистентный UI; компоненты копируются в проект (без vendor-lock).
- **Motion (бывш. Framer Motion)** — анимации.
- **PostgreSQL на Neon** — serverless Postgres, free-tier, ветки БД для preview-окружений.
- **Prisma ORM** — типобезопасные запросы и миграции.
- **Auth.js (NextAuth v5)** — email+пароль и Google OAuth; сессии в БД.
- **Zod** — валидация на границах (формы, Server Actions, API).
- **React Hook Form** — формы.
- **date-fns + date-fns-tz** — вся арифметика времени и TZ.
- **Resend** — транзакционные письма.
- **Vercel Cron** — напоминания и просьбы об отзыве.
- **Деплой:** Vercel (приложение) + Neon (БД). Оба интегрированы с git: `git push` → автодеплой. Секреты — в env.

**Альтернативы (упомянуть, но не использовать по умолчанию):**
- *Ещё проще, всё-в-одном:* **Supabase** (Postgres + Auth + Storage + Realtime). Меньше движущихся частей, но чуть больше vendor-lock.
- *Полный контроль:* Docker Compose (Next.js + Postgres) на любом VPS. Дороже в обслуживании.

**Почему так:** нет отдельного backend-сервиса для поддержки; serverless-БД масштабируется сама; вся логика на TypeScript; CI/CD из коробки. Переезд в будущем простой: Prisma делает БД портативной, shadcn-компоненты в коде, Next.js хостится где угодно (Vercel/Netlify/Node/Docker).

---

## 7. Дизайн-направление «Glaze»

Цель — нежно, женственно, **но не шаблонно** (не дефолтный «кремовый фон + Playfair + терракота»). Подпись бренда — глянец гель-лака и перламутр.

**Концепция:** глянцевый, «залакированный» интерфейс. Карточки и кнопки имеют мягкий перламутровый отблеск; выбор времени/услуги ощущается как выбор оттенка лака.

**Палитра (CSS-переменные):**
- `--porcelain` `#FAF6F3` — фон (тёплый молочный)
- `--petal` `#F6D8DE` — розовый лепесток
- `--lilac-haze` `#DCC9E8` — дымчатая лаванда
- `--mocha` `#5E4F4B` — текст (тёплый коричневый вместо чёрного — мягче)
- `--champagne` `#E7C9A0` — золотисто-шампань акцент
- `--pearl` — перламутровый градиент (`lilac-haze → petal → champagne`) для signature-элементов

**Типографика:**
- Display — **Fraunces** (мягкий «оптический» serif с характером; используется сдержанно, крупно, в заголовках). Не Playfair.
- Body — **General Sans** (или fallback **Inter**) — чистый, тёплый гротеск.
- Caption/utility — тот же body, мельче, с увеличенным трекингом, капс для лейблов.
- Чёткая типошкала, осмысленные веса; типографика — часть айдентики, а не просто носитель текста.

**Signature-элемент (одна запоминающаяся деталь):** глянцевый «лаковый» пикер времени — слоты как перламутровые чипсы-капли лака, при наведении лёгкий блик; на hero — мягкий анимированный mesh-градиент (перламутр), едва тянущийся за курсором.

**Анимация (сдержанно, оркестрованно > разбросанно):**
- мягкий page-load reveal на hero,
- scroll-triggered появление секций (fade + rise),
- hover-микровзаимодействия на карточках мастеров/услуг (подъём + блик),
- плавные переходы шагов в мастере бронирования.
- Обязательно: `prefers-reduced-motion` уважается, видимый focus для клавиатуры, всё адаптивно до мобайла. Не переанимировать — лишняя анимация выдаёт «сгенерированность».

**Тон текста:** живой, на «ты», глаголы-действия. Кнопка говорит, что произойдёт: «Записаться», «Перенести», «Оставить отзыв». Пустые состояния — приглашение к действию, ошибки — что пошло не так и как починить.

---

## 8. Нефункциональные требования / quality bar

- TypeScript strict, без `any` на границах; всё валидируется Zod.
- Алгоритм слотов — чистые функции + unit-тесты (Vitest).
- Доступность: семантика, focus-видимость, контраст, reduced-motion.
- Адаптивность: дизайн mobile-first (аудитория — телефоны).
- Сид-данные: 6 мастеров, ~12 услуг, графики, демо-записи и отзывы — чтобы UI был «живым» сразу.
- Защита маршрутов по ролям (middleware + проверки в Server Actions, не только на клиенте).
- Все мутации идемпотентны и проверяют права + переходы статусов на сервере.
