"use server";

import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function getMyNotifications() {
  const user = await getCurrentUser();
  if (!user) return { items: [], unreadCount: 0 };

  const [items, unreadCount] = await Promise.all([
    db.query.notifications.findMany({
      where: eq(notifications.userId, user.id),
      orderBy: [desc(notifications.createdAt)],
      limit: 20,
    }),
    db.$count(notifications, and(eq(notifications.userId, user.id), eq(notifications.isRead, false))),
  ]);

  return { items, unreadCount };
}

export async function markNotificationRead(id: string) {
  const user = await getCurrentUser();
  if (!user) return;
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)));
  revalidatePath("/admin", "layout");
  revalidatePath("/employee", "layout");
}

export async function markAllNotificationsRead() {
  const user = await getCurrentUser();
  if (!user) return;
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));
  revalidatePath("/admin", "layout");
  revalidatePath("/employee", "layout");
}
