"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginState = {
  error?: string;
};

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { email, password } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "Invalid email or password" };
  }

  const record = await db.query.users.findFirst({ where: eq(users.id, data.user.id) });
  if (!record || !record.isActive) {
    await supabase.auth.signOut();
    return { error: "This account is inactive" };
  }

  const role = data.user.app_metadata?.role as "admin" | "employee" | undefined;
  if (role !== "admin" && role !== "employee") {
    await supabase.auth.signOut();
    return { error: "This account is not configured correctly. Contact an administrator." };
  }

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, data.user.id));

  // Straight to the real landing page — /admin and /employee are themselves just a redirect
  // to these, so going through them here would mean two redirect round trips after every login.
  redirect(role === "admin" ? "/admin/dashboard" : "/employee/tasks");
}
