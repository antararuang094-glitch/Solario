# Solario.id

Platform kalkulator ROI solar panel + lead generation untuk pasar Indonesia.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env file
#    (.env dibaca oleh Next.js DAN Prisma; .env.local opsional untuk override per-developer)
cp .env.example .env

# 3. Setup database (generate Prisma client + buat dev.db + jalankan migrasi)
npx prisma migrate dev --name init

# 4. Run dev server
npm run dev
```

Buka:
- **Landing:** http://localhost:3000
- **Kalkulator:** http://localhost:3000/kalkulator
- **Partner Installer:** http://localhost:3000/partner-installer
- **Admin Login:** http://localhost:3000/admin

**Default kredensial admin:** `admin` / `solario2026` (ubah di `.env`)

## Fitur

- ✅ Landing page dengan hero, how-it-works, social proof live
- ✅ Solar ROI calculator (tarif PLN 2024, PSH per kota, biaya pasar)
- ✅ Recharts proyeksi kumulatif 25 tahun dengan BEP marker
- ✅ Lead capture form dengan verifikasi OTP via WhatsApp (dev: console & toast)
- ✅ Halaman pendaftaran installer
- ✅ Admin dashboard: kelola leads & installer, filter, search, update status, catatan
- ✅ Email notif lead baru (Nodemailer; fallback `console.log` jika SMTP kosong)
- ✅ Cookie-based admin session (HMAC-SHA256 via Web Crypto, Edge-compatible)

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS (custom design system, no shadcn dep)
- **Database:** SQLite via Prisma (file `prisma/dev.db`)
- **Form:** React Hook Form + Zod
- **Chart:** Recharts
- **Email:** Nodemailer (fallback `console.log` jika SMTP kosong)

## Struktur

```
app/             Next.js App Router pages + API routes
components/      Komponen UI dan business
lib/             Business logic (solar-calc, prisma, auth, validations, otp)
prisma/          Database schema + migrations
middleware.ts    Auth gate untuk /admin/dashboard/*
```

## OTP di Development

- OTP 6 digit di-generate random, disimpan di tabel `OTPSession` (expire 2 menit).
- Di mode `NODE_ENV=development`, OTP di-log ke console server (`[OTP] Untuk ...: 123456`).
- Server juga mengembalikan `devOtp` di response API agar UI bisa menampilkan toast untuk testing cepat.
- Setelah 3x salah, nomor diblokir 5 menit (in-memory).
- Untuk production: hapus `devOtp` di response dan integrasi dengan Twilio/Wavecell.

## Migrasi ke PostgreSQL (Production)

Ganti `provider = "sqlite"` jadi `provider = "postgresql"` di `prisma/schema.prisma`, set `DATABASE_URL` ke Postgres connection string, lalu:

```bash
npx prisma migrate dev
```

## Deploy ke Vercel

1. Push repo ke GitHub.
2. Import di Vercel.
3. Set env variables (lihat `.env.example`).
4. **Wajib** ganti SQLite → Postgres (Vercel filesystem read-only).
5. Set `ADMIN_SESSION_SECRET` ke random string panjang.

## Logika Kalkulator

Inti perhitungan di [`lib/solar-calc.ts`](lib/solar-calc.ts). Asumsi:

- **Tarif PLN 2024** per golongan (R1, R2, R3, B1, B2).
- **Peak Sun Hours (PSH)** per kota (Jakarta 4.8, Surabaya 5.2, Bali 5.5, dst).
- **Performance ratio** 0.80 (degradasi panel, inverter losses, dirt, wiring).
- **Biaya instalasi** Rp 10–15 juta/kWp (range pasar Indonesia 2024).
- **Degradasi tahunan** 0.5% (rata-rata industri).
- **CO₂ factor** 0.709 kg/kWh (PLN grid factor Indonesia).

## Lisensi

Internal use. Tidak untuk distribusi publik tanpa izin.
