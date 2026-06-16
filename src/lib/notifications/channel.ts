import "server-only";

export interface NotificationPayload {
  to: string;
  subject: string;
  html: string;
}

export interface NotificationChannel {
  send(payload: NotificationPayload): Promise<void>;
}
