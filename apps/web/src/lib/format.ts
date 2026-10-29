export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function dateInputToIso(value: string): string {
  return new Date(`${value}T12:00:00.000Z`).toISOString();
}

export function isoToDateInput(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function titleCase(value: string): string {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function activityLabel(action: string): string {
  const labels: Record<string, string> = {
    "user.registered": "Joined FindIt",
    "item.created": "Reported an item",
    "item.updated": "Updated a report",
    "item.archived": "Archived a report",
    "item.moderated": "Moderated a report",
    "item.resolved": "Marked an item returned",
    "claim.created": "Submitted a claim",
    "claim.cancelled": "Cancelled a claim",
    "claim.reviewed": "Reviewed a claim",
    "seed.loaded": "Loaded demo data",
  };
  return labels[action] ?? titleCase(action);
}
