"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users } from "@/db/schema";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";

export type ActionState = { error?: string; success?: boolean };

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
});

// Admin edits their own record — id always comes from the session, never the form.
export async function updateOwnProfile(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") return { error: "Not authorized" };

  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { name, email } = parsed.data;

  if (email !== admin.email) {
    const taken = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (taken) return { error: "An account with this email already exists" };

    const { error } = await supabaseAdmin.auth.admin.updateUserById(admin.id, { email });
    if (error) return { error: error.message };
  }

  await db.update(users).set({ name, email, updatedAt: new Date() }).where(eq(users.id, admin.id));

  revalidatePath("/admin/profile");
  return { success: true };
}

const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function changeOwnPassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") return { error: "Not authorized" };

  const parsed = passwordSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { error } = await supabaseAdmin.auth.admin.updateUserById(admin.id, {
    password: parsed.data.password,
  });
  if (error) return { error: error.message };

  return { success: true };
}
