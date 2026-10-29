import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-[#FAFAF8]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="text-lg font-medium">FindIt</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            A campus lost and found for reporting belongings, comparing possible
            matches, and arranging a careful return.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-medium">Explore</p>
          <Link
            href="/browse"
            className="block text-muted-foreground hover:text-foreground"
          >
            Browse items
          </Link>
          <Link
            href="/#how-it-works"
            className="block text-muted-foreground hover:text-foreground"
          >
            How it works
          </Link>
          <Link
            href="/report-item"
            className="block text-muted-foreground hover:text-foreground"
          >
            Report an item
          </Link>
        </div>
      </div>
    </footer>
  );
}
