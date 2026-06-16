"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { moderateReviewAction } from "@/lib/admin/actions";

interface Props {
  id: string;
  clientName: string;
  masterName: string;
  serviceName: string;
  rating: number;
  text?: string;
  isPublished: boolean;
  createdAt: string;
}

export function ReviewModerationCard({ id, clientName, masterName, serviceName, rating, text, isPublished, createdAt }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(isPublished);

  async function toggle() {
    setLoading(true);
    const res = await moderateReviewAction({ id, isPublished: !published });
    setLoading(false);
    if (res.ok) { setPublished(!published); router.refresh(); }
  }

  return (
    <div className={`bg-white rounded-2xl p-5 border ${published ? "border-border" : "border-champagne/60"}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-medium text-mocha">{clientName}</p>
          <p className="text-xs text-mocha/40">{serviceName} · {masterName} · {createdAt}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-champagne">{"★".repeat(rating)}{"☆".repeat(5 - rating)}</span>
          {!published && <span className="text-xs bg-champagne/40 text-mocha/70 px-2 py-0.5 rounded-full">Скрыт</span>}
        </div>
      </div>
      {text && <p className="text-sm text-mocha/70 italic mb-3">&ldquo;{text}&rdquo;</p>}
      <Button
        size="sm"
        variant={published ? "outline" : "default"}
        className="rounded-full text-xs"
        onClick={toggle}
        disabled={loading}
      >
        {loading ? "…" : published ? "Скрыть" : "Опубликовать"}
      </Button>
    </div>
  );
}
