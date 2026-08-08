"use server";

import { z } from "zod";
import { eq, isNull } from "drizzle-orm";
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

// Soft-delete: moves the client into the Recycle Bin (see src/app/admin/recycle-bin) rather
// than destroying it immediately, so an admin can undo an accidental delete within 7 days.
export async function deleteClient(id: string) {
  await requireAdmin();
  await db.update(clients).set({ deletedAt: new Date() }).where(eq(clients.id, id));
  revalidatePath("/admin/clients");
}

// Fetched on demand (only when a client's edit modal opens) rather than up front for every
// client on the list page — avoids pulling a global, ever-more-truncated slice of the whole
// tasks table just to show 5 rows for whichever single client is being edited.
export async function getRecentTasksForClient(clientId: string) {
  await requireAdmin();
  return db.query.tasks.findMany({
    where: (t, { and }) => and(eq(t.clientId, clientId), isNull(t.deletedAt)),
    columns: { id: true, title: true, statusName: true, assignedDate: true },
    orderBy: (t, { desc }) => [desc(t.assignedDate)],
    limit: 5,
  });
}
