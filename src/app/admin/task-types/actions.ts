//src/app/admin/task-types/actions.ts
"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/db";
import { taskTypes } from "@/db/schema";
import { requireAdmin } from "@/lib/authGuard";

export type ActionState = { error?: string; success?: boolean };

const nameSchema = z.object({ name: z.string().min(1, "Name is required") });

function revalidate() {
  revalidatePath("/admin/settings");
  revalidateTag("task-types", "max");
}

export async function createTaskType(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = nameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const existing = await db.query.taskTypes.findFirst({
    where: eq(taskTypes.name, parsed.data.name),
  });
  if (existing) return { error: "Task type already exists" };

  await db.insert(taskTypes).values({ name: parsed.data.name });
  revalidate();
  return { success: true };
}

export async function deleteTaskType(id: string) {
  await requireAdmin();
  await db.delete(taskTypes).where(eq(taskTypes.id, id));
  revalidate();
}
