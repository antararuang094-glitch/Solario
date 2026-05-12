-- CreateTable
CREATE TABLE "Lead" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "telepon" TEXT NOT NULL,
    "teleponVerified" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT,
    "kota" TEXT NOT NULL,
    "provinsi" TEXT,
    "budgetRange" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "tagihanListrik" INTEGER NOT NULL,
    "estimasiHemat" INTEGER NOT NULL,
    "sistemKwp" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Baru',
    "installerTarget" TEXT,
    "catatan" TEXT,
    "source" TEXT NOT NULL DEFAULT 'kalkulator',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Installer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "namaPerusahaan" TEXT NOT NULL,
    "picNama" TEXT NOT NULL,
    "picTelepon" TEXT NOT NULL,
    "picEmail" TEXT,
    "kota" TEXT NOT NULL,
    "provinsi" TEXT NOT NULL,
    "cakupanKota" TEXT NOT NULL,
    "kapasitasBulan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "catatan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OTPSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "telepon" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
