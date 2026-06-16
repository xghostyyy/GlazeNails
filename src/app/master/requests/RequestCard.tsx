"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateAppointmentStatusAction } from "@/lib/master/actions";

interface Props {
  appointmentId: string;
  serviceName: string;
  clientName: string;
  startsAt: string;
  durationMin: number;
  clientNote?: string;
  priceCents: number;
}

export function RequestCard({ appointmentId, serviceName, clientName, startsAt, durationMin, clientNote, priceCents }: Props) {
  const router = useRouter();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [masterNote, setMasterNote] = useState("");
  const [loading, setLoading] = useState<"confirm" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading("confirm");
    const res = await updateAppointmentStatusAction({ appointmentId, status: "CONFIRMED" });
    setLoading(null);
    if (res.ok) { router.refresh(); } else { setError(res.error); }
  }

  async function handleReject() {
    if (!masterNote.trim()) { setError("Укажите причину отклонения"); return; }
    setLoading("reject");
    const res = await updateAppointmentStatusAction({ appointmentId, status: "REJECTED", masterNote });
    setLoading(null);
    if (res.ok) { router.refresh(); } else { setError(res.error); }
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-border shadow-[var(--shadow-card)]">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-semibold text-mocha">{serviceName}</p>
          <p className="text-sm text-mocha/60">{clientName}</p>
        </div>
        <p className="text-sm font-semibold text-mocha">{(priceCents / 100).toLocaleString("ru-RU")} ₽</p>
      </div>
      <p className="text-sm text-mocha/70 mb-1">{startsAt} · {durationMin} мин</p>
      {clientNote && (
        <p className="text-sm text-mocha/50 italic mb-3">&ldquo;{clientNote}&rdquo;</p>
      )}

      {error && <p role="alert" className="text-xs text-destructive mb-2">{error}</p>}

      {!rejectOpen ? (
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            className="flex-1 rounded-full text-destructive border-destructive/30"
            onClick={() => setRejectOpen(true)}
          >
            Отклонить
          </Button>
          <Button
            className="flex-1 rounded-full"
            onClick={handleConfirm}
            disabled={loading === "confirm"}
          >
            {loading === "confirm" ? "…" : "Подтвердить"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3 mt-3">
          <Textarea
            placeholder="Причина отклонения (обязательно)"
            value={masterNote}
            onChange={(e) => setMasterNote(e.target.value)}
            rows={2}
            className="resize-none text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => { setRejectOpen(false); setMasterNote(""); }} className="text-mocha/50">
              Отмена
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-full"
              onClick={handleReject}
              disabled={loading === "reject"}
            >
              {loading === "reject" ? "…" : "Подтвердить отклонение"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
