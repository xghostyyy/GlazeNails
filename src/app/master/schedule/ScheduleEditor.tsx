"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  upsertWorkingHoursAction,
  deleteWorkingHoursAction,
  createTimeOffAction,
} from "@/lib/master/actions";

const WEEKDAYS = [
  { n: 1, label: "Пн" },
  { n: 2, label: "Вт" },
  { n: 3, label: "Ср" },
  { n: 4, label: "Чт" },
  { n: 5, label: "Пт" },
  { n: 6, label: "Сб" },
  { n: 0, label: "Вс" },
];

function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function ScheduleEditor() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"hours" | "timeoff">("hours");

  // Working hours form
  const [wdStart, setWdStart] = useState("10:00");
  const [wdEnd, setWdEnd] = useState("19:00");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [wLoading, setWLoading] = useState(false);
  const [wError, setWError] = useState<string | null>(null);
  const [wSuccess, setWSuccess] = useState(false);

  // Time off form
  const [toStart, setToStart] = useState("");
  const [toEnd, setToEnd] = useState("");
  const [toReason, setToReason] = useState("");
  const [toLoading, setToLoading] = useState(false);
  const [toError, setToError] = useState<string | null>(null);
  const [toSuccess, setToSuccess] = useState(false);

  function toggleDay(wd: number) {
    setSelectedDays((prev) =>
      prev.includes(wd) ? prev.filter((d) => d !== wd) : [...prev, wd]
    );
  }

  async function handleSaveHours() {
    setWError(null);
    setWSuccess(false);
    if (selectedDays.length === 0) { setWError("Выберите хотя бы один день"); return; }
    const startMin = timeToMin(wdStart);
    const endMin = timeToMin(wdEnd);
    if (endMin <= startMin) { setWError("Конец должен быть позже начала"); return; }

    setWLoading(true);
    for (const weekday of selectedDays) {
      const res = await upsertWorkingHoursAction({ weekday, startMin, endMin });
      if (!res.ok) { setWError(res.error); setWLoading(false); return; }
    }
    setWLoading(false);
    setWSuccess(true);
    router.refresh();
    setTimeout(() => setWSuccess(false), 2000);
  }

  async function handleDeleteHours() {
    setWError(null);
    if (selectedDays.length === 0) { setWError("Выберите дни для удаления"); return; }
    setWLoading(true);
    for (const weekday of selectedDays) {
      const res = await deleteWorkingHoursAction(weekday);
      if (!res.ok) { setWError(res.error); setWLoading(false); return; }
    }
    setWLoading(false);
    router.refresh();
  }

  async function handleCreateTimeOff() {
    setToError(null);
    setToSuccess(false);
    if (!toStart || !toEnd) { setToError("Укажите начало и конец"); return; }
    setToLoading(true);
    const startsAtIso = new Date(toStart).toISOString();
    const endsAtIso = new Date(toEnd).toISOString();
    const res = await createTimeOffAction({ startsAt: startsAtIso, endsAt: endsAtIso, reason: toReason || undefined });
    setToLoading(false);
    if (!res.ok) { setToError(res.error); return; }
    setToSuccess(true);
    setToStart(""); setToEnd(""); setToReason("");
    router.refresh();
    setTimeout(() => setToSuccess(false), 2000);
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <div className="flex gap-2 mb-5">
        <button
          className={`text-sm font-medium px-4 py-1.5 rounded-full transition-colors ${activeTab === "hours" ? "bg-mocha text-white" : "text-mocha/50 hover:text-mocha"}`}
          onClick={() => setActiveTab("hours")}
        >
          Рабочие часы
        </button>
        <button
          className={`text-sm font-medium px-4 py-1.5 rounded-full transition-colors ${activeTab === "timeoff" ? "bg-mocha text-white" : "text-mocha/50 hover:text-mocha"}`}
          onClick={() => setActiveTab("timeoff")}
        >
          Добавить отгул
        </button>
      </div>

      {activeTab === "hours" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map(({ n, label }) => (
              <button
                key={n}
                onClick={() => toggleDay(n)}
                className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${selectedDays.includes(n) ? "bg-mocha text-white" : "bg-porcelain text-mocha/50 hover:text-mocha"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-3 items-center">
            <Input type="time" value={wdStart} onChange={(e) => setWdStart(e.target.value)} className="w-32" />
            <span className="text-sm text-mocha/40">—</span>
            <Input type="time" value={wdEnd} onChange={(e) => setWdEnd(e.target.value)} className="w-32" />
          </div>
          {wError && <p role="alert" className="text-xs text-destructive">{wError}</p>}
          {wSuccess && <p className="text-xs text-green-600">Сохранено!</p>}
          <div className="flex gap-2">
            <Button onClick={handleSaveHours} disabled={wLoading} className="rounded-full flex-1">
              {wLoading ? "…" : "Сохранить"}
            </Button>
            <Button onClick={handleDeleteHours} disabled={wLoading} variant="outline" className="rounded-full text-destructive border-destructive/30">
              Удалить
            </Button>
          </div>
        </div>
      )}

      {activeTab === "timeoff" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-mocha/50 mb-1 block">Начало</label>
              <Input type="datetime-local" value={toStart} onChange={(e) => setToStart(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-mocha/50 mb-1 block">Конец</label>
              <Input type="datetime-local" value={toEnd} onChange={(e) => setToEnd(e.target.value)} />
            </div>
          </div>
          <Textarea
            placeholder="Причина (необязательно)"
            value={toReason}
            onChange={(e) => setToReason(e.target.value)}
            rows={2}
            className="resize-none text-sm"
          />
          {toError && <p role="alert" className="text-xs text-destructive">{toError}</p>}
          {toSuccess && <p className="text-xs text-green-600">Отгул добавлен!</p>}
          <Button onClick={handleCreateTimeOff} disabled={toLoading} className="rounded-full w-full" type="button">
            {toLoading ? "…" : "Добавить отгул"}
          </Button>
        </div>
      )}
    </div>
  );
}
