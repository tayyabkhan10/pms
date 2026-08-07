"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

// Scoped to the caller's own session — nobody can pass another user's id in.
export async function saveAvatarUrl(url: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");

  await db.update(users).set({ avatarUrl: url, updatedAt: new Date() }).where(eq(users.id, user.id));

  revalidatePath("/admin/profile");
  revalidatePath("/employee/profile");
  revalidatePath("/admin", "layout");
  revalidatePath("/employee", "layout");
}

export async function removeAvatar() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");

  await db.update(users).set({ avatarUrl: null, updatedAt: new Date() }).where(eq(users.id, user.id));

  revalidatePath("/admin/profile");
  revalidatePath("/employee/profile");
  revalidatePath("/admin", "layout");
  revalidatePath("/employee", "layout");
}
