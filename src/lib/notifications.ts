import "server-only";
import { db } from "@/db";
import { notifications } from "@/db/schema";

export async function createNotification(opts: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
}) {
  await db.insert(notifications).values({
    userId: opts.userId,
    type: opts.type,
    title: opts.title,
    body: opts.body,
    link: opts.link,
  });
}

// Fans a notification out to every active admin — used for events like "new update submitted"
// where the acting admin isn't known ahead of time.
export async function notifyAllAdmins(opts: {
  type: string;
  title: string;
  body?: string;
  link?: string;
}) {
  const admins = await db.query.users.findMany({
    where: (users, { eq }) => eq(users.isActive, true),
    columns: { id: true },
    with: { role: { columns: { name: true } } },
  });

  const adminIds = admins.filter((u) => u.role.name === "admin").map((u) => u.id);
  if (adminIds.length === 0) return;

  await db.insert(notifications).values(
    adminIds.map((userId) => ({
      userId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      link: opts.link,
    }))
  );
}
