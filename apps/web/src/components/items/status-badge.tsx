import { Badge } from "@/components/ui/badge";
import { titleCase } from "@/lib/format";
import type { ClaimStatus, ItemStatus, ItemType } from "@/types";

const itemStyles: Record<ItemStatus, string> = {
  pending: "border-[#e6d7b8] bg-[#fbf6ee] text-[#7a5b24]",
  approved: "border-[#d5e4d8] bg-[#f3f8f4] text-[#246143]",
  rejected: "border-[#ead7d7] bg-[#faf4f4] text-[#8f3d3d]",
  resolved: "border-[#d9d9d6] bg-[#f6f6f4] text-[#171717]",
  archived: "border-border bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: ItemStatus | ClaimStatus }) {
  const style = status in itemStyles ? itemStyles[status as ItemStatus] : "border-border bg-muted text-foreground";
  return (
    <Badge variant="outline" className={style}>
      {titleCase(status)}
    </Badge>
  );
}

export function TypeBadge({ type }: { type: ItemType }) {
  return (
    <Badge variant="outline" className="border-border bg-white text-foreground">
      {type === "lost" ? "Lost" : "Found"}
    </Badge>
  );
}
