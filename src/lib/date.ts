// Local-calendar-date helpers. Never route a "which day is this" computation through
// toISOString() — it renders in UTC and silently shifts the date for any timezone ahead
// of UTC (e.g. Asia/Karachi, UTC+5) during local morning hours.

export function toLocalISODate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayLocalISODate() {
  return toLocalISODate(new Date());
}
