"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateAppointmentStatusAction } from "@/lib/master/actions";

export function MarkDoneButton({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function mark(status: "COMPLETED" | "NO_SHOW") {
    setLoading(status);
    await updateAppointmentStatusAction({ appointmentId, status });
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex gap-1">
      <Button size="sm" variant="ghost" className="text-xs text-mocha/60 h-7 px-2" onClick={() => mark("COMPLETED")} disabled={!!loading}>
        {loading === "COMPLETED" ? "…" : "✓ Выполнено"}
      </Button>
      <Button size="sm" variant="ghost" className="text-xs text-mocha/40 h-7 px-2" onClick={() => mark("NO_SHOW")} disabled={!!loading}>
        {loading === "NO_SHOW" ? "…" : "✗ Не пришёл"}
      </Button>
    </div>
  );
}
