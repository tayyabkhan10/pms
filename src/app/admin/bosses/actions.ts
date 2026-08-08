//src/app/admin/bosses/actions.ts
"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { bosses } from "@/db/schema";
import { requireAdmin } from "@/lib/authGuard";

export type ActionState = { error?: string; success?: boolean };

const bossSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
});

function revalidate() {
  revalidatePath("/admin/settings");
}

export async function createBoss(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = bossSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") || "",
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  await db.insert(bosses).values({
    name: parsed.data.name,
    email: parsed.data.email || undefined,
    phone: parsed.data.phone,
  });
  revalidate();
  return { success: true };
}

export async function deleteBoss(id: string) {
  await requireAdmin();
  await db.delete(bosses).where(eq(bosses.id, id));
  revalidate();
}
