import { ItemDetail } from "@/components/items/item-detail";

export const dynamic = "force-dynamic";

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <ItemDetail id={id} />
    </div>
  );
}
