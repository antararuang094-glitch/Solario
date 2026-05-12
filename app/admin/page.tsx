"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { adminLoginSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { Sun, Lock } from "lucide-react";
import { useToast } from "@/components/ui/toast";

type FormData = z.infer<typeof adminLoginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        toast(err.error || "Login gagal", "error");
        return;
      }
      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      toast("Koneksi error", "error");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-surface">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#0d3b2e] flex items-center justify-center text-white">
            <Sun className="w-6 h-6" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-ink">
            Solario<span className="text-[#16a34a]">.id</span> Admin
          </h1>
          <p className="mt-1 text-sm text-subtext">Login untuk mengelola leads dan installer</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm space-y-4"
        >
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              autoComplete="username"
              placeholder="admin"
              {...register("username")}
              error={!!errors.username}
            />
            <FieldError message={errors.username?.message} />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password")}
              error={!!errors.password}
            />
            <FieldError message={errors.password?.message} />
          </div>

          <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
            <Lock className="w-4 h-4" />
            Masuk
          </Button>
        </form>

        <p className="mt-6 text-xs text-subtext text-center">
          Default dev credential: <code className="bg-white border border-[#e5e7eb] rounded px-1.5 py-0.5">admin</code> / <code className="bg-white border border-[#e5e7eb] rounded px-1.5 py-0.5">solario2026</code>
        </p>
      </div>
    </main>
  );
}
