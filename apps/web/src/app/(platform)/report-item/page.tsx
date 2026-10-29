import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ReportForm } from "@/components/forms/report-form";

export default function ReportItemPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        eyebrow="New report"
        title="Report an item"
        description="New reports stay private until an administrator approves them. Identifying details and notes are not shown on public cards."
      />
      <Suspense>
        <ReportForm />
      </Suspense>
    </div>
  );
}
