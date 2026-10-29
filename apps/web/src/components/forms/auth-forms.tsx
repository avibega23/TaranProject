"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { ApiError, api } from "@/lib/api";
import { loginSchema, registerSchema, type LoginValues, type RegisterValues } from "@/lib/schemas";
import type { User } from "@/types";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { refresh } = useAuth();
  const [pending, setPending] = useState(false);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema) as Resolver<LoginValues>,
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setPending(true);
    try {
      await api<{ user: User }>("/auth/login", { method: "POST", body: JSON.stringify(values) });
      await refresh();
      toast.success("Signed in.");
      router.push(search.get("next") || "/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Sign in failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <Field label="College email" error={form.formState.errors.email?.message}>
        <Input type="email" autoComplete="email" {...form.register("email")} />
      </Field>
      <Field label="Password" error={form.formState.errors.password?.message}>
        <Input type="password" autoComplete="current-password" {...form.register("password")} />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </Button>
      <p className="text-sm text-muted-foreground">
        New here? <Link href="/register" className="text-foreground underline">Create an account</Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [pending, setPending] = useState(false);
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema) as Resolver<RegisterValues>,
    defaultValues: { name: "", email: "", studentId: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: RegisterValues) {
    setPending(true);
    try {
      await api<{ user: User }>("/auth/register", { method: "POST", body: JSON.stringify(values) });
      await refresh();
      toast.success("Account created.");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      const details = error instanceof ApiError ? error.details : undefined;
      details?.forEach((detail) => {
        if (detail.path in values) form.setError(detail.path as keyof RegisterValues, { message: detail.message });
      });
      toast.error(error instanceof ApiError ? error.message : "Registration failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <Field label="Full name" error={form.formState.errors.name?.message}>
        <Input autoComplete="name" {...form.register("name")} />
      </Field>
      <Field label="College email" error={form.formState.errors.email?.message}>
        <Input type="email" autoComplete="email" {...form.register("email")} />
      </Field>
      <Field label="Student ID" error={form.formState.errors.studentId?.message}>
        <Input {...form.register("studentId")} />
      </Field>
      <Field label="Password" error={form.formState.errors.password?.message}>
        <Input type="password" autoComplete="new-password" {...form.register("password")} />
      </Field>
      <Field label="Confirm password" error={form.formState.errors.confirmPassword?.message}>
        <Input type="password" autoComplete="new-password" {...form.register("confirmPassword")} />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account..." : "Create account"}
      </Button>
      <p className="text-sm text-muted-foreground">
        Already registered? <Link href="/login" className="text-foreground underline">Sign in</Link>
      </p>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2 text-sm">
      <Label>{label}</Label>
      {children}
      {error ? <span className="text-destructive">{error}</span> : null}
    </label>
  );
}
