"use client";

import { useEffect, useState } from "react";
import { ItemFilters } from "@/components/items/item-filters";
import { ItemCard, ItemCardSkeleton } from "@/components/items/item-card";
import { ListPagination } from "@/components/items/list-pagination";
import { EmptyState, ErrorState } from "@/components/items/state-panels";
import { ApiError, api } from "@/lib/api";
import type { Item, Pagination } from "@/types";

export function BrowseResults({ initialParams }: { initialParams: Record<string, string | undefined> }) {
  const [items, setItems] = useState<Item[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryKey = JSON.stringify(initialParams);

  async function load() {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(initialParams)) {
      if (value) params.set(key, value);
    }
    if (!params.get("limit")) params.set("limit", "12");
    try {
      const result = await api<Item[]>(`/items?${params.toString()}`);
      setItems(result.data);
      setPagination(result.pagination ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // queryKey captures the current filters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  function hrefForPage(page: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(initialParams)) {
      if (value && key !== "page") params.set(key, value);
    }
    params.set("page", String(page));
    return `/browse?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <ItemFilters searchParams={initialParams} />
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ItemCardSkeleton />
          <ItemCardSkeleton />
          <ItemCardSkeleton />
        </div>
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState
          title="No matching reports"
          description="Nothing public matches these filters. Try another word, or clear the filters."
        />
      ) : null}
      {!loading && items.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : null}
      {pagination ? <ListPagination pagination={pagination} hrefForPage={hrefForPage} /> : null}
    </div>
  );
}
