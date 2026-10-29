"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { ApiError, api } from "@/lib/api";
import { profileSchema } from "@/lib/schemas";
import type { User } from "@/types";

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [pending, setPending] = useState(false);
  const form = useForm<{ name: string }>({
    resolver: zodResolver(profileSchema) as Resolver<{ name: string }>,
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (user) form.reset({ name: user.name });
  }, [user, form]);

  async function onSubmit(values: { name: string }) {
    setPending(true);
    try {
      await api<{ user: User }>("/users/me", { method: "PATCH", body: JSON.stringify({ name: values.name }) });
      await refresh();
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "The profile could not be updated.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <PageHeader eyebrow="Account" title="Profile" description="Your role is assigned by the system. Students cannot change it." />
      <dl className="space-y-3 border border-border bg-white p-5 text-sm">
        <Row label="Email" value={user?.email} />
        <Row label="Student ID" value={user?.studentId} />
        <Row label="Role" value={user?.role} />
      </dl>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <label className="block space-y-2 text-sm">
          <Label>Full name</Label>
          <Input {...form.register("name")} />
          {form.formState.errors.name ? <span className="text-destructive">{form.formState.errors.name.message}</span> : null}
        </label>
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save name"}</Button>
      </form>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value || "—"}</dd>
    </div>
  );
}
