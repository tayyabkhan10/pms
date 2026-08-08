CREATE TABLE "bosses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(150),
	"phone" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_update_register" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid,
	"client_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"update_date" date NOT NULL,
	"summary" text,
	"client_response" text,
	"follow_up_date" date,
	"next_update_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"platform_id" uuid NOT NULL,
	"boss_id" uuid,
	"brand_group" varchar(150),
	"is_dream_weavers_group" boolean DEFAULT false NOT NULL,
	"default_employee_id" uuid,
	"store_link" text,
	"login_notes" text,
	"general_notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"designation" varchar(100),
	"phone" varchar(20),
	"hire_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employees_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "platforms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platforms_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "task_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "task_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "task_update_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"submitted_by" uuid NOT NULL,
	"requested_status" varchar(30) NOT NULL,
	"work_result" text,
	"remaining_work" text,
	"client_update_sent" boolean DEFAULT false NOT NULL,
	"update_summary" text,
	"request_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"review_note" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" varchar(50) NOT NULL,
	"client_id" uuid NOT NULL,
	"assigned_to" uuid NOT NULL,
	"platform_id" uuid NOT NULL,
	"brand_group" varchar(150),
	"task_type_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"status_name" varchar(30) DEFAULT 'Not Started' NOT NULL,
	"assigned_date" date NOT NULL,
	"due_date" date,
	"completion_date" date,
	"work_result" text,
	"remaining_work" text,
	"client_update_sent" boolean DEFAULT false NOT NULL,
	"update_time" timestamp with time zone,
	"update_summary" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tasks_task_id_unique" UNIQUE("task_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"role_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(150) NOT NULL,
	"password_encrypted" text NOT NULL,
	"avatar_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "weekly_planner" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"week_start_date" date NOT NULL,
	"week_end_date" date NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "client_update_register" ADD CONSTRAINT "client_update_register_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_update_register" ADD CONSTRAINT "client_update_register_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_update_register" ADD CONSTRAINT "client_update_register_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_boss_id_bosses_id_fk" FOREIGN KEY ("boss_id") REFERENCES "public"."bosses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_default_employee_id_users_id_fk" FOREIGN KEY ("default_employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_update_requests" ADD CONSTRAINT "task_update_requests_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_update_requests" ADD CONSTRAINT "task_update_requests_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_update_requests" ADD CONSTRAINT "task_update_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_task_type_id_task_types_id_fk" FOREIGN KEY ("task_type_id") REFERENCES "public"."task_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_planner" ADD CONSTRAINT "weekly_planner_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_update_requests_status_idx" ON "task_update_requests" USING btree ("request_status");--> statement-breakpoint
CREATE INDEX "task_update_requests_reviewed_at_idx" ON "task_update_requests" USING btree ("reviewed_at");--> statement-breakpoint
CREATE INDEX "task_update_requests_task_id_idx" ON "task_update_requests" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "tasks_assigned_date_idx" ON "tasks" USING btree ("assigned_date");--> statement-breakpoint
CREATE INDEX "tasks_completion_date_idx" ON "tasks" USING btree ("completion_date");--> statement-breakpoint
CREATE INDEX "tasks_assigned_to_status_idx" ON "tasks" USING btree ("assigned_to","status_name");--> statement-breakpoint
CREATE INDEX "tasks_client_id_idx" ON "tasks" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "weekly_planner_employee_week_idx" ON "weekly_planner" USING btree ("employee_id","week_start_date");