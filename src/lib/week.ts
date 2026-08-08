import { toLocalISODate } from "@/lib/date";

// Given any date, returns the Monday–Sunday week it falls in (YYYY-MM-DD strings), matching
// the sheet's "poori week Monday se Sunday tak" planning convention.
export function getWeekRange(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  const day = date.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    weekStartDate: toLocalISODate(monday),
    weekEndDate: toLocalISODate(sunday),
  };
}
