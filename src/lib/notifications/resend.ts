import "server-only";
import type { NotificationChannel, NotificationPayload } from "./channel";

class ResendChannel implements NotificationChannel {
  private readonly apiKey: string;
  private readonly from: string;

  constructor(apiKey: string, from: string) {
    this.apiKey = apiKey;
    this.from = from;
  }

  async send(payload: NotificationPayload): Promise<void> {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[resend] failed to send email:", res.status, body);
    }
  }
}

let channel: NotificationChannel | null = null;

export function getEmailChannel(): NotificationChannel {
  if (!channel) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM ?? "Glaze Studio <noreply@glaze.studio>";
    if (!apiKey) {
      // No-op channel for local dev without Resend configured
      channel = { async send(p) { console.log("[email no-op]", p.to, p.subject); } };
    } else {
      channel = new ResendChannel(apiKey, from);
    }
  }
  return channel;
}
