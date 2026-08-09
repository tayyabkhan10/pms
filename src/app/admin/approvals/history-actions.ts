"use server";

import { and, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { taskUpdateRequests } from "@/db/schema";
import { requireAdmin } from "@/lib/authGuard";

export async function getApprovalHistory(from: string, to: string) {
  await requireAdmin();
  return db.query.taskUpdateRequests.findMany({
    where: and(
      gte(taskUpdateRequests.reviewedAt, new Date(`${from}T00:00:00`)),
      lte(taskUpdateRequests.reviewedAt, new Date(`${to}T23:59:59.999`))
    ),
    with: { task: true, submitter: true, reviewer: true },
    orderBy: (r, { desc }) => [desc(r.reviewedAt)],
    limit: 200,
  });
}
