"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/items/status-badge";
import { EmptyState, ErrorState } from "@/components/items/state-panels";
import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Claim } from "@/types";

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [status, setStatus] = useState("pending");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(nextStatus = status) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "30" });
      if (nextStatus) params.set("status", nextStatus);
      const result = await api<Claim[]>(`/admin/claims?${params.toString()}`);
      setClaims(result.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Claims could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function review(id: string, decision: "approve" | "reject") {
    try {
      await api(`/admin/claims/${id}/review`, {
        method: "PATCH",
        body: JSON.stringify({ decision }),
      });
      toast.success(decision === "approve" ? "Claim approved." : "Claim rejected.");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Review failed.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Administration" title="Claim review" description="Approving a claim marks the found item as returned." />
      <div className="flex gap-2">
        {["pending", "approved", "rejected", "cancelled", ""].map((value) => (
          <Button
            key={value || "all"}
            type="button"
            size="sm"
            variant={status === value ? "secondary" : "outline"}
            onClick={() => {
              setStatus(value);
              void load(value);
            }}
          >
            {value || "All"}
          </Button>
        ))}
      </div>
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {loading ? <div className="h-32 animate-pulse bg-muted" /> : null}
      {!loading && claims.length === 0 ? <EmptyState title="No claims" description="Nothing is waiting in this status." /> : null}
      <div className="space-y-3">
        {claims.map((claim) => (
          <article key={claim.id} className="border border-border bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link href={`/items/${claim.itemId}`} className="font-medium hover:underline">{claim.itemTitle || "Item"}</Link>
              <StatusBadge status={claim.status} />
            </div>
            <p className="mt-2 text-sm">{claim.explanation}</p>
            {claim.proofDescription ? <p className="mt-2 text-sm text-muted-foreground">Private proof: {claim.proofDescription}</p> : null}
            <p className="mt-2 text-xs text-muted-foreground">{formatDate(claim.createdAt)}</p>
            {claim.status === "pending" ? (
              <div className="mt-4 flex gap-2">
                <Button type="button" size="sm" onClick={() => void review(claim.id, "approve")}>Approve</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => void review(claim.id, "reject")}>Reject</Button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
