"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createServiceAction } from "@/lib/admin/actions";

const CATEGORIES = [
  { value: "MANICURE", label: "Маникюр" },
  { value: "PEDICURE", label: "Педикюр" },
  { value: "DESIGN", label: "Дизайн" },
  { value: "EXTENSION", label: "Наращивание" },
  { value: "REMOVAL", label: "Снятие" },
] as const;

export function ServiceForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<typeof CATEGORIES[number]["value"]>("MANICURE");
  const [description, setDescription] = useState("");
  const [durationMin, setDurationMin] = useState(60);
  const [priceRub, setPriceRub] = useState(1000);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    const res = await createServiceAction({ name, category, description: description || undefined, durationMin, priceCents: priceRub * 100, isActive: true });
    setLoading(false);
    if (!res.ok) { setError(res.error); return; }
    setSuccess(true);
    setName(""); setCategory("MANICURE"); setDescription(""); setDurationMin(60); setPriceRub(1000);
    router.refresh();
    setTimeout(() => setSuccess(false), 2000);
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-mocha/50 mb-1 block">Название *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Маникюр классик" />
        </div>
        <div>
          <label className="text-xs text-mocha/50 mb-1 block">Категория *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof CATEGORIES[number]["value"])}
            className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background text-foreground"
          >
            {CATEGORIES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-mocha/50 mb-1 block">Описание</label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="resize-none text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-mocha/50 mb-1 block">Длительность (мин)</label>
          <Input type="number" value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))} min={15} max={480} />
        </div>
        <div>
          <label className="text-xs text-mocha/50 mb-1 block">Цена (₽)</label>
          <Input type="number" value={priceRub} onChange={(e) => setPriceRub(Number(e.target.value))} min={0} />
        </div>
      </div>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      {success && <p className="text-xs text-green-600">Услуга создана!</p>}
      <Button onClick={handleSubmit} disabled={loading} className="rounded-full w-full">
        {loading ? "…" : "Создать услугу"}
      </Button>
    </div>
  );
}
