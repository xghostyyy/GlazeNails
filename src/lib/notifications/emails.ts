import "server-only";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { getEmailChannel } from "./resend";

const STUDIO_NAME = "Glaze Studio";
const BASE_URL = process.env.NEXTAUTH_URL ?? "https://glaze.studio";

function wrap(title: string, body: string): string {
  return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family:sans-serif;background:#FAF6F3;margin:0;padding:32px 16px">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;border:1px solid #e5e0db">
<h1 style="font-size:22px;color:#5E4F4B;margin:0 0 16px">${title}</h1>
${body}
<hr style="border:none;border-top:1px solid #e5e0db;margin:24px 0">
<p style="font-size:12px;color:#9e9490;margin:0">${STUDIO_NAME} · Все записи: <a href="${BASE_URL}/account" style="color:#5E4F4B">${BASE_URL}/account</a></p>
</div></body></html>`;
}

function p(text: string) {
  return `<p style="color:#5E4F4B;font-size:15px;line-height:1.5;margin:0 0 12px">${text}</p>`;
}

function btn(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:#5E4F4B;color:#fff;border-radius:999px;padding:12px 24px;text-decoration:none;font-size:14px;font-weight:600;margin-top:8px">${label}</a>`;
}

export async function sendNewBookingToMaster(opts: {
  masterEmail: string;
  masterName: string;
  clientName: string;
  serviceName: string;
  startsAt: Date;
  appointmentId: string;
}) {
  const ch = getEmailChannel();
  const dateStr = format(opts.startsAt, "d MMMM yyyy, HH:mm", { locale: ru });
  await ch.send({
    to: opts.masterEmail,
    subject: `Новая запись: ${opts.clientName} — ${dateStr}`,
    html: wrap(
      "Новая запись",
      p(`Клиент <strong>${opts.clientName}</strong> хочет записаться на <strong>${opts.serviceName}</strong>.`) +
      p(`Дата: <strong>${dateStr}</strong>`) +
      btn(`${BASE_URL}/master/requests`, "Перейти к запросам"),
    ),
  });
}

export async function sendConfirmedToClient(opts: {
  clientEmail: string;
  clientName: string;
  masterName: string;
  serviceName: string;
  startsAt: Date;
}) {
  const ch = getEmailChannel();
  const dateStr = format(opts.startsAt, "d MMMM yyyy, HH:mm", { locale: ru });
  await ch.send({
    to: opts.clientEmail,
    subject: `Запись подтверждена — ${dateStr}`,
    html: wrap(
      "Запись подтверждена ✓",
      p(`Привет, <strong>${opts.clientName}</strong>!`) +
      p(`Мастер <strong>${opts.masterName}</strong> подтвердил вашу запись на <strong>${opts.serviceName}</strong>.`) +
      p(`Ждём вас: <strong>${dateStr}</strong>`) +
      btn(`${BASE_URL}/account`, "Мои записи"),
    ),
  });
}

export async function sendRejectedToClient(opts: {
  clientEmail: string;
  clientName: string;
  masterName: string;
  serviceName: string;
  startsAt: Date;
  masterNote?: string;
}) {
  const ch = getEmailChannel();
  const dateStr = format(opts.startsAt, "d MMMM yyyy, HH:mm", { locale: ru });
  await ch.send({
    to: opts.clientEmail,
    subject: `Запись отклонена`,
    html: wrap(
      "Запись отклонена",
      p(`Привет, <strong>${opts.clientName}</strong>!`) +
      p(`К сожалению, мастер <strong>${opts.masterName}</strong> не может принять вас ${dateStr} на <strong>${opts.serviceName}</strong>.`) +
      (opts.masterNote ? p(`Причина: <em>${opts.masterNote}</em>`) : "") +
      btn(`${BASE_URL}/booking`, "Выбрать другое время"),
    ),
  });
}

export async function sendReminder24h(opts: {
  clientEmail: string;
  clientName: string;
  masterName: string;
  serviceName: string;
  startsAt: Date;
}) {
  const ch = getEmailChannel();
  const dateStr = format(opts.startsAt, "d MMMM yyyy, HH:mm", { locale: ru });
  await ch.send({
    to: opts.clientEmail,
    subject: `Напоминание: завтра запись в ${format(opts.startsAt, "HH:mm")}`,
    html: wrap(
      "Напоминание о записи",
      p(`Привет, <strong>${opts.clientName}</strong>!`) +
      p(`Напоминаем о вашей записи: <strong>${opts.serviceName}</strong> у мастера <strong>${opts.masterName}</strong>.`) +
      p(`Время: <strong>${dateStr}</strong>`) +
      btn(`${BASE_URL}/account`, "Посмотреть детали"),
    ),
  });
}

export async function sendReviewRequest(opts: {
  clientEmail: string;
  clientName: string;
  masterName: string;
  serviceName: string;
  appointmentId: string;
}) {
  const ch = getEmailChannel();
  await ch.send({
    to: opts.clientEmail,
    subject: `Как прошёл визит? Оставьте отзыв`,
    html: wrap(
      "Как вам визит?",
      p(`Привет, <strong>${opts.clientName}</strong>!`) +
      p(`Вы посетили <strong>${opts.serviceName}</strong> у мастера <strong>${opts.masterName}</strong>.`) +
      p("Нам важно ваше мнение — оставьте отзыв, это займёт 30 секунд.") +
      btn(`${BASE_URL}/account/appointments/${opts.appointmentId}`, "Оставить отзыв"),
    ),
  });
}
