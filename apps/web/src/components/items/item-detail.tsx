"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { StatusBadge, TypeBadge } from "@/components/items/status-badge";
import { ErrorState } from "@/components/items/state-panels";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { ApiError, api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { claimSchema, type ClaimValues } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import type { Item, Match } from "@/types";

export function ItemDetail({ id }: { id: string }) {
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimOpen, setClaimOpen] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [itemResult, matchResult] = await Promise.all([
        api<Item>(`/items/${id}`),
        api<Match[]>(`/items/${id}/matches`),
      ]);
      setItem(itemResult.data);
      setMatches(matchResult.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "This report could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div className="h-64 animate-pulse bg-muted" />;
  if (error || !item) return <ErrorState message={error || "Item not found."} onRetry={() => void load()} />;

  const canClaim = item.type === "found" && item.status === "approved" && user && user.id !== item.reporterId;

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <article className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <TypeBadge type={item.type} />
          <StatusBadge status={item.status} />
        </div>
        <h1 className="text-4xl font-medium tracking-tight">{item.title}</h1>
        <p className="text-base leading-7 text-muted-foreground">{item.description}</p>
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" className="max-h-80 w-full border border-border object-cover" />
        ) : null}
        <dl className="grid gap-4 border border-border bg-white p-5 text-sm sm:grid-cols-2">
          <Info label="Category" value={item.category} />
          <Info label="Location" value={item.location} />
          <Info label="Date" value={formatDate(item.eventDate)} />
          <Info label="Contact" value={item.contactPreference === "in_app" ? "Through FindIt" : "Email via campus staff"} />
        </dl>
        {item.identifyingDetails ? (
          <p className="text-sm text-muted-foreground">Private identifying details: {item.identifyingDetails}</p>
        ) : null}
        {canClaim ? (
          <Button type="button" onClick={() => setClaimOpen(true)}>
            Submit a claim
          </Button>
        ) : null}
        {item.type === "found" && item.status === "approved" && !user ? (
          <Link href={`/login?next=/items/${item.id}`} className={cn(buttonVariants())}>
            Sign in to claim
          </Link>
        ) : null}
      </article>
      <aside>
        <h2 className="text-lg font-medium">Possible matches</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Scores are heuristic similarity estimates, not the probability of a successful recovery.
        </p>
        <div className="mt-4 space-y-3">
          {matches.length === 0 ? <p className="text-sm text-muted-foreground">No candidates passed the minimum score.</p> : null}
          {matches.map((match) => (
            <Link key={match.item.id} href={`/items/${match.item.id}`} className="block border border-border bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{match.item.title}</p>
                <span className="text-sm">{Math.round(match.score * 100)}%</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{match.label}</p>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {match.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </Link>
          ))}
        </div>
      </aside>
      <ClaimDialog itemId={item.id} open={claimOpen} onOpenChange={setClaimOpen} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}

function ClaimDialog({
  itemId,
  open,
  onOpenChange,
}: {
  itemId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const form = useForm<ClaimValues>({
    resolver: zodResolver(claimSchema) as Resolver<ClaimValues>,
    defaultValues: { explanation: "", proofDescription: "" },
  });
  const [pending, setPending] = useState(false);

  async function onSubmit(values: ClaimValues) {
    setPending(true);
    try {
      await api(`/items/${itemId}/claims`, { method: "POST", body: JSON.stringify(values) });
      toast.success("Claim submitted.");
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "The claim could not be submitted.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Claim this item</DialogTitle>
          <DialogDescription>Your explanation is visible to the reporter and administrators. Proof details stay private from other students.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <label className="block space-y-2 text-sm">
            <Label>Why is this yours?</Label>
            <Textarea rows={4} {...form.register("explanation")} />
            {form.formState.errors.explanation ? <span className="text-destructive">{form.formState.errors.explanation.message}</span> : null}
          </label>
          <label className="block space-y-2 text-sm">
            <Label>Private proof description</Label>
            <Textarea rows={3} {...form.register("proofDescription")} />
          </label>
          <DialogFooter>
            <Button type="submit" disabled={pending}>{pending ? "Submitting..." : "Submit claim"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
