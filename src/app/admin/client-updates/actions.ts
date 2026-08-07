"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { clientUpdateRegister } from "@/db/schema";
import { requireAdmin } from "@/lib/authGuard";

export type ActionState = { error?: string; success?: boolean };

const schema = z.object({
  clientId: z.string().uuid("Client is required"),
  employeeId: z.string().uuid("Employee is required"),
  updateDate: z.string().min(1, "Update date is required"),
  summary: z.string().optional(),
  clientResponse: z.string().optional(),
  followUpDate: z.string().optional(),
  nextUpdateDate: z.string().optional(),
});

export async function createClientUpdate(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = schema.safeParse({
    clientId: formData.get("clientId"),
    employeeId: formData.get("employeeId"),
    updateDate: formData.get("updateDate"),
    summary: formData.get("summary") || undefined,
    clientResponse: formData.get("clientResponse") || undefined,
    followUpDate: formData.get("followUpDate") || undefined,
    nextUpdateDate: formData.get("nextUpdateDate") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  await db.insert(clientUpdateRegister).values({
    ...parsed.data,
    followUpDate: parsed.data.followUpDate || undefined,
    nextUpdateDate: parsed.data.nextUpdateDate || undefined,
  });

  revalidatePath("/admin/client-updates");
  return { success: true };
}

export async function deleteClientUpdate(id: string) {
  await requireAdmin();
  await db.delete(clientUpdateRegister).where(eq(clientUpdateRegister.id, id));
  revalidatePath("/admin/client-updates");
}
