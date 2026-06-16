---
name: availability-engine
description: Контракт и правила алгоритма расчёта свободных слотов
---

## Контракт функции

```ts
// src/lib/slots/index.ts
function getAvailableSlots(params: {
  workingHours: { weekday: number; startMin: number; endMin: number }[];
  timeOffs: { startsAt: Date; endsAt: Date }[];
  existingAppointments: { startsAt: Date; endsAt: Date; status: AppointmentStatus }[];
  settings: { slotGranularity: number; bufferAfterMin: number; minLeadHours: number; maxAdvanceDays: number };
  date: Date;         // дата в TZ студии
  durationMin: number;
  now: Date;          // текущий момент (параметр, не Date.now() — для тестируемости)
  timezone: string;
}): Date[]            // список начал свободных слотов (в UTC)
```

**ВАЖНО:** функция не делает никаких запросов к БД. Все данные передаются снаружи. Pure function.

## Алгоритм (5 шагов)

1. **Рабочие интервалы**: фильтруем WorkingHours по `weekday(date, timezone)` → список `[startMin, endMin]` в минутах от полуночи.
2. **Вычесть TimeOff**: конвертируем `startsAt/endsAt` TimeOff в минуты этого дня; вырезаем пересечения из рабочих интервалов.
3. **Вычесть занятость**: берём Appointment со `status ∈ {PENDING, CONFIRMED}`. Каждая занимает `[startsAt_min, endsAt_min + bufferAfterMin]`. Вырезаем.
4. **Нарезать слоты**: для каждого свободного интервала `[fs, fe]` генерим `t = fs, fs+granularity, ...` пока `t + durationMin ≤ fe`.
5. **Отсечь прошлое и горизонт**: если `date == today`, оставляем только `t ≥ now + minLeadHours*60`. Отсекаем за `maxAdvanceDays`.

## Вспомогательные функции (тоже чистые)

```ts
subtractIntervals(base: Interval[], toRemove: Interval[]): Interval[]
minutesOfDay(date: Date, timezone: string): number
toDateInTZ(date: Date, timezone: string): Date
```

## Обязательные Vitest тест-кейсы

| # | Кейс | Ожидание |
|---|------|----------|
| 1 | Смены с перерывом (10-13, 14-18) | Нет слотов в 13:00–14:00 |
| 2 | TimeOff посреди рабочего дня | Слоты внутри отгула отсутствуют |
| 3 | Буфер между записями | Слот сразу после записи не предлагается, если буфер не истёк |
| 4 | lead time (minLeadHours=2, now=10:00) | Слоты до 12:00 скрыты |
| 5 | Запрет через полночь | endMin > 1440 не допускается / обрезается |
| 6 | DST-переход | date-fns-tz корректно переводит offset |
| 7 | «Любой мастер» | Объединение слотов двух мастеров без дублей |
| 8 | Полностью занятый день | Возвращает [] |

## date-fns-tz паттерн

```ts
import { toZonedTime, fromZonedTime, format } from "date-fns-tz";
const tz = "Europe/Amsterdam";
const zonedDate = toZonedTime(utcDate, tz);  // для display
const utcDate = fromZonedTime(zonedDate, tz); // для хранения
```
