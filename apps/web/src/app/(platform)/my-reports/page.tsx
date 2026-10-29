"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { ItemCard, ItemCardSkeleton } from "@/components/items/item-card";
import { EmptyState, ErrorState } from "@/components/items/state-panels";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError, api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Item } from "@/types";

export default function MyReportsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await api<Item[]>("/users/me/items?limit=50");
      setItems(result.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reports could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function archive() {
    if (!pendingId) return;
    setArchiving(true);
    try {
      await api(`/items/${pendingId}`, { method: "DELETE" });
      toast.success("Report archived.");
      setPendingId(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "The report could not be archived.");
    } finally {
      setArchiving(false);
    }
  }

  const lost = items.filter((item) => item.type === "lost");
  const found = items.filter((item) => item.type === "found");

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Account"
        title="My reports"
        description="Pending reports stay off the public browse page until they are approved."
        actions={<Link href="/report-item" className={cn(buttonVariants())}>New report</Link>}
      />
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      <Tabs defaultValue="lost">
        <TabsList>
          <TabsTrigger value="lost">Lost</TabsTrigger>
          <TabsTrigger value="found">Found</TabsTrigger>
        </TabsList>
        <TabsContent value="lost" className="mt-6">
          <ReportGrid items={lost} loading={loading} empty="You have not reported a lost item." onArchive={setPendingId} />
        </TabsContent>
        <TabsContent value="found" className="mt-6">
          <ReportGrid items={found} loading={loading} empty="You have not reported a found item." onArchive={setPendingId} />
        </TabsContent>
      </Tabs>
      <ConfirmDialog
        open={Boolean(pendingId)}
        title="Archive this report?"
        description="Archived reports leave public listings and keep their history."
        confirmLabel="Archive"
        destructive
        pending={archiving}
        onOpenChange={(open) => { if (!open) setPendingId(null); }}
        onConfirm={() => void archive()}
      />
    </div>
  );
}

function ReportGrid({
  items,
  loading,
  empty,
  onArchive,
}: {
  items: Item[];
  loading: boolean;
  empty: string;
  onArchive: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <ItemCardSkeleton />
        <ItemCardSkeleton />
      </div>
    );
  }
  if (items.length === 0) return <EmptyState title="Nothing here" description={empty} />;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <div key={item.id} className="space-y-3">
          <ItemCard item={item} />
          {item.status !== "archived" ? (
            <Button type="button" variant="outline" size="sm" onClick={() => onArchive(item.id)}>
              Archive
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
