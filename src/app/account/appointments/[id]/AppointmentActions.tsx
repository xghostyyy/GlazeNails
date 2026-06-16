"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cancelAppointmentAction, createReviewAction } from "@/lib/appointments/actions";

interface Props {
  appointmentId: string;
  masterId: string;
  serviceId: string;
  canModify: boolean;
  canReview: boolean;
}

export function AppointmentActions({ appointmentId, canModify, canReview }: Props) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    if (!confirm("Отменить запись?")) return;
    setCancelling(true);
    const res = await cancelAppointmentAction({ appointmentId });
    setCancelling(false);
    if (res.ok) {
      router.push("/account?cancelled=1");
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  async function handleReview() {
    setSubmitting(true);
    setError(null);
    const res = await createReviewAction({ appointmentId, rating, text: reviewText || undefined });
    setSubmitting(false);
    if (res.ok) {
      router.refresh();
      setReviewOpen(false);
    } else {
      setError(res.error);
    }
  }

  if (!canModify && !canReview) return null;

  return (
    <div className="border-t border-border pt-4 space-y-3">
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {canModify && (
        <Button
          variant="outline"
          className="w-full rounded-full text-destructive border-destructive/30 hover:bg-destructive/5"
          onClick={handleCancel}
          disabled={cancelling}
        >
          {cancelling ? "Отменяем…" : "Отменить запись"}
        </Button>
      )}

      {canReview && !reviewOpen && (
        <Button
          className="w-full rounded-full"
          onClick={() => setReviewOpen(true)}
        >
          Оставить отзыв
        </Button>
      )}

      {canReview && reviewOpen && (
        <div className="space-y-4 bg-muted/30 rounded-2xl p-4">
          <p className="font-medium text-sm text-mocha">Ваша оценка</p>

          {/* Star rating */}
          <div className="flex gap-2" role="group" aria-label="Выберите оценку">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                aria-label={`${star} звезда`}
                aria-pressed={star <= rating}
                className={`text-2xl transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-champagne
                  ${star <= rating ? "text-champagne" : "text-mocha/20"}`}
              >
                ★
              </button>
            ))}
          </div>

          <Textarea
            placeholder="Расскажи, как прошёл визит…"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={3}
            maxLength={1000}
            className="resize-none"
          />

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setReviewOpen(false)} className="text-mocha/50">
              Отмена
            </Button>
            <Button onClick={handleReview} disabled={submitting} className="flex-1 rounded-full">
              {submitting ? "Отправляем…" : "Отправить отзыв"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
