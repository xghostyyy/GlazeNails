"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateStudioSettingsAction } from "@/lib/admin/actions";

interface Defaults {
  slotGranularity: number;
  bufferAfterMin: number;
  minLeadHours: number;
  maxAdvanceDays: number;
  cancelCutoffH: number;
  reschedCutoffH: number;
}

export function SettingsForm({ defaults }: { defaults: Defaults }) {
  const router = useRouter();
  const [vals, setVals] = useState(defaults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function set(key: keyof Defaults) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setVals((v) => ({ ...v, [key]: Number(e.target.value) }));
  }

  async function handleSave() {
    setError(null);
    setLoading(true);
    const res = await updateStudioSettingsAction(vals);
    setLoading(false);
    if (!res.ok) { setError(res.error); return; }
    setSuccess(true);
    router.refresh();
    setTimeout(() => setSuccess(false), 2000);
  }

  const fields: { key: keyof Defaults; label: string; min: number; max: number; unit: string }[] = [
    { key: "slotGranularity", label: "Шаг сетки слотов", min: 5, max: 120, unit: "мин" },
    { key: "bufferAfterMin", label: "Буфер между записями", min: 0, max: 120, unit: "мин" },
    { key: "minLeadHours", label: "Минимальное время до записи", min: 0, max: 72, unit: "ч" },
    { key: "maxAdvanceDays", label: "Горизонт записи вперёд", min: 1, max: 365, unit: "дней" },
    { key: "cancelCutoffH", label: "Отмена не позднее чем за", min: 0, max: 168, unit: "ч" },
    { key: "reschedCutoffH", label: "Перенос не позднее чем за", min: 0, max: 168, unit: "ч" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
      {fields.map(({ key, label, min, max, unit }) => (
        <div key={key} className="flex items-center justify-between gap-4">
          <label className="text-sm text-mocha flex-1">{label}</label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={vals[key]}
              onChange={set(key)}
              min={min}
              max={max}
              className="w-24 text-center"
            />
            <span className="text-xs text-mocha/40 w-8">{unit}</span>
          </div>
        </div>
      ))}

      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      {success && <p className="text-xs text-green-600">Настройки сохранены!</p>}

      <Button onClick={handleSave} disabled={loading} className="rounded-full w-full">
        {loading ? "…" : "Сохранить"}
      </Button>
    </div>
  );
}
