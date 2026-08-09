"use server";

import { and, eq, gte, lte, isNull } from "drizzle-orm";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

// Scoped to the signed-in user server-side (never trusts a client-supplied id) — this is only
// called when the employee actually opens the History tab, not on every page load.
export async function getMyTaskHistory(from: string, to: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  return db.query.tasks.findMany({
    where: and(
      eq(tasks.assignedTo, user.id),
      eq(tasks.statusName, "Completed"),
      gte(tasks.completionDate, from),
      lte(tasks.completionDate, to),
      isNull(tasks.deletedAt)
    ),
    with: {
      client: true,
      taskType: true,
      updateRequests: { orderBy: (r, { desc }) => [desc(r.createdAt)] },
    },
    orderBy: (t, { desc }) => [desc(t.completionDate)],
    limit: 100,
  });
}
