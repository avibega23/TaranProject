import { Suspense } from "react";
import { BrowseResults } from "@/components/items/browse-results";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Discover"
        title="Browse items"
        description="Public results are approved reports. Search and filters run on the server."
      />
      <Suspense>
        <BrowseLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function BrowseLoader({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const flat: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(params)) {
    flat[key] = Array.isArray(value) ? value[0] : value;
  }
  return <BrowseResults initialParams={flat} />;
}
