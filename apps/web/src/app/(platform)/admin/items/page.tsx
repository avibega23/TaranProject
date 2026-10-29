"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge, TypeBadge } from "@/components/items/status-badge";
import { ErrorState, EmptyState } from "@/components/items/state-panels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError, api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Activity, Item } from "@/types";

export default function AdminItemsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [history, setHistory] = useState<Activity[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(nextQ = q, nextStatus = status) {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ limit: "20" });
    if (nextQ) params.set("q", nextQ);
    if (nextStatus) params.set("status", nextStatus);
    try {
      const result = await api<Item[]>(`/admin/items?${params.toString()}`);
      setItems(result.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reports could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function moderate(id: string, action: "approve" | "reject" | "archive" | "resolve") {
    try {
      await api(`/admin/items/${id}/moderation`, { method: "PATCH", body: JSON.stringify({ action }) });
      toast.success(`Report marked ${action}.`);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Moderation failed.");
    }
  }

  async function showHistory(id: string) {
    setSelected(id);
    try {
      const result = await api<Activity[]>(`/admin/history/item/${id}`);
      setHistory(result.data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "History could not be loaded.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Administration" title="Reports" description="Approve a report to make it public. Reject, archive, or mark it returned when the case is finished." />
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void load();
        }}
      >
        <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search reports" aria-label="Search reports" />
        <select
          className="h-8 border border-input bg-white px-2 text-sm"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Status"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="resolved">Resolved</option>
          <option value="archived">Archived</option>
        </select>
        <Button type="submit">Apply</Button>
      </form>
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {loading ? <div className="h-40 animate-pulse bg-muted" /> : null}
      {!loading && items.length === 0 ? <EmptyState title="No reports" description="Nothing matches this search." /> : null}
      {items.length > 0 ? (
        <div className="border border-border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link href={`/items/${item.id}`} className="font-medium hover:underline">{item.title}</Link>
                    <div className="mt-1"><TypeBadge type={item.type} /></div>
                  </TableCell>
                  <TableCell><StatusBadge status={item.status} /></TableCell>
                  <TableCell>{formatDate(item.eventDate)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" onClick={() => void moderate(item.id, "approve")}>Approve</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => void moderate(item.id, "reject")}>Reject</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => void moderate(item.id, "resolve")}>Resolve</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => void moderate(item.id, "archive")}>Archive</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => void showHistory(item.id)}>History</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
      {selected ? (
        <div className="border border-border bg-white p-4">
          <h2 className="text-sm font-medium">History</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {history.length === 0 ? <li>No recorded actions.</li> : null}
            {history.map((entry) => (
              <li key={entry.id}>{entry.action} · {formatDate(entry.createdAt)}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
