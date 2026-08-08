// src/app/admin/platforms/actions.ts
"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { platforms } from "@/db/schema";
import { requireAdmin } from "@/lib/authGuard";

export type ActionState = { error?: string; success?: boolean };

const nameSchema = z.object({ name: z.string().min(1, "Name is required") });

function revalidate() {
  revalidatePath("/admin/settings");
}
export async function createPlatform(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = nameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const existing = await db.query.platforms.findFirst({
    where: eq(platforms.name, parsed.data.name),
  });
  if (existing) return { error: "Platform already exists" };

  await db.insert(platforms).values({ name: parsed.data.name });
  revalidate();
  return { success: true };
}

export async function renamePlatform(id: string, name: string) {
  await requireAdmin();
  if (!name.trim()) return;
  await db.update(platforms).set({ name, updatedAt: new Date() }).where(eq(platforms.id, id));
  revalidate();
}

export async function deletePlatform(id: string) {
  await requireAdmin();
  await db.delete(platforms).where(eq(platforms.id, id));
  revalidate();
}
