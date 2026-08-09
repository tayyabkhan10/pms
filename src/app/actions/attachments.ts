"use server";

import { eq, and, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { attachments, tasks, clientUpdateRegister } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

async function assertCanAccessTask(userId: string, isAdmin: boolean, taskId: string) {
  if (isAdmin) return true;
  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, taskId), eq(tasks.assignedTo, userId), isNull(tasks.deletedAt)),
    columns: { id: true },
  });
  return Boolean(task);
}

async function assertCanAccessClientUpdate(userId: string, isAdmin: boolean, clientUpdateId: string) {
  if (isAdmin) return true;
  const update = await db.query.clientUpdateRegister.findFirst({
    where: and(eq(clientUpdateRegister.id, clientUpdateId), eq(clientUpdateRegister.employeeId, userId)),
    columns: { id: true },
  });
  return Boolean(update);
}

export async function getAttachments(opts: { taskId?: string; clientUpdateId?: string }) {
  const user = await getCurrentUser();
  if (!user) return [];

  if (opts.taskId) {
    return db.query.attachments.findMany({
      where: eq(attachments.taskId, opts.taskId),
      orderBy: (a, { desc }) => [desc(a.createdAt)],
    });
  }
  if (opts.clientUpdateId) {
    return db.query.attachments.findMany({
      where: eq(attachments.clientUpdateId, opts.clientUpdateId),
      orderBy: (a, { desc }) => [desc(a.createdAt)],
    });
  }
  return [];
}

export async function addAttachment(opts: {
  taskId?: string;
  clientUpdateId?: string;
  fileUrl: string;
  fileName: string;
  fileType?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  const isAdmin = user.role === "admin";

  if (opts.taskId) {
    if (!(await assertCanAccessTask(user.id, isAdmin, opts.taskId))) {
      throw new Error("Forbidden");
    }
  } else if (opts.clientUpdateId) {
    if (!(await assertCanAccessClientUpdate(user.id, isAdmin, opts.clientUpdateId))) {
      throw new Error("Forbidden");
    }
  } else {
    throw new Error("taskId or clientUpdateId is required");
  }

  // Returns the created row so the client can append it directly instead of re-fetching the
  // whole list right after inserting into it.
  const [row] = await db
    .insert(attachments)
    .values({
      taskId: opts.taskId,
      clientUpdateId: opts.clientUpdateId,
      fileUrl: opts.fileUrl,
      fileName: opts.fileName,
      fileType: opts.fileType,
      uploadedBy: user.id,
    })
    .returning();

  revalidatePath("/admin/tasks");
  revalidatePath("/employee/tasks");
  revalidatePath("/admin/client-updates");

  return row;
}

export async function deleteAttachment(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");

  const row = await db.query.attachments.findFirst({ where: eq(attachments.id, id) });
  if (!row) return;

  if (user.role !== "admin" && row.uploadedBy !== user.id) {
    throw new Error("Forbidden");
  }

  await db.delete(attachments).where(eq(attachments.id, id));

  revalidatePath("/admin/tasks");
  revalidatePath("/employee/tasks");
  revalidatePath("/admin/client-updates");
}
