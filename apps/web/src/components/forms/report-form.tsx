"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { OptionSelect } from "@/components/forms/option-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFileUpload } from "@/hooks/use-file-upload";
import { ApiError, api } from "@/lib/api";
import { CATEGORIES } from "@/lib/constants";
import { dateInputToIso } from "@/lib/format";
import { reportSchema, type ReportValues } from "@/lib/schemas";
import type { Item } from "@/types";

export function ReportForm() {
  const router = useRouter();
  const search = useSearchParams();
  const initialType = search.get("type") === "found" ? "found" : "lost";
  const [pending, setPending] = useState(false);
  const [{ files, errors, isDragging }, { getInputProps, openFileDialog, removeFile, handleDragEnter, handleDragLeave, handleDragOver, handleDrop }] =
    useFileUpload({
      accept: "image/jpeg,image/png,image/webp",
      maxFiles: 1,
      maxSize: 5 * 1024 * 1024,
      multiple: false,
    });

  const form = useForm<ReportValues>({
    resolver: zodResolver(reportSchema) as Resolver<ReportValues>,
    defaultValues: {
      title: "",
      type: initialType,
      category: "Electronics",
      description: "",
      location: "",
      eventDate: "",
      identifyingDetails: "",
      contactPreference: "in_app",
      notes: "",
    },
  });

  async function onSubmit(values: ReportValues) {
    setPending(true);
    try {
      const body = new FormData();
      body.set("title", values.title);
      body.set("type", values.type);
      body.set("category", values.category);
      body.set("description", values.description);
      body.set("location", values.location);
      body.set("eventDate", dateInputToIso(values.eventDate));
      body.set("identifyingDetails", values.identifyingDetails ?? "");
      body.set("contactPreference", values.contactPreference);
      body.set("notes", values.notes ?? "");
      const file = files[0]?.file;
      if (file instanceof File) body.set("image", file);
      const result = await api<Item>("/items", { method: "POST", body });
      toast.success("Report submitted. An administrator will review it before it appears publicly.");
      router.push(`/items/${result.data.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "The report could not be saved.");
    } finally {
      setPending(false);
    }
  }

  const selected = files[0];

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Item name" error={form.formState.errors.title?.message}>
          <Input {...form.register("title")} aria-invalid={Boolean(form.formState.errors.title)} />
        </Field>
        <Field label="Report type" error={form.formState.errors.type?.message}>
          <OptionSelect
            value={form.watch("type")}
            onChange={(value) => form.setValue("type", value as ReportValues["type"], { shouldValidate: true })}
            options={[
              { value: "lost", label: "Lost" },
              { value: "found", label: "Found" },
            ]}
            placeholder="Lost or found"
            invalid={Boolean(form.formState.errors.type)}
          />
        </Field>
        <Field label="Category" error={form.formState.errors.category?.message}>
          <OptionSelect
            value={form.watch("category")}
            onChange={(value) => form.setValue("category", value as ReportValues["category"], { shouldValidate: true })}
            options={CATEGORIES.map((category) => ({ value: category, label: category }))}
            placeholder="Choose a category"
          />
        </Field>
        <Field label="Date lost or found" error={form.formState.errors.eventDate?.message}>
          <Input type="date" {...form.register("eventDate")} aria-invalid={Boolean(form.formState.errors.eventDate)} />
        </Field>
      </div>
      <Field label="Location" error={form.formState.errors.location?.message}>
        <Input {...form.register("location")} placeholder="Library entrance, hostel gate, cafeteria" />
      </Field>
      <Field label="Description" error={form.formState.errors.description?.message}>
        <Textarea rows={4} {...form.register("description")} />
      </Field>
      <Field label="Identifying details" error={form.formState.errors.identifyingDetails?.message}>
        <Textarea rows={3} {...form.register("identifyingDetails")} placeholder="Optional. Visible to you and administrators, not on public cards." />
      </Field>
      <Field label="Additional notes" error={form.formState.errors.notes?.message}>
        <Textarea rows={3} {...form.register("notes")} placeholder="Optional private notes." />
      </Field>
      <Field label="Contact preference">
        <OptionSelect
          value={form.watch("contactPreference")}
          onChange={(value) => form.setValue("contactPreference", value as ReportValues["contactPreference"])}
          options={[
            { value: "in_app", label: "Through FindIt claims" },
            { value: "email", label: "Email through campus staff" },
          ]}
          placeholder="How should someone reach you?"
        />
        <p className="text-xs text-muted-foreground">Your email address is not shown on the public listing.</p>
      </Field>
      <div className="space-y-2">
        <Label>Item image</Label>
        <div
          className={`border border-dashed px-4 py-8 text-center ${isDragging ? "border-foreground bg-muted" : "border-border bg-card"}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input {...getInputProps()} className="sr-only" />
          <p className="text-sm text-muted-foreground">JPEG, PNG, or WebP. Up to 5 MB.</p>
          <Button type="button" variant="outline" className="mt-3" onClick={openFileDialog}>
            Choose image
          </Button>
          {selected ? (
            <div className="mt-4 flex items-center justify-center gap-3 text-sm">
              <span>{selected.file.name}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(selected.id)}>
                Remove
              </Button>
            </div>
          ) : null}
          {errors[0] ? <p className="mt-2 text-sm text-destructive">{errors[0]}</p> : null}
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Submitting..." : "Submit report"}
      </Button>
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
