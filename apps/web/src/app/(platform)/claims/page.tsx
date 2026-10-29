"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/items/status-badge";
import { EmptyState, ErrorState } from "@/components/items/state-panels";
import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Claim } from "@/types";

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [incoming, setIncoming] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [mine, decisions] = await Promise.all([
        api<Claim[]>("/claims/mine?limit=50"),
        api<Claim[]>("/users/me/incoming-claims"),
      ]);
      setClaims(mine.data);
      setIncoming(decisions.data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setIncoming([]);
      } else {
        setError(err instanceof ApiError ? err.message : "Claims could not be loaded.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function cancel() {
    if (!cancelId) return;
    setPending(true);
    try {
      await api(`/claims/${cancelId}/cancel`, { method: "PATCH" });
      toast.success("Claim cancelled.");
      setCancelId(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "The claim could not be cancelled.");
    } finally {
      setPending(false);
    }
  }

  async function review(id: string, decision: "approve" | "reject") {
    try {
      await api(`/claims/${id}/review`, { method: "PATCH", body: JSON.stringify({ decision }) });
      toast.success(decision === "approve" ? "Claim approved and item marked returned." : "Claim rejected.");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "The claim could not be reviewed.");
    }
  }

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Account" title="Claims" description="Your claims, and decisions waiting on items you reported." />
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">My claims</h2>
        {loading ? <div className="h-24 animate-pulse bg-muted" /> : null}
        {!loading && claims.length === 0 ? <EmptyState title="No claims yet" description="Open a found item and submit a claim if you believe it is yours." /> : null}
        <div className="divide-y divide-border border border-border bg-white">
          {claims.map((claim) => (
            <div key={claim.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link href={`/items/${claim.itemId}`} className="font-medium hover:underline">{claim.itemTitle || "Reported item"}</Link>
                <p className="mt-1 text-sm text-muted-foreground">{claim.explanation}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(claim.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={claim.status} />
                {claim.status === "pending" ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => setCancelId(claim.id)}>Cancel</Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Decisions on my found items</h2>
        {!loading && incoming.length === 0 ? <p className="text-sm text-muted-foreground">No pending claims on your found reports.</p> : null}
        <div className="space-y-3">
          {incoming.map((claim) => (
            <div key={claim.id} className="border border-border bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{claim.itemTitle || "Found item"}</p>
                <StatusBadge status={claim.status} />
              </div>
              <p className="mt-2 text-sm">{claim.explanation}</p>
              {claim.proofDescription ? <p className="mt-2 text-sm text-muted-foreground">Private proof: {claim.proofDescription}</p> : null}
              <div className="mt-4 flex gap-2">
                <Button type="button" size="sm" onClick={() => void review(claim.id, "approve")}>Approve</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => void review(claim.id, "reject")}>Reject</Button>
              </div>
            </div>
          ))}
        </div>
      </section>
      <ConfirmDialog
        open={Boolean(cancelId)}
        title="Cancel this claim?"
        description="A cancelled claim cannot be approved later. You can submit a new one if the item is still open."
        confirmLabel="Cancel claim"
        destructive
        pending={pending}
        onOpenChange={(open) => { if (!open) setCancelId(null); }}
        onConfirm={() => void cancel()}
      />
    </div>
  );
}
