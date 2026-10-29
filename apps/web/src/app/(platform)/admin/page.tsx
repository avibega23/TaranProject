"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/items/state-panels";
import { ApiError, api } from "@/lib/api";
import { activityLabel, formatDate } from "@/lib/format";
import type { AdminOverview } from "@/types";

export default function AdminHomePage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const result = await api<AdminOverview>("/admin/overview");
      setData(result.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The overview could not be loaded.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const cards = data
    ? [
        ["Pending reports", data.pendingReports],
        ["Approved reports", data.approvedReports],
        ["Rejected reports", data.rejectedReports],
        ["Resolved reports", data.resolvedReports],
        ["Pending claims", data.pendingClaims],
        ["Open lost", data.openLost],
        ["Open found", data.openFound],
      ]
    : [];

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Administration" title="Overview" description="Every number is counted from stored reports and claims." />
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={String(label)} className="border border-border bg-white p-4">
            <p className="text-2xl font-medium">{value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <section>
        <h2 className="text-lg font-medium">Recent moderation activity</h2>
        <ul className="mt-4 divide-y divide-border border border-border bg-white">
          {data?.recentActivity.map((entry) => (
            <li key={entry.id} className="px-4 py-3 text-sm">
              <span>{activityLabel(entry.action)}</span>
              <span className="ml-2 text-muted-foreground">{formatDate(entry.createdAt)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
