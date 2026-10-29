"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Filters } from "@/components/reui/filters/filters";
import type { FilterField, FilterQuery, FilterRule } from "@/components/reui/filters/filters-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES } from "@/lib/constants";

const fields: FilterField<string>[] = [
  {
    id: "type",
    label: "Type",
    type: "select",
    defaultOperator: "is",
    operators: [{ value: "is", label: "is" }],
    options: [
      { value: "lost", label: "Lost" },
      { value: "found", label: "Found" },
    ],
  },
  {
    id: "category",
    label: "Category",
    type: "select",
    defaultOperator: "is",
    operators: [{ value: "is", label: "is" }],
    options: CATEGORIES.map((category) => ({ value: category, label: category })),
  },
  {
    id: "location",
    label: "Location",
    type: "text",
    defaultOperator: "contains",
    operators: [{ value: "contains", label: "contains" }],
    placeholder: "Library, hostel, cafeteria",
  },
];

export function ItemFilters({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const query = useMemo(() => queryFromParams(searchParams), [searchParams]);

  function push(next: URLSearchParams) {
    next.delete("page");
    const value = next.toString();
    router.push(value ? `/browse?${value}` : "/browse");
  }

  function onQueryChange(nextQuery: FilterQuery<string>) {
    const params = new URLSearchParams();
    if (searchParams.q) params.set("q", searchParams.q);
    if (searchParams.from) params.set("from", searchParams.from);
    if (searchParams.to) params.set("to", searchParams.to);
    for (const rule of nextQuery.rules) {
      if (rule.type !== "rule" || typeof rule.value !== "string" || !rule.value.trim()) continue;
      const key = rule.path[0];
      if (key === "type" || key === "category" || key === "location") params.set(key, rule.value.trim());
    }
    push(params);
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const params = currentParams(searchParams);
        const q = String(form.get("q") ?? "").trim();
        const from = String(form.get("from") ?? "");
        const to = String(form.get("to") ?? "");
        if (q) params.set("q", q);
        else params.delete("q");
        if (from) params.set("from", from);
        else params.delete("from");
        if (to) params.set("to", to);
        else params.delete("to");
        push(params);
      }}
    >
      <div className="grid gap-3 md:grid-cols-[1fr_10rem_10rem_auto]">
        <Input name="q" defaultValue={searchParams.q ?? ""} placeholder="Search name or description" aria-label="Search items" />
        <Input name="from" type="date" defaultValue={searchParams.from ?? ""} aria-label="From date" />
        <Input name="to" type="date" defaultValue={searchParams.to ?? ""} aria-label="To date" />
        <Button type="submit">Search</Button>
      </div>
      <Filters fields={fields} query={query} onQueryChange={onQueryChange} variant="basic" showClear />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => router.push("/browse")}
      >
        Clear all filters
      </Button>
    </form>
  );
}

function currentParams(searchParams: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const key of ["q", "type", "category", "location", "from", "to"] as const) {
    const value = searchParams[key];
    if (value) params.set(key, value);
  }
  return params;
}

function queryFromParams(searchParams: Record<string, string | undefined>): FilterQuery<string> {
  const rules: FilterRule<string>[] = [];
  for (const key of ["type", "category", "location"] as const) {
    const value = searchParams[key];
    if (!value) continue;
    rules.push({
      id: key,
      type: "rule",
      path: [key],
      operator: key === "location" ? "contains" : "is",
      value,
    });
  }
  return { id: "root", type: "group", combinator: "and", rules };
}
