import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Escape HTML metacharacters to prevent injection in email templates.
 * Lead/installer-supplied strings (nama, kota, budgetRange, etc.) MUST
 * be passed through this before being interpolated into HTML email.
 */
export function escapeHtml(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return "";
  const s = String(input);
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function hasSmtpConfig(): boolean {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

// Cache transporter at module scope so we don't pay TLS handshake on every send
let cachedTransporter: Transporter | null = null;
function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;
  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return cachedTransporter;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!hasSmtpConfig()) {
    // Dev/preview only — do NOT log payload content in production even if
    // SMTP is misconfigured, to avoid leaking lead PII to deployment logs.
    if (process.env.NODE_ENV !== "production") {
      console.log("[EMAIL FALLBACK]", {
        to: payload.to,
        subject: payload.subject,
      });
    } else {
      console.error("[EMAIL] SMTP not configured in production — dropping email.");
    }
    return;
  }

  await getTransporter().sendMail({
    from: process.env.SMTP_USER,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });
}

/**
 * Resolve admin notification email. In production we hard-fail if
 * ADMIN_EMAIL is not set, because the fallback (admin@solario.id) is
 * not guaranteed to be monitored and would silently swallow leads.
 */
function getAdminEmail(): string {
  const configured = process.env.ADMIN_EMAIL;
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[email] ADMIN_EMAIL is required in production. Configure it in your environment."
    );
  }
  return "admin@solario.id";
}

export async function notifyAdminNewLead(lead: {
  nama: string;
  telepon: string;
  kota: string;
  budgetRange: string;
  tagihanListrik: number;
  estimasiHemat: number;
}): Promise<void> {
  const adminEmail = getAdminEmail();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://solario.id";
  const adminUrl = `${appUrl}/admin`;
  // Every interpolated value is escaped to prevent HTML injection from
  // user-controlled fields (nama, kota, budgetRange).
  const html = `
    <h2>Lead Baru Masuk - Solario.id</h2>
    <table style="border-collapse:collapse">
      <tr><td><b>Nama</b></td><td>${escapeHtml(lead.nama)}</td></tr>
      <tr><td><b>WhatsApp</b></td><td>${escapeHtml(lead.telepon)}</td></tr>
      <tr><td><b>Kota</b></td><td>${escapeHtml(lead.kota)}</td></tr>
      <tr><td><b>Budget</b></td><td>${escapeHtml(lead.budgetRange)}</td></tr>
      <tr><td><b>Tagihan/bln</b></td><td>Rp ${escapeHtml(lead.tagihanListrik.toLocaleString("id-ID"))}</td></tr>
      <tr><td><b>Estimasi Hemat/bln</b></td><td>Rp ${escapeHtml(lead.estimasiHemat.toLocaleString("id-ID"))}</td></tr>
    </table>
    <p>Login admin: <a href="${escapeHtml(adminUrl)}">${escapeHtml(adminUrl)}</a></p>
  `;
  await sendEmail({
    to: adminEmail,
    subject: `[Solario] Lead baru: ${lead.nama} (${lead.kota})`,
    html,
  });
}
