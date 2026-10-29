import Link from "next/link";
import { BackgroundLines } from "@/components/ui/background-lines";
import { buttonVariants } from "@/components/ui/button";
import { ItemCard } from "@/components/items/item-card";
import { EXAMPLE_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { serverApiOrigin } from "@/lib/api";
import type { Item, PublicStats } from "@/types";

const steps = [
  { title: "Report a lost or found item.", text: "Describe what happened, where it was, and any private details that should stay off the public card." },
  { title: "Discover possible matches.", text: "FindIt compares the opposite kind of report using category, words, location, and date. The score is a similarity estimate." },
  { title: "Submit a claim and arrange a safe return.", text: "A claim stays private until the reporter or an administrator reviews it." },
];

const features = [
  { title: "Searchable item listings", text: "Filter public reports by words, type, category, location, and date." },
  { title: "Lost and found reports", text: "Students file either kind of report. New listings wait for review before they are public." },
  { title: "Potential matching suggestions", text: "A documented rules engine explains why two reports look related." },
  { title: "Claim requests", text: "Ask to recover a found item and follow the decision in your account." },
  { title: "Verified report management", text: "Administrators approve, reject, resolve, or archive reports. Each action is recorded." },
];

export async function HomePage() {
  const snapshot = await loadSnapshot();
  return (
    <div>
      <BackgroundLines className="min-h-[38rem]" svgOptions={{ duration: 14 }}>
        <div className="relative z-10 mx-auto flex min-h-[38rem] max-w-6xl flex-col justify-center px-4 py-20 sm:px-6">
          <p className="text-sm text-muted-foreground">Campus lost and found</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-medium tracking-tight text-[#171717] sm:text-6xl sm:leading-[1.05]">
            Lost something? Find your way back to it.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#3f3f3f]">
            A simpler way to reunite lost belongings with their owners. Report an item, discover reported belongings, and help make your campus a little more connected.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/report-item" className={cn(buttonVariants({ size: "lg" }))}>
              Report an Item
            </Link>
            <Link href="/browse" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
              Browse Items
            </Link>
          </div>
        </div>
      </BackgroundLines>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-medium tracking-tight">What a listing looks like</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {snapshot.items.length > 0
                ? "These are current public reports from the database."
                : "No public reports yet. The cards below are an example of the listing layout, not live campus records."}
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {(snapshot.items.length > 0 ? snapshot.items : EXAMPLE_ITEMS).map((item) => (
            <ItemCard key={item.id} item={item} example={snapshot.items.length === 0} />
          ))}
        </div>
      </section>

      <section id="how-it-works" className="border-y border-border bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title}>
              <p className="text-sm text-muted-foreground">0{index + 1}</p>
              <h2 className="mt-3 text-xl font-medium tracking-tight">{step.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-medium tracking-tight">What you can do</h2>
        <div className="mt-8 grid gap-px border border-border bg-border md:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.title} className="bg-[#FAFAF8] p-6">
              <h3 className="font-medium">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#171717] text-[#FAFAF8]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-3">
          <Stat label="Open lost reports" value={snapshot.error ? "—" : String(snapshot.stats.lost)} />
          <Stat label="Open found reports" value={snapshot.error ? "—" : String(snapshot.stats.found)} />
          <Stat label="Marked returned" value={snapshot.error ? "—" : String(snapshot.stats.resolved)} />
        </div>
        <p className="mx-auto max-w-6xl px-4 pb-10 text-sm text-[#bdbdbd] sm:px-6">
          {snapshot.error
            ? "Live counts are unavailable until the API and database are connected."
            : "Counts come from the database. Zero means there are no matching reports yet."}
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-4xl font-medium tracking-tight">{value}</p>
      <p className="mt-2 text-sm text-[#bdbdbd]">{label}</p>
    </div>
  );
}

async function loadSnapshot(): Promise<{ items: Item[]; stats: PublicStats; error: boolean }> {
  const origin = serverApiOrigin();
  try {
    const [statsResponse, itemsResponse] = await Promise.all([
      fetch(`${origin}/api/items/stats`, { cache: "no-store" }),
      fetch(`${origin}/api/items?limit=3`, { cache: "no-store" }),
    ]);
    if (!statsResponse.ok || !itemsResponse.ok) {
      return { items: [], stats: { lost: 0, found: 0, resolved: 0 }, error: true };
    }
    const statsJson = (await statsResponse.json()) as { data: PublicStats };
    const itemsJson = (await itemsResponse.json()) as { data: Item[] };
    return { items: itemsJson.data ?? [], stats: statsJson.data, error: false };
  } catch {
    return { items: [], stats: { lost: 0, found: 0, resolved: 0 }, error: true };
  }
}
