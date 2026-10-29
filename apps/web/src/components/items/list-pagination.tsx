import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { Pagination as PageInfo } from "@/types";

export function ListPagination({
  pagination,
  hrefForPage,
}: {
  pagination: PageInfo;
  hrefForPage: (page: number) => string;
}) {
  if (pagination.totalPages <= 1) return null;
  const pages = visiblePages(pagination.page, pagination.totalPages);
  return (
    <Pagination className="mt-8">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={pagination.page > 1 ? hrefForPage(pagination.page - 1) : hrefForPage(1)}
            aria-disabled={pagination.page <= 1}
            className={pagination.page <= 1 ? "pointer-events-none opacity-40" : undefined}
          />
        </PaginationItem>
        {pages.map((page) => (
          <PaginationItem key={page}>
            <PaginationLink href={hrefForPage(page)} isActive={page === pagination.page}>
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href={pagination.page < pagination.totalPages ? hrefForPage(pagination.page + 1) : hrefForPage(pagination.totalPages)}
            aria-disabled={pagination.page >= pagination.totalPages}
            className={pagination.page >= pagination.totalPages ? "pointer-events-none opacity-40" : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function visiblePages(current: number, total: number): number[] {
  const start = Math.max(1, current - 2);
  const end = Math.min(total, start + 4);
  const pages: number[] = [];
  for (let page = Math.max(1, end - 4); page <= end; page += 1) pages.push(page);
  return pages;
}
