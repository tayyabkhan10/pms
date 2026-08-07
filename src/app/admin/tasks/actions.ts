"use server";

import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { db } from "@/db";
import { clients, tasks, taskUpdateRequests } from "@/db/schema";
import { requireAdmin } from "@/lib/authGuard";
import { getCurrentUser } from "@/lib/auth";
import { STATUSES } from "@/lib/status";

export type ActionState = { error?: string; success?: boolean };

const createTaskSchema = z.object({
  clientId: z.string().uuid("Client is required"),
  assignedTo: z.string().uuid("Employee is required"),
  taskTypeId: z.string().uuid("Task type is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
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
    assignedDate: formData.get("assignedDate"),
    dueDate: formData.get("dueDate") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const client = await db.query.clients.findFirst({
    where: eq(clients.id, parsed.data.clientId),
  });
  if (!client) return { error: "Client not found" };

  await db.insert(tasks).values({
    taskId: `TSK-${randomUUID().slice(0, 8).toUpperCase()}`,
    clientId: parsed.data.clientId,
    assignedTo: parsed.data.assignedTo,
    taskTypeId: parsed.data.taskTypeId,
    title: parsed.data.title,
    description: parsed.data.description,
    assignedDate: parsed.data.assignedDate,
    dueDate: parsed.data.dueDate || undefined,
    // Denormalized copy from the client at assignment time — mirrors the sheet's auto-fill formulas.
    platformId: client.platformId,
    brandGroup: client.brandGroup,
  });

  revalidatePath("/admin/tasks");
  revalidatePath("/employee/tasks");
  return { success: true };
}

export async function deleteTask(id: string) {
  await requireAdmin();
  await db.delete(tasks).where(eq(tasks.id, id));
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
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { taskId, status, workResult, remainingWork, clientUpdateSent, updateSummary } =
    parsed.data;

  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, taskId), eq(tasks.assignedTo, user.id)),
  });
  if (!task) return { error: "Task not found" };

  const existingPending = await db.query.taskUpdateRequests.findFirst({
    where: and(
      eq(taskUpdateRequests.taskId, taskId),
      eq(taskUpdateRequests.requestStatus, "pending")
    ),
  });

  if (existingPending) {
    await db
      .update(taskUpdateRequests)
      .set({ requestedStatus: status, workResult, remainingWork, clientUpdateSent, updateSummary })
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
    });
  }

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
        completionDate:
          request.requestedStatus === "Completed"
            ? new Date().toISOString().slice(0, 10)
            : null,
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

  revalidatePath("/admin/approvals");
  revalidatePath("/admin/tasks");
  revalidatePath("/employee/tasks");
  return { success: true };
}
