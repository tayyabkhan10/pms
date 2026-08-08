"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { employees, roles, users } from "@/db/schema";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { requireAdmin } from "@/lib/authGuard";

export type ActionState = {
  error?: string;
  success?: boolean;
};

async function getEmployeeRoleId() {
  const role = await db.query.roles.findFirst({ where: eq(roles.name, "employee") });
  if (!role) throw new Error("Employee role not found — did you run the seed script?");
  return role.id;
}

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  designation: z.string().optional(),
  phone: z.string().optional(),
  hireDate: z.string().optional(),
});

export async function createEmployee(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    designation: formData.get("designation") || undefined,
    phone: formData.get("phone") || undefined,
    hireDate: formData.get("hireDate") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, password, designation, phone, hireDate } = parsed.data;

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const employeeRoleId = await getEmployeeRoleId();

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "employee" },
  });

  if (error || !data.user) {
    return { error: error?.message ?? "Failed to create account" };
  }

  try {
    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: data.user.id,
        roleId: employeeRoleId,
        name,
        email,
        passwordEncrypted: encryptSecret(password),
      });

      await tx.insert(employees).values({
        userId: data.user.id,
        designation,
        phone,
        hireDate: hireDate || undefined,
      });
    });
  } catch (err) {
    // Both DB inserts rolled back together above — only the Supabase Auth account (created
    // outside the transaction) needs manual cleanup here.
    await supabaseAdmin.auth.admin.deleteUser(data.user.id);
    return { error: err instanceof Error ? err.message : "Failed to create employee" };
  }

  revalidatePath("/admin/employees");
  return { success: true };
}

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  designation: z.string().optional(),
  phone: z.string().optional(),
  hireDate: z.string().optional(),
  isActive: z.coerce.boolean(),
});

export async function updateEmployee(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    email: formData.get("email"),
    designation: formData.get("designation") || undefined,
    phone: formData.get("phone") || undefined,
    hireDate: formData.get("hireDate") || undefined,
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { id, name, email, designation, phone, hireDate, isActive } = parsed.data;

  const current = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!current) return { error: "Employee not found" };

  if (email !== current.email) {
    const taken = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (taken) return { error: "An account with this email already exists" };

    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { email });
    if (error) return { error: error.message };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ name, email, isActive, updatedAt: new Date() })
      .where(eq(users.id, id));

    await tx
      .update(employees)
      .set({
        designation,
        phone,
        hireDate: hireDate || undefined,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(employees.userId, id));
  });

  revalidatePath("/admin/employees");
  return { success: true };
}

const resetPasswordSchema = z.object({
  id: z.string().uuid(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function resetPassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = resetPasswordSchema.safeParse({
    id: formData.get("id"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { id, password } = parsed.data;

  const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { password });
  if (error) return { error: error.message };

  await db
    .update(users)
    .set({ passwordEncrypted: encryptSecret(password), updatedAt: new Date() })
    .where(eq(users.id, id));

  revalidatePath("/admin/employees");
  return { success: true };
}

export async function revealPassword(id: string): Promise<string> {
  await requireAdmin();

  const record = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!record) throw new Error("Employee not found");
  return decryptSecret(record.passwordEncrypted);
}

// Soft-delete: the employee moves into the Recycle Bin (see src/app/admin/recycle-bin) and
// can be restored by an admin within 7 days. Their Supabase Auth account and DB rows are left
// untouched — only isActive/deletedAt flip, which also blocks login immediately (login checks
// users.isActive). A scheduled purge job hard-deletes both once the 7-day window passes.
export async function deleteEmployee(id: string) {
  await requireAdmin();

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.update(users).set({ isActive: false, updatedAt: now }).where(eq(users.id, id));
    await tx
      .update(employees)
      .set({ isActive: false, deletedAt: now, updatedAt: now })
      .where(eq(employees.userId, id));
  });

  revalidatePath("/admin/employees");
}
