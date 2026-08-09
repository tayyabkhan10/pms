"use server";

import { db } from "@/db";
import { requireAdmin } from "@/lib/authGuard";

// Each only runs when its tab is actually opened (see the client panels) — settings/page.tsx
// used to construct all three panels unconditionally, so all three queries ran on every visit
// to /admin/settings even though only one tab is ever visible at a time.
export async function getPlatformsList() {
  await requireAdmin();
  return db.query.platforms.findMany({ orderBy: (p, { asc }) => [asc(p.name)] });
}

export async function getBossesList() {
  await requireAdmin();
  return db.query.bosses.findMany({ orderBy: (b, { asc }) => [asc(b.name)] });
}

export async function getTaskTypesList() {
  await requireAdmin();
  return db.query.taskTypes.findMany({ orderBy: (t, { asc }) => [asc(t.name)] });
}
