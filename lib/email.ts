import nodemailer from "nodemailer";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function hasSmtpConfig(): boolean {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!hasSmtpConfig()) {
    console.log("[EMAIL FALLBACK]", {
      to: payload.to,
      subject: payload.subject,
      text: payload.text ?? payload.html,
    });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });
}

export async function notifyAdminNewLead(lead: {
  nama: string;
  telepon: string;
  kota: string;
  budgetRange: string;
  tagihanListrik: number;
  estimasiHemat: number;
}): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@solario.id";
  const html = `
    <h2>Lead Baru Masuk - Solario.id</h2>
    <table style="border-collapse:collapse">
      <tr><td><b>Nama</b></td><td>${lead.nama}</td></tr>
      <tr><td><b>WhatsApp</b></td><td>${lead.telepon}</td></tr>
      <tr><td><b>Kota</b></td><td>${lead.kota}</td></tr>
      <tr><td><b>Budget</b></td><td>${lead.budgetRange}</td></tr>
      <tr><td><b>Tagihan/bln</b></td><td>Rp ${lead.tagihanListrik.toLocaleString("id-ID")}</td></tr>
      <tr><td><b>Estimasi Hemat/bln</b></td><td>Rp ${lead.estimasiHemat.toLocaleString("id-ID")}</td></tr>
    </table>
    <p>Login admin: <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin">${process.env.NEXT_PUBLIC_APP_URL}/admin</a></p>
  `;
  await sendEmail({
    to: adminEmail,
    subject: `[Solario] Lead baru: ${lead.nama} (${lead.kota})`,
    html,
  });
}
