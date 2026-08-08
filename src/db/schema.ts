import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  date,
  index,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable("users", {
  // Same UUID as the corresponding auth.users.id row managed by Supabase Auth.
  id: uuid("id").primaryKey(),
  roleId: uuid("role_id")
    .notNull()
    .references(() => roles.id),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 150 }).notNull().unique(),
  // Encrypted copy of the current password so admins can reveal it on demand (see src/lib/crypto.ts).
  // Supabase Auth's own hashed credential remains the source of truth for actually signing in.
  passwordEncrypted: text("password_encrypted").notNull(),
  avatarUrl: text("avatar_url"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const employees = pgTable(
  "employees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    designation: varchar("designation", { length: 100 }),
    phone: varchar("phone", { length: 20 }),
    hireDate: date("hire_date"),
    isActive: boolean("is_active").notNull().default(true),
    // Soft-delete: set on "delete", cleared on restore. Recycle Bin (admin-only) shows rows
    // deleted within the last 7 days; a scheduled purge job hard-deletes (and removes the
    // Supabase Auth account) once that window passes. See /admin/recycle-bin.
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("employees_deleted_at_idx").on(table.deletedAt)]
);

export const platforms = pgTable("platforms", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bosses = pgTable("bosses", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 150 }),
  phone: varchar("phone", { length: 20 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const taskTypes = pgTable("task_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 150 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 150 }).notNull(),
    platformId: uuid("platform_id")
      .notNull()
      .references(() => platforms.id),
    bossId: uuid("boss_id").references(() => bosses.id),
    brandGroup: varchar("brand_group", { length: 150 }),
    // Drives the light-yellow row highlight from the sheet's legend for this ownership group.
    isDreamWeaversGroup: boolean("is_dream_weavers_group").notNull().default(false),
    defaultEmployeeId: uuid("default_employee_id").references(() => users.id),
    storeLink: text("store_link"),
    loginNotes: text("login_notes"),
    generalNotes: text("general_notes"),
    isActive: boolean("is_active").notNull().default(true),
    // Soft-delete — see employees.deletedAt for the Recycle Bin mechanics.
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("clients_deleted_at_idx").on(table.deletedAt)]
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: varchar("task_id", { length: 50 }).notNull().unique(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id),
    assignedTo: uuid("assigned_to")
      .notNull()
      .references(() => users.id),
    // Denormalized copy of the client's platform/brand at assignment time (mirrors the sheet's
    // auto-fill-by-formula behavior) so a task's history stays accurate if the client record changes later.
    platformId: uuid("platform_id")
      .notNull()
      .references(() => platforms.id),
    brandGroup: varchar("brand_group", { length: 150 }),
    taskTypeId: uuid("task_type_id")
      .notNull()
      .references(() => taskTypes.id),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    statusName: varchar("status_name", { length: 30 }).notNull().default("Not Started"),
    priority: varchar("priority", { length: 10 }).notNull().default("Medium"),
    assignedDate: date("assigned_date").notNull(),
    dueDate: date("due_date"),
    completionDate: date("completion_date"),
    workResult: text("work_result"),
    // What's left to do — shown alongside workResult so admin can see progress without asking.
    remainingWork: text("remaining_work"),
    // Cumulative minutes logged across all approved update submissions for this task.
    timeSpentMinutes: integer("time_spent_minutes").notNull().default(0),
    clientUpdateSent: boolean("client_update_sent").notNull().default(false),
    updateTime: timestamp("update_time", { withTimezone: true }),
    updateSummary: text("update_summary"),
    isActive: boolean("is_active").notNull().default(true),
    // Soft-delete — see employees.deletedAt for the Recycle Bin mechanics.
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("tasks_assigned_date_idx").on(table.assignedDate),
    index("tasks_completion_date_idx").on(table.completionDate),
    // Covers "my tasks" / "tasks by status" lookups (admin/tasks, employee/tasks) in one index.
    index("tasks_assigned_to_status_idx").on(table.assignedTo, table.statusName),
    index("tasks_client_id_idx").on(table.clientId),
    index("tasks_deleted_at_idx").on(table.deletedAt),
  ]
);

// An employee's proposed change to a task (status/result/etc.) sits here until an admin
// approves or rejects it — tasks.* only changes on approval, so employees can't self-approve.
export const taskUpdateRequests = pgTable(
  "task_update_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    submittedBy: uuid("submitted_by")
      .notNull()
      .references(() => users.id),
    requestedStatus: varchar("requested_status", { length: 30 }).notNull(),
    workResult: text("work_result"),
    remainingWork: text("remaining_work"),
    // Minutes the employee logged against the task for this specific update — added to
    // tasks.timeSpentMinutes once the request is approved.
    timeSpentMinutes: integer("time_spent_minutes"),
    clientUpdateSent: boolean("client_update_sent").notNull().default(false),
    updateSummary: text("update_summary"),
    requestStatus: varchar("request_status", { length: 20 }).notNull().default("pending"),
    reviewNote: text("review_note"),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("task_update_requests_status_idx").on(table.requestStatus),
    index("task_update_requests_reviewed_at_idx").on(table.reviewedAt),
    index("task_update_requests_task_id_idx").on(table.taskId),
  ]
);

export const clientUpdateRegister = pgTable("client_update_register", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").references(() => tasks.id),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => users.id),
  updateDate: date("update_date").notNull(),
  summary: text("summary"),
  clientResponse: text("client_response"),
  followUpDate: date("follow_up_date"),
  nextUpdateDate: date("next_update_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const weeklyPlanner = pgTable(
  "weekly_planner",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => users.id),
    weekStartDate: date("week_start_date").notNull(),
    weekEndDate: date("week_end_date").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Matches the (employeeId, weekStartDate) lookup in saveWeeklyPlan's upsert-by-week logic.
    index("weekly_planner_employee_week_idx").on(table.employeeId, table.weekStartDate),
  ]
);

// A file (Cloudinary-hosted) attached to a task or a client update — exactly one of
// taskId/clientUpdateId is set per row.
export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
    clientUpdateId: uuid("client_update_id").references(() => clientUpdateRegister.id, {
      onDelete: "cascade",
    }),
    fileUrl: text("file_url").notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileType: varchar("file_type", { length: 100 }),
    uploadedBy: uuid("uploaded_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("attachments_task_id_idx").on(table.taskId),
    index("attachments_client_update_id_idx").on(table.clientUpdateId),
  ]
);

// In-app notification bell feed. `link` is a relative app path to navigate to on click.
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body"),
    link: text("link"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("notifications_user_id_is_read_idx").on(table.userId, table.isRead),
  ]
);

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, { fields: [users.roleId], references: [roles.id] }),
  employee: one(employees, { fields: [users.id], references: [employees.userId] }),
  notifications: many(notifications),
}));

export const employeesRelations = relations(employees, ({ one }) => ({
  user: one(users, { fields: [employees.userId], references: [users.id] }),
}));

export const platformsRelations = relations(platforms, ({ many }) => ({
  clients: many(clients),
  tasks: many(tasks),
}));

export const bossesRelations = relations(bosses, ({ many }) => ({
  clients: many(clients),
}));

export const taskTypesRelations = relations(taskTypes, ({ many }) => ({
  tasks: many(tasks),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  platform: one(platforms, { fields: [clients.platformId], references: [platforms.id] }),
  boss: one(bosses, { fields: [clients.bossId], references: [bosses.id] }),
  defaultEmployee: one(users, {
    fields: [clients.defaultEmployeeId],
    references: [users.id],
  }),
  tasks: many(tasks),
  updates: many(clientUpdateRegister),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  client: one(clients, { fields: [tasks.clientId], references: [clients.id] }),
  assignee: one(users, { fields: [tasks.assignedTo], references: [users.id] }),
  platform: one(platforms, { fields: [tasks.platformId], references: [platforms.id] }),
  taskType: one(taskTypes, { fields: [tasks.taskTypeId], references: [taskTypes.id] }),
  updates: many(clientUpdateRegister),
  updateRequests: many(taskUpdateRequests),
  attachments: many(attachments),
}));

export const taskUpdateRequestsRelations = relations(taskUpdateRequests, ({ one }) => ({
  task: one(tasks, { fields: [taskUpdateRequests.taskId], references: [tasks.id] }),
  submitter: one(users, {
    fields: [taskUpdateRequests.submittedBy],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [taskUpdateRequests.reviewedBy],
    references: [users.id],
  }),
}));

export const clientUpdateRegisterRelations = relations(clientUpdateRegister, ({ one, many }) => ({
  task: one(tasks, { fields: [clientUpdateRegister.taskId], references: [tasks.id] }),
  client: one(clients, { fields: [clientUpdateRegister.clientId], references: [clients.id] }),
  employee: one(users, {
    fields: [clientUpdateRegister.employeeId],
    references: [users.id],
  }),
  attachments: many(attachments),
}));

export const weeklyPlannerRelations = relations(weeklyPlanner, ({ one }) => ({
  employee: one(users, { fields: [weeklyPlanner.employeeId], references: [users.id] }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  task: one(tasks, { fields: [attachments.taskId], references: [tasks.id] }),
  clientUpdate: one(clientUpdateRegister, {
    fields: [attachments.clientUpdateId],
    references: [clientUpdateRegister.id],
  }),
  uploader: one(users, { fields: [attachments.uploadedBy], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
