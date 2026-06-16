"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { createBookingAction, getAvailableSlotsAction } from "@/lib/booking/actions";
import { format, addDays, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";

interface Service {
  id: string;
  name: string;
  category: string;
  durationMin: number;
  priceCents: number;
}

interface Master {
  id: string;
  name: string;
  avatarUrl: string | null;
  specialties: string[];
  serviceIds: string[];
}

interface Props {
  services: Service[];
  masters: Master[];
}

const CATEGORY_LABELS: Record<string, string> = {
  MANICURE: "Маникюр",
  PEDICURE: "Педикюр",
  DESIGN: "Дизайн",
  EXTENSION: "Наращивание",
  REMOVAL: "Снятие",
};

const STEPS = ["Услуга", "Мастер", "Дата и время", "Подтверждение"];

function StepIndicator({ current }: { current: number }) {
  return (
    <nav aria-label="Шаги записи" className="flex items-center gap-2 mb-8">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors
              ${i < current ? "bg-mocha text-porcelain" : i === current ? "bg-pearl text-mocha ring-2 ring-mocha" : "bg-muted text-muted-foreground"}`}
            aria-current={i === current ? "step" : undefined}
          >
            {i < current ? "✓" : i + 1}
          </div>
          <span className={`text-sm hidden sm:inline ${i === current ? "text-mocha font-medium" : "text-mocha/40"}`}>
            {label}
          </span>
          {i < STEPS.length - 1 && <div className="w-6 h-px bg-border mx-1" />}
        </div>
      ))}
    </nav>
  );
}

export function BookingWizard({ services, masters }: Props) {
  const router = useRouter();
  const reduce = useReducedMotion();

  const [step, setStep] = useState(0);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedMaster, setSelectedMaster] = useState<Master | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [clientNote, setClientNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const slideVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * (reduce ? 0 : 40) }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir * (reduce ? 0 : -40) }),
  };
  const [direction, setDirection] = useState(1);

  function goToStep(n: number) {
    setDirection(n > step ? 1 : -1);
    setStep(n);
    setError(null);
  }

  async function loadSlots(masterId: string, serviceId: string, date: Date) {
    setSlotsLoading(true);
    const res = await getAvailableSlotsAction(masterId, serviceId, date.toISOString());
    setSlotsLoading(false);
    if (res.ok) {
      setSlots(res.data);
      setSelectedSlot(null);
    } else {
      setError(res.error);
    }
  }

  async function handleSubmit() {
    if (!selectedService || !selectedSlot) return;
    setSubmitting(true);
    setError(null);

    const res = await createBookingAction({
      serviceId: selectedService.id,
      masterId: selectedMaster?.id ?? "any",
      startsAt: selectedSlot,
      clientNote: clientNote || undefined,
    });

    setSubmitting(false);
    if (res.ok) {
      router.push(`/account?booked=${res.data.id}`);
    } else {
      setError(res.error);
    }
  }

  const groupedServices = services.reduce(
    (acc, svc) => {
      const cat = CATEGORY_LABELS[svc.category] ?? svc.category;
      (acc[cat] ??= []).push(svc);
      return acc;
    },
    {} as Record<string, Service[]>
  );

  const futureDates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i + 1));

  return (
    <div>
      <StepIndicator current={step} />

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {/* ── Step 0: Select service ─────────────────────────────────── */}
          {step === 0 && (
            <div>
              <h2 className="font-semibold text-lg text-mocha mb-4">Выберите услугу</h2>
              {Object.entries(groupedServices).map(([cat, svcs]) => (
                <div key={cat} className="mb-6">
                  <p className="text-xs font-medium tracking-widest uppercase text-mocha/40 mb-3">{cat}</p>
                  <div className="space-y-2">
                    {svcs.map((svc) => (
                      <button
                        key={svc.id}
                        onClick={() => {
                          setSelectedService(svc);
                          goToStep(1);
                        }}
                        className={`w-full text-left rounded-2xl p-4 border transition-all
                          ${selectedService?.id === svc.id
                            ? "border-mocha bg-mocha/5"
                            : "border-border bg-white hover:border-mocha/30 hover:bg-petal/10"
                          }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-mocha text-sm">{svc.name}</p>
                            <p className="text-xs text-mocha/50 mt-0.5">{svc.durationMin} мин</p>
                          </div>
                          <p className="text-sm font-semibold text-mocha">
                            {(svc.priceCents / 100).toLocaleString("ru-RU")} ₽
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Step 1: Select master ──────────────────────────────────── */}
          {step === 1 && selectedService && (
            <div>
              <h2 className="font-semibold text-lg text-mocha mb-4">Выберите мастера</h2>

              {/* Any master option */}
              <button
                onClick={() => {
                  setSelectedMaster(null);
                  goToStep(2);
                }}
                className="w-full text-left rounded-2xl p-4 border border-border bg-white hover:border-mocha/30 hover:bg-petal/10 transition-all mb-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pearl flex items-center justify-center text-mocha font-semibold text-sm">
                    ✨
                  </div>
                  <div>
                    <p className="font-medium text-mocha text-sm">Любой свободный мастер</p>
                    <p className="text-xs text-mocha/50">Максимально раннее время</p>
                  </div>
                </div>
              </button>

              <div className="space-y-2">
                {masters.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedMaster(m);
                      goToStep(2);
                    }}
                    className={`w-full text-left rounded-2xl p-4 border transition-all
                      ${selectedMaster?.id === m.id
                        ? "border-mocha bg-mocha/5"
                        : "border-border bg-white hover:border-mocha/30 hover:bg-petal/10"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-lilac-haze text-mocha text-xs font-semibold">
                          {m.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-mocha text-sm">{m.name}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {m.specialties.slice(0, 3).map((s) => (
                            <Badge key={s} variant="outline" className="text-xs border-lilac-haze text-mocha/60 py-0">
                              {CATEGORY_LABELS[s] ?? s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <Button variant="ghost" className="mt-4 text-mocha/50" onClick={() => goToStep(0)}>
                ← Назад
              </Button>
            </div>
          )}

          {/* ── Step 2: Date + time ────────────────────────────────────── */}
          {step === 2 && selectedService && (
            <div>
              <h2 className="font-semibold text-lg text-mocha mb-4">Дата и время</h2>

              {/* Date picker */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-1 px-1 scrollbar-none">
                {futureDates.map((d) => (
                  <button
                    key={d.toISOString()}
                    onClick={async () => {
                      setSelectedDate(d);
                      await loadSlots(
                        selectedMaster?.id ?? "any",
                        selectedService.id,
                        d
                      );
                    }}
                    className={`flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-2xl border transition-all
                      ${selectedDate && isSameDay(selectedDate, d)
                        ? "border-mocha bg-mocha text-porcelain"
                        : "border-border bg-white text-mocha hover:border-mocha/30"
                      }`}
                  >
                    <span className="text-xs font-medium uppercase">
                      {format(d, "EEE", { locale: ru })}
                    </span>
                    <span className="text-lg font-semibold">{format(d, "d")}</span>
                    <span className="text-xs">{format(d, "MMM", { locale: ru })}</span>
                  </button>
                ))}
              </div>

              {/* Time slots */}
              {slotsLoading && (
                <p className="text-sm text-mocha/50 text-center py-4">Загружаем доступное время…</p>
              )}

              {!slotsLoading && selectedDate && slots.length === 0 && (
                <p className="text-sm text-mocha/50 text-center py-4">
                  Нет свободного времени в этот день. Выберите другую дату.
                </p>
              )}

              {!slotsLoading && slots.length > 0 && (
                <div>
                  <p className="text-xs font-medium tracking-wider uppercase text-mocha/40 mb-3">
                    Свободные окна
                  </p>
                  <div
                    className="flex flex-wrap gap-2"
                    role="listbox"
                    aria-label="Доступное время"
                  >
                    {slots.map((slot) => {
                      const label = format(new Date(slot), "HH:mm");
                      const isSelected = selectedSlot === slot;
                      return (
                        <button
                          key={slot}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => setSelectedSlot(slot)}
                          className="slot-chip"
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {error && <p role="alert" className="text-sm text-destructive mt-4">{error}</p>}

              <div className="flex gap-3 mt-6">
                <Button variant="ghost" className="text-mocha/50" onClick={() => goToStep(1)}>
                  ← Назад
                </Button>
                <Button
                  onClick={() => goToStep(3)}
                  disabled={!selectedSlot}
                  className="rounded-full flex-1"
                >
                  Продолжить
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Confirmation ───────────────────────────────────── */}
          {step === 3 && selectedService && selectedSlot && (
            <div>
              <h2 className="font-semibold text-lg text-mocha mb-6">Подтверждение записи</h2>

              <div className="bg-white rounded-2xl border border-border p-5 mb-5 space-y-3">
                <SummaryRow label="Услуга" value={selectedService.name} />
                <SummaryRow
                  label="Мастер"
                  value={selectedMaster?.name ?? "Любой свободный"}
                />
                <SummaryRow
                  label="Дата"
                  value={format(new Date(selectedSlot), "d MMMM yyyy, EEEE", { locale: ru })}
                />
                <SummaryRow
                  label="Время"
                  value={format(new Date(selectedSlot), "HH:mm")}
                />
                <SummaryRow
                  label="Длительность"
                  value={`${selectedService.durationMin} мин`}
                />
                <div className="pt-2 border-t border-border">
                  <SummaryRow
                    label="Стоимость"
                    value={`${(selectedService.priceCents / 100).toLocaleString("ru-RU")} ₽`}
                    bold
                  />
                </div>
              </div>

              <div className="mb-5">
                <label className="text-sm font-medium text-mocha mb-1.5 block" htmlFor="note">
                  Пожелания к мастеру{" "}
                  <span className="text-mocha/40 font-normal">(необязательно)</span>
                </label>
                <Textarea
                  id="note"
                  placeholder="Например: нежный дизайн в розово-лиловых тонах…"
                  value={clientNote}
                  onChange={(e) => setClientNote(e.target.value)}
                  className="resize-none"
                  rows={3}
                  maxLength={500}
                />
              </div>

              {error && <p role="alert" className="text-sm text-destructive mb-4">{error}</p>}

              <div className="flex gap-3">
                <Button variant="ghost" className="text-mocha/50" onClick={() => goToStep(2)}>
                  ← Назад
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="rounded-full flex-1 bg-mocha hover:bg-mocha/90"
                >
                  {submitting ? "Отправляем…" : "Записаться"}
                </Button>
              </div>

              <p className="text-xs text-mocha/40 text-center mt-4">
                После отправки запись ждёт подтверждения мастера
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center gap-2">
      <span className="text-sm text-mocha/50">{label}</span>
      <span className={`text-sm text-mocha text-right ${bold ? "font-semibold" : ""}`}>{value}</span>
    </div>
  );
}
