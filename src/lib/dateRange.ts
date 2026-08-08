import { toLocalISODate } from "@/lib/date";

export const RANGE_PRESETS = [
  { key: "today", label: "Today" },
  { key: "3d", label: "3 Days" },
  { key: "week", label: "Week" },
  { key: "year", label: "Year" },
] as const;

export type RangePreset = (typeof RANGE_PRESETS)[number]["key"];

const toISODate = toLocalISODate;

// Resolves a preset key (or explicit from/to overrides) into concrete ISO date bounds.
export function resolveDateRange(params: { preset?: string; from?: string; to?: string }) {
  const today = new Date();
  const todayStr = toISODate(today);

  if (params.from || params.to) {
    return { from: params.from ?? todayStr, to: params.to ?? todayStr, preset: undefined };
  }

  const preset = (params.preset as RangePreset) || "week";
  const from = new Date(today);

  switch (preset) {
    case "today":
      break;
    case "3d":
      from.setDate(from.getDate() - 2);
      break;
    case "year":
      from.setFullYear(from.getFullYear() - 1);
      break;
    case "week":
    default:
      from.setDate(from.getDate() - 6);
      break;
  }

  return { from: toISODate(from), to: todayStr, preset };
}
