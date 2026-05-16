"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { leadSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { OTPInput } from "@/components/OTPInput";
import { KOTA_OPTIONS } from "@/lib/solar-calc";
import { useToast } from "@/components/ui/toast";
import { Check, ShieldCheck } from "lucide-react";

const formSchema = leadSchema.omit({
  tagihanListrik: true,
  estimasiHemat: true,
  sistemKwp: true,
});

type FormData = z.infer<typeof formSchema>;

interface LeadFormProps {
  kota: string;
  tagihanListrik: number;
  estimasiHemat: number;
  sistemKwp: number;
}

export function LeadForm({
  kota,
  tagihanListrik,
  estimasiHemat,
  sistemKwp,
}: LeadFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [otpStep, setOtpStep] = React.useState<"idle" | "sent" | "verified">("idle");
  const [otp, setOtp] = React.useState("");
  const [otpSending, setOtpSending] = React.useState(false);
  const [otpVerifying, setOtpVerifying] = React.useState(false);
  const [secondsLeft, setSecondsLeft] = React.useState(0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: "",
      telepon: "",
      email: "",
      kota: kota || "Jakarta",
      budgetRange: "15-30 juta",
      timeline: "1-3 bulan",
    },
  });

  const telepon = watch("telepon");

  React.useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const handleSendOtp = async () => {
    if (!telepon || telepon.length < 9) {
      toast("Isi nomor WhatsApp dulu", "error");
      return;
    }
    setOtpSending(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telepon }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Gagal kirim OTP", "error");
        return;
      }
      setOtpStep("sent");
      setSecondsLeft(120);
      if (data.devOtp) {
        toast(`OTP dev: ${data.devOtp} (cek juga console server)`, "info");
      } else {
        toast("OTP dikirim. Cek WhatsApp Anda.", "success");
      }
    } catch {
      toast("Koneksi error", "error");
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast("Masukkan 6 digit OTP", "error");
      return;
    }
    setOtpVerifying(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telepon, otp }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        toast(data.error || "OTP salah", "error");
        return;
      }
      setOtpStep("verified");
      toast("Nomor terverifikasi", "success");
    } catch {
      toast("Koneksi error", "error");
    } finally {
      setOtpVerifying(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (otpStep !== "verified") {
      toast("Verifikasi nomor WhatsApp dulu", "error");
      return;
    }
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          tagihanListrik,
          estimasiHemat,
          sistemKwp,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast(result.error || "Gagal mengirim data", "error");
        return;
      }
      router.push("/terima-kasih");
    } catch {
      toast("Koneksi error", "error");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nama">Nama lengkap</Label>
          <Input id="nama" placeholder="Nama Anda" {...register("nama")} error={!!errors.nama} />
          <FieldError message={errors.nama?.message} />
        </div>
        <div>
          <Label htmlFor="kota-lead">Kota</Label>
          <Select id="kota-lead" {...register("kota")} error={!!errors.kota}>
            {KOTA_OPTIONS.filter((k) => k !== "Kota lainnya").map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
            <option value="Kota lainnya">Kota lainnya</option>
          </Select>
          <FieldError message={errors.kota?.message} />
        </div>
      </div>

      <div>
        <Label htmlFor="telepon">Nomor WhatsApp</Label>
        <div className="flex gap-2">
          <Input
            id="telepon"
            type="tel"
            placeholder="08123456789"
            {...register("telepon")}
            disabled={otpStep === "verified"}
            error={!!errors.telepon}
            className="flex-1"
          />
          {otpStep === "verified" ? (
            <div className="inline-flex items-center gap-1.5 px-4 h-12 rounded-xl bg-[#f0fdf4] text-[#16a34a] text-sm font-medium border border-[#16a34a]/30">
              <ShieldCheck className="w-4 h-4" />
              Terverifikasi
            </div>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={handleSendOtp}
              loading={otpSending}
              disabled={otpStep === "sent" && secondsLeft > 0}
              className="shrink-0"
            >
              {otpStep === "sent" && secondsLeft > 0
                ? `Kirim ulang (${secondsLeft}s)`
                : otpStep === "sent"
                ? "Kirim ulang"
                : "Kirim OTP"}
            </Button>
          )}
        </div>
        <FieldError message={errors.telepon?.message} />
      </div>

      {otpStep === "sent" ? (
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 space-y-3">
          <div>
            <Label>Masukkan 6 digit OTP</Label>
            <p className="text-xs text-subtext mb-2">
              Berlaku 2 menit. Di mode development OTP juga di-log ke console server.
            </p>
            <OTPInput value={otp} onChange={setOtp} />
          </div>
          <Button
            type="button"
            onClick={handleVerifyOtp}
            loading={otpVerifying}
            disabled={otp.length !== 6}
          >
            <Check className="w-4 h-4" />
            Verifikasi OTP
          </Button>
        </div>
      ) : null}

      <div>
        <Label htmlFor="email">Email (opsional)</Label>
        <Input id="email" type="email" placeholder="email@contoh.com" {...register("email")} error={!!errors.email} />
        <FieldError message={errors.email?.message} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="budgetRange">Budget instalasi</Label>
          <Select id="budgetRange" {...register("budgetRange")} error={!!errors.budgetRange}>
            <option value="< 15 juta">&lt; 15 juta</option>
            <option value="15-30 juta">15–30 juta</option>
            <option value="30-50 juta">30–50 juta</option>
            <option value="> 50 juta">&gt; 50 juta</option>
          </Select>
          <FieldError message={errors.budgetRange?.message} />
        </div>
        <div>
          <Label htmlFor="timeline">Kapan rencana pasang?</Label>
          <Select id="timeline" {...register("timeline")} error={!!errors.timeline}>
            <option value="< 1 bulan">&lt; 1 bulan</option>
            <option value="1-3 bulan">1–3 bulan</option>
            <option value="3-6 bulan">3–6 bulan</option>
            <option value="masih riset">Masih riset</option>
          </Select>
          <FieldError message={errors.timeline?.message} />
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        loading={isSubmitting}
        disabled={otpStep !== "verified" || isSubmitting}
        className="w-full sm:w-auto"
      >
        {isSubmitting ? "Mengirim..." : "Hubungkan Saya dengan Installer"}
      </Button>
      <p className="text-xs text-subtext leading-relaxed">
        Dengan submit, Anda setuju dihubungi installer terverifikasi via WhatsApp. Data Anda aman dan tidak dijual ke pihak lain.
      </p>
    </form>
  );
}
