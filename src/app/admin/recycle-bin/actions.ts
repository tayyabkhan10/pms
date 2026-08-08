"use server";

import { eq, and, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { clients, employees, tasks, users } from "@/db/schema";
import { requireAdmin } from "@/lib/authGuard";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function restoreTask(id: string) {
  await requireAdmin();
  await db.update(tasks).set({ deletedAt: null }).where(eq(tasks.id, id));
  revalidatePath("/admin/recycle-bin");
  revalidatePath("/admin/tasks");
  revalidatePath("/employee/tasks");
}

export async function restoreClient(id: string) {
  await requireAdmin();
  await db.update(clients).set({ deletedAt: null }).where(eq(clients.id, id));
  revalidatePath("/admin/recycle-bin");
  revalidatePath("/admin/clients");
}

export async function restoreEmployee(userId: string) {
  await requireAdmin();
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.update(users).set({ isActive: true, updatedAt: now }).where(eq(users.id, userId));
    await tx
      .update(employees)
      .set({ isActive: true, deletedAt: null, updatedAt: now })
      .where(eq(employees.userId, userId));
  });
  revalidatePath("/admin/recycle-bin");
  revalidatePath("/admin/employees");
}

// Permanent delete is only allowed on rows already sitting in the Recycle Bin (deletedAt set)
// — it's a hard `db.delete`, so it can fail with a foreign-key error if the row is still
// referenced elsewhere (e.g. a task that still has client-update-register entries, or an
// employee who still has tasks assigned to them). That failure surfaces to the admin as-is
// rather than being silently swallowed, since it means the data isn't actually safe to remove.
export async function permanentlyDeleteTask(id: string) {
  await requireAdmin();
  await db.delete(tasks).where(and(eq(tasks.id, id), isNotNull(tasks.deletedAt)));
  revalidatePath("/admin/recycle-bin");
}

export async function permanentlyDeleteClient(id: string) {
  await requireAdmin();
  await db.delete(clients).where(and(eq(clients.id, id), isNotNull(clients.deletedAt)));
  revalidatePath("/admin/recycle-bin");
}

export async function permanentlyDeleteEmployee(userId: string) {
  await requireAdmin();

  const employee = await db.query.employees.findFirst({
    where: and(eq(employees.userId, userId), isNotNull(employees.deletedAt)),
  });
  if (!employee) return;

  // Best-effort — if the Auth account is already gone this just no-ops.
  await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {});

  // Cascades to the `employees` row via its onDelete: "cascade" FK.
  await db.delete(users).where(eq(users.id, userId));
  revalidatePath("/admin/recycle-bin");
}
