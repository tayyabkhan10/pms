"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { requireAdmin } from "@/lib/authGuard";

export type ActionState = { error?: string; success?: boolean };

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  platformId: z.string().uuid("Platform is required"),
  bossId: z.string().uuid().optional().or(z.literal("")),
  brandGroup: z.string().optional(),
  isDreamWeaversGroup: z.coerce.boolean(),
  defaultEmployeeId: z.string().uuid().optional().or(z.literal("")),
  storeLink: z.string().optional(),
  loginNotes: z.string().optional(),
  generalNotes: z.string().optional(),
  isActive: z.coerce.boolean(),
});

function parseForm(formData: FormData) {
  return clientSchema.safeParse({
    name: formData.get("name"),
    platformId: formData.get("platformId"),
    bossId: formData.get("bossId") || "",
    brandGroup: formData.get("brandGroup") || undefined,
    isDreamWeaversGroup: formData.get("isDreamWeaversGroup") === "on",
    defaultEmployeeId: formData.get("defaultEmployeeId") || "",
    storeLink: formData.get("storeLink") || undefined,
    loginNotes: formData.get("loginNotes") || undefined,
    generalNotes: formData.get("generalNotes") || undefined,
    isActive: formData.get("isActive") === "on",
  });
}

export async function createClient(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { bossId, defaultEmployeeId, ...rest } = parsed.data;

  await db.insert(clients).values({
    ...rest,
    bossId: bossId || undefined,
    defaultEmployeeId: defaultEmployeeId || undefined,
  });

  revalidatePath("/admin/clients");
  return { success: true };
}

const updateSchema = clientSchema.extend({ id: z.string().uuid() });

export async function updateClient(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    platformId: formData.get("platformId"),
    bossId: formData.get("bossId") || "",
    brandGroup: formData.get("brandGroup") || undefined,
    isDreamWeaversGroup: formData.get("isDreamWeaversGroup") === "on",
    defaultEmployeeId: formData.get("defaultEmployeeId") || "",
    storeLink: formData.get("storeLink") || undefined,
    loginNotes: formData.get("loginNotes") || undefined,
    generalNotes: formData.get("generalNotes") || undefined,
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { id, bossId, defaultEmployeeId, ...rest } = parsed.data;

  await db
    .update(clients)
    .set({
      ...rest,
      bossId: bossId || null,
      defaultEmployeeId: defaultEmployeeId || null,
      updatedAt: new Date(),
    })
    .where(eq(clients.id, id));

  revalidatePath("/admin/clients");
  return { success: true };
}

export async function deleteClient(id: string) {
  await requireAdmin();
  await db.delete(clients).where(eq(clients.id, id));
  revalidatePath("/admin/clients");
}
