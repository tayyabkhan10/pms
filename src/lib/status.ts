export const STATUSES = [
  "Not Started",
  "In Progress",
  "Waiting",
  "Completed",
  "Blocked",
] as const;

export type StatusName = (typeof STATUSES)[number];

// Matches the sheet's colour legend: green=done, blue=active, amber=waiting, red=blocked/overdue, gray=not started.
export const STATUS_STYLES: Record<StatusName, string> = {
  "Not Started": "bg-zinc-100 text-zinc-600",
  "In Progress": "bg-blue-100 text-blue-700",
  Waiting: "bg-amber-100 text-amber-700",
  Completed: "bg-green-100 text-green-700",
  Blocked: "bg-red-100 text-red-700",
};

// Validated against dataviz's fixed status palette (good/warning/serious/critical) plus a
// muted neutral for "Not Started" — always paired with a visible label, never color alone.
export const STATUS_CHART_COLORS: Record<StatusName, string> = {
  "Not Started": "#898781",
  "In Progress": "#2a78d6",
  Waiting: "#fab219",
  Completed: "#0ca30c",
  Blocked: "#d03b3b",
};

export function isOverdue(dueDate: string | null, status: string, completionDate: string | null) {
  if (!dueDate || completionDate || status === "Completed") return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}
