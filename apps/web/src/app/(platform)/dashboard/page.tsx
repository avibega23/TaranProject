"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ItemCard, ItemCardSkeleton } from "@/components/items/item-card";
import { ErrorState, EmptyState } from "@/components/items/state-panels";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ApiError, api } from "@/lib/api";
import { activityLabel, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardSummary } from "@/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await api<DashboardSummary>("/dashboard/summary");
      setData(result.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The dashboard could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const counts = [
    { label: "My lost reports", value: data?.lostReports },
    { label: "My found reports", value: data?.foundReports },
    { label: "Active claims", value: data?.activeClaims },
    { label: user?.role === "admin" ? "Pending claims" : "Decisions waiting", value: data?.pendingDecisions },
    { label: "Resolved reports", value: data?.resolvedReports },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Dashboard"
        title={user ? `Hello, ${user.name.split(" ")[0]}` : "Dashboard"}
        description="Counts and activity come from your account. Nothing here is estimated."
        actions={
          <>
            <Link href="/report-item?type=lost" className={cn(buttonVariants())}>Report Lost Item</Link>
            <Link href="/report-item?type=found" className={cn(buttonVariants({ variant: "outline" }))}>Report Found Item</Link>
            <Link href="/browse" className={cn(buttonVariants({ variant: "outline" }))}>Browse Items</Link>
            <Link href="/my-reports" className={cn(buttonVariants({ variant: "ghost" }))}>View My Reports</Link>
          </>
        }
      />
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {counts.map((count) => (
          <div key={count.label} className="border border-border bg-white p-4">
            <p className="text-2xl font-medium">{loading ? "…" : count.value ?? 0}</p>
            <p className="mt-1 text-sm text-muted-foreground">{count.label}</p>
          </div>
        ))}
      </div>
      <section className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <h2 className="text-lg font-medium">Recent reports</h2>
          {loading ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <ItemCardSkeleton />
              <ItemCardSkeleton />
            </div>
          ) : data && data.recentItems.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {data.recentItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState title="No reports yet" description="When you report a lost or found item, it will show up here." />
            </div>
          )}
        </div>
        <div>
          <h2 className="text-lg font-medium">Recent activity</h2>
          {loading ? <div className="mt-4 h-40 animate-pulse bg-muted" /> : null}
          {!loading && data && data.recentActivity.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No activity yet.</p>
          ) : null}
          <ul className="mt-4 divide-y divide-border border border-border bg-white">
            {data?.recentActivity.map((entry) => (
              <li key={entry.id} className="px-4 py-3">
                <p className="text-sm">{activityLabel(entry.action)}</p>
                <p className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
