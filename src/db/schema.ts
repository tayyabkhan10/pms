import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  date,
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

export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  designation: varchar("designation", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  hireDate: date("hire_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

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

export const clients = pgTable("clients", {
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tasks = pgTable("tasks", {
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
  assignedDate: date("assigned_date").notNull(),
  dueDate: date("due_date"),
  completionDate: date("completion_date"),
  workResult: text("work_result"),
  // What's left to do — shown alongside workResult so admin can see progress without asking.
  remainingWork: text("remaining_work"),
  clientUpdateSent: boolean("client_update_sent").notNull().default(false),
  updateTime: timestamp("update_time", { withTimezone: true }),
  updateSummary: text("update_summary"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// An employee's proposed change to a task (status/result/etc.) sits here until an admin
// approves or rejects it — tasks.* only changes on approval, so employees can't self-approve.
export const taskUpdateRequests = pgTable("task_update_requests", {
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
  clientUpdateSent: boolean("client_update_sent").notNull().default(false),
  updateSummary: text("update_summary"),
  requestStatus: varchar("request_status", { length: 20 }).notNull().default("pending"),
  reviewNote: text("review_note"),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

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

export const weeklyPlanner = pgTable("weekly_planner", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => users.id),
  weekStartDate: date("week_start_date").notNull(),
  weekEndDate: date("week_end_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one }) => ({
  role: one(roles, { fields: [users.roleId], references: [roles.id] }),
  employee: one(employees, { fields: [users.id], references: [employees.userId] }),
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

export const clientUpdateRegisterRelations = relations(clientUpdateRegister, ({ one }) => ({
  task: one(tasks, { fields: [clientUpdateRegister.taskId], references: [tasks.id] }),
  client: one(clients, { fields: [clientUpdateRegister.clientId], references: [clients.id] }),
  employee: one(users, {
    fields: [clientUpdateRegister.employeeId],
    references: [users.id],
  }),
}));

export const weeklyPlannerRelations = relations(weeklyPlanner, ({ one }) => ({
  employee: one(users, { fields: [weeklyPlanner.employeeId], references: [users.id] }),
}));
