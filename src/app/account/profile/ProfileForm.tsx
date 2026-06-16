"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateProfileAction } from "@/lib/auth/actions";

export function ProfileForm({ defaultName, defaultPhone }: { defaultName: string; defaultPhone: string }) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setError(null);
    setSuccess(false);
    setLoading(true);
    const res = await updateProfileAction({ name, phone: phone || undefined });
    setLoading(false);
    if (!res.ok) { setError(res.error); return; }
    setSuccess(true);
    router.refresh();
    setTimeout(() => setSuccess(false), 2500);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Имя</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ваше имя"
          maxLength={80}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Телефон</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+7 900 000-00-00"
          maxLength={20}
        />
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">Данные сохранены!</p>}
      <Button
        onClick={handleSave}
        disabled={loading || !name.trim()}
        className="w-full rounded-full"
      >
        {loading ? "Сохраняем…" : "Сохранить"}
      </Button>
    </div>
  );
}
