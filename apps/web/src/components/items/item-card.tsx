import Link from "next/link";
import { StatusBadge, TypeBadge } from "@/components/items/status-badge";
import { formatDate } from "@/lib/format";
import type { Item } from "@/types";

export function ItemCard({ item, example = false }: { item: Item; example?: boolean }) {
  const body = (
    <article className="flex h-full flex-col border border-border bg-card p-5 transition-colors hover:border-[#cfcfcb]">
      <div className="flex items-center justify-between gap-3">
        <TypeBadge type={item.type} />
        <StatusBadge status={item.status} />
      </div>
      <h3 className="mt-4 text-lg font-medium tracking-tight">{item.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
      <dl className="mt-5 space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Category</dt>
          <dd>{item.category}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Location</dt>
          <dd className="text-right">{item.location}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Date</dt>
          <dd>{formatDate(item.eventDate)}</dd>
        </div>
      </dl>
    </article>
  );

  if (example) return body;
  return (
    <Link href={`/items/${item.id}`} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {body}
    </Link>
  );
}

export function ItemCardSkeleton() {
  return (
    <div className="space-y-4 border border-border bg-card p-5">
      <div className="flex justify-between">
        <div className="h-5 w-16 animate-pulse bg-muted" />
        <div className="h-5 w-20 animate-pulse bg-muted" />
      </div>
      <div className="h-6 w-2/3 animate-pulse bg-muted" />
      <div className="h-12 animate-pulse bg-muted" />
      <div className="h-16 animate-pulse bg-muted" />
    </div>
  );
}
