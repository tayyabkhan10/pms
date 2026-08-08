CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid,
	"client_update_id" uuid,
	"file_url" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(100),
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text,
	"link" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "task_update_requests" ADD COLUMN "time_spent_minutes" integer;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "priority" varchar(10) DEFAULT 'Medium' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "time_spent_minutes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_client_update_id_client_update_register_id_fk" FOREIGN KEY ("client_update_id") REFERENCES "public"."client_update_register"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attachments_task_id_idx" ON "attachments" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "attachments_client_update_id_idx" ON "attachments" USING btree ("client_update_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "clients_deleted_at_idx" ON "clients" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "employees_deleted_at_idx" ON "employees" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "tasks_deleted_at_idx" ON "tasks" USING btree ("deleted_at");