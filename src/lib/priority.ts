export const PRIORITIES = ["Low", "Medium", "High"] as const;

export type PriorityName = (typeof PRIORITIES)[number];

export const PRIORITY_STYLES: Record<PriorityName, string> = {
  Low: "bg-zinc-100 text-zinc-600",
  Medium: "bg-blue-100 text-blue-700",
  High: "bg-red-100 text-red-700",
};
