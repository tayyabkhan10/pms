"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { weeklyPlanner } from "@/db/schema";
import { requireAdmin } from "@/lib/authGuard";
import { getWeekRange } from "@/lib/week";

export type ActionState = { error?: string; success?: boolean };

const schema = z.object({
  employeeId: z.string().uuid(),
  weekOf: z.string().min(1),
  notes: z.string().optional(),
});

// Admin-only — Weekly Planner is planned by the manager, employees get a read-only view.
export async function saveWeeklyPlan(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = schema.safeParse({
    employeeId: formData.get("employeeId"),
    weekOf: formData.get("weekOf"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { employeeId, weekOf, notes } = parsed.data;
  const { weekStartDate, weekEndDate } = getWeekRange(weekOf);

  const existing = await db.query.weeklyPlanner.findFirst({
    where: and(
      eq(weeklyPlanner.employeeId, employeeId),
      eq(weeklyPlanner.weekStartDate, weekStartDate)
    ),
  });

  if (existing) {
    await db
      .update(weeklyPlanner)
      .set({ notes, updatedAt: new Date() })
      .where(eq(weeklyPlanner.id, existing.id));
  } else {
    await db.insert(weeklyPlanner).values({ employeeId, weekStartDate, weekEndDate, notes });
  }

  revalidatePath("/admin/weekly-planner");
  revalidatePath("/employee/weekly-planner");
  return { success: true };
}

export async function deleteWeeklyPlan(id: string) {
  await requireAdmin();
  await db.delete(weeklyPlanner).where(eq(weeklyPlanner.id, id));
  revalidatePath("/admin/weekly-planner");
  revalidatePath("/employee/weekly-planner");
}
