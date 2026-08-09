"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

// Single query: the bell only needs the last 20 anyway, so unreadCount is derived from that
// same result instead of a second $count round-trip. This runs on a polling interval from
// every open tab, so keeping it to one DB query matters — the connection pool is small
// (see src/db/index.ts) and a second concurrent query per poll was starving other requests
// (including login) of a free connection.
export async function getMyNotifications() {
  const user = await getCurrentUser();
  if (!user) return { items: [], unreadCount: 0 };

  const items = await db.query.notifications.findMany({
    where: eq(notifications.userId, user.id),
    orderBy: (n, { desc }) => [desc(n.createdAt)],
    limit: 20,
  });

  return { items, unreadCount: items.filter((n) => !n.isRead).length };
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
