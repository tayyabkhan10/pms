"use server";

import { z } from "zod";
import { eq, and, sql, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { db } from "@/db";
import { clients, tasks, taskUpdateRequests, users } from "@/db/schema";
import { requireAdmin } from "@/lib/authGuard";
import { getCurrentUser } from "@/lib/auth";
import { STATUSES } from "@/lib/status";
import { PRIORITIES } from "@/lib/priority";
import { todayLocalISODate } from "@/lib/date";
import { createNotification, notifyAllAdmins } from "@/lib/notifications";
import { sendMail } from "@/lib/mailer";

export type ActionState = { error?: string; success?: boolean };

const createTaskSchema = z.object({
  clientId: z.string().uuid("Client is required"),
  assignedTo: z.string().uuid("Employee is required"),
  taskTypeId: z.string().uuid("Task type is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(PRIORITIES).default("Medium"),
  assignedDate: z.string().min(1),
  dueDate: z.string().optional(),
});

export async function createTask(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = createTaskSchema.safeParse({
    clientId: formData.get("clientId"),
    assignedTo: formData.get("assignedTo"),
    taskTypeId: formData.get("taskTypeId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    priority: formData.get("priority") || undefined,
    assignedDate: formData.get("assignedDate"),
    dueDate: formData.get("dueDate") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const [client, assignee] = await Promise.all([
    db.query.clients.findFirst({ where: eq(clients.id, parsed.data.clientId) }),
    db.query.users.findFirst({ where: eq(users.id, parsed.data.assignedTo) }),
  ]);
  if (!client) return { error: "Client not found" };
  if (!assignee) return { error: "Employee not found" };

  await db.insert(tasks).values({
    taskId: `TSK-${randomUUID().slice(0, 8).toUpperCase()}`,
    clientId: parsed.data.clientId,
    assignedTo: parsed.data.assignedTo,
    taskTypeId: parsed.data.taskTypeId,
    title: parsed.data.title,
    description: parsed.data.description,
    priority: parsed.data.priority,
    assignedDate: parsed.data.assignedDate,
    dueDate: parsed.data.dueDate || undefined,
    // Denormalized copy from the client at assignment time — mirrors the sheet's auto-fill formulas.
    platformId: client.platformId,
    brandGroup: client.brandGroup,
  });

  await createNotification({
    userId: assignee.id,
    type: "task_assigned",
    title: `New task assigned: ${parsed.data.title}`,
    body: `${client.name} — due ${parsed.data.dueDate || "no due date"}`,
    link: "/employee/tasks",
  });
  await sendMail({
    to: assignee.email,
    subject: `New task assigned: ${parsed.data.title}`,
    html: `<p>Hi ${assignee.name},</p><p>A new task has been assigned to you:</p><ul><li><b>Task:</b> ${parsed.data.title}</li><li><b>Client:</b> ${client.name}</li><li><b>Priority:</b> ${parsed.data.priority}</li><li><b>Due date:</b> ${parsed.data.dueDate || "Not set"}</li></ul><p>Log in to view details.</p>`,
  });

  revalidatePath("/admin/tasks");
  revalidatePath("/employee/tasks");
  return { success: true };
}

// Soft-delete: moves the task into the Recycle Bin (see src/app/admin/recycle-bin) rather than
// destroying it immediately, so an admin can undo an accidental delete within 7 days.
export async function deleteTask(id: string) {
  await requireAdmin();
  await db.update(tasks).set({ deletedAt: new Date() }).where(eq(tasks.id, id));
  revalidatePath("/admin/tasks");
  revalidatePath("/employee/tasks");
}

const submitUpdateSchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum(STATUSES),
  workResult: z.string().optional(),
  remainingWork: z.string().optional(),
  clientUpdateSent: z.coerce.boolean(),
  updateSummary: z.string().optional(),
  timeSpentMinutes: z.coerce.number().int().min(0).optional(),
});

export type UpdateTaskState = { error?: string; success?: boolean };

// Employees never write to `tasks` directly — this queues a request that only takes effect
// once an admin approves it (see reviewRequest below). Re-verifies ownership server-side.
export async function submitTaskUpdate(
  _prevState: UpdateTaskState,
  formData: FormData
): Promise<UpdateTaskState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in" };

  const parsed = submitUpdateSchema.safeParse({
    taskId: formData.get("taskId"),
    status: formData.get("status"),
    workResult: formData.get("workResult") || undefined,
    remainingWork: formData.get("remainingWork") || undefined,
    clientUpdateSent: formData.get("clientUpdateSent") === "on",
    updateSummary: formData.get("updateSummary") || undefined,
    timeSpentMinutes: formData.get("timeSpentMinutes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const {
    taskId,
    status,
    workResult,
    remainingWork,
    clientUpdateSent,
    updateSummary,
    timeSpentMinutes,
  } = parsed.data;

  const [task, existingPending] = await Promise.all([
    db.query.tasks.findFirst({
      where: and(eq(tasks.id, taskId), eq(tasks.assignedTo, user.id), isNull(tasks.deletedAt)),
    }),
    db.query.taskUpdateRequests.findFirst({
      where: and(
        eq(taskUpdateRequests.taskId, taskId),
        eq(taskUpdateRequests.requestStatus, "pending")
      ),
    }),
  ]);
  if (!task) return { error: "Task not found" };

  if (existingPending) {
    await db
      .update(taskUpdateRequests)
      .set({
        requestedStatus: status,
        workResult,
        remainingWork,
        clientUpdateSent,
        updateSummary,
        timeSpentMinutes,
      })
      .where(eq(taskUpdateRequests.id, existingPending.id));
  } else {
    await db.insert(taskUpdateRequests).values({
      taskId,
      submittedBy: user.id,
      requestedStatus: status,
      workResult,
      remainingWork,
      clientUpdateSent,
      updateSummary,
      timeSpentMinutes,
    });
  }

  await notifyAllAdmins({
    type: "update_submitted",
    title: `${user.name} submitted an update`,
    body: `${task.title} — requested status: ${status}`,
    link: "/admin/approvals",
  });

  revalidatePath("/employee/tasks");
  revalidatePath("/admin/approvals");
  return { success: true };
}

export type ReviewState = { error?: string; success?: boolean };

const reviewSchema = z.object({
  requestId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  reviewNote: z.string().optional(),
});

export async function reviewRequest(
  _prevState: ReviewState,
  formData: FormData
): Promise<ReviewState> {
  const admin = await requireAdmin();

  const parsed = reviewSchema.safeParse({
    requestId: formData.get("requestId"),
    decision: formData.get("decision"),
    reviewNote: formData.get("reviewNote") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { requestId, decision, reviewNote } = parsed.data;

  const request = await db.query.taskUpdateRequests.findFirst({
    where: eq(taskUpdateRequests.id, requestId),
  });
  if (!request || request.requestStatus !== "pending") {
    return { error: "This request has already been reviewed" };
  }

  if (decision === "approved") {
    await db
      .update(tasks)
      .set({
        statusName: request.requestedStatus,
        workResult: request.workResult,
        remainingWork: request.remainingWork,
        clientUpdateSent: request.clientUpdateSent,
        updateTime: request.clientUpdateSent ? new Date() : undefined,
        updateSummary: request.updateSummary,
        completionDate: request.requestedStatus === "Completed" ? todayLocalISODate() : null,
        ...(request.timeSpentMinutes
          ? { timeSpentMinutes: sql`${tasks.timeSpentMinutes} + ${request.timeSpentMinutes}` }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, request.taskId));
  }

  await db
    .update(taskUpdateRequests)
    .set({
      requestStatus: decision,
      reviewNote,
      reviewedBy: admin.id,
      reviewedAt: new Date(),
    })
    .where(eq(taskUpdateRequests.id, requestId));

  await createNotification({
    userId: request.submittedBy,
    type: "update_reviewed",
    title: decision === "approved" ? "Your update was approved" : "Your update was rejected",
    body: reviewNote || undefined,
    link: "/employee/tasks",
  });

  revalidatePath("/admin/approvals");
  revalidatePath("/admin/tasks");
  revalidatePath("/employee/tasks");
  return { success: true };
}
