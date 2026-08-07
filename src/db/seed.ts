import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import { encryptSecret } from "../lib/crypto";

async function main() {
  const {
    DATABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    SEED_ADMIN_NAME,
    SEED_ADMIN_EMAIL,
    SEED_ADMIN_PASSWORD,
  } = process.env;

  if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");
  if (!NEXT_PUBLIC_SUPABASE_URL) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

  const client = postgres(DATABASE_URL, { prepare: false });
  const db = drizzle(client, { schema });
  const supabaseAdmin = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Seeding roles...");
  const roleNames = ["admin", "employee"] as const;
  const roleIds: Record<string, string> = {};

  for (const name of roleNames) {
    const existing = await db.query.roles.findFirst({ where: eq(schema.roles.name, name) });
    if (existing) {
      roleIds[name] = existing.id;
      continue;
    }
    const [inserted] = await db.insert(schema.roles).values({ name }).returning();
    roleIds[name] = inserted.id;
  }
  console.log("Roles ready:", roleIds);

  if (SEED_ADMIN_EMAIL && SEED_ADMIN_PASSWORD) {
    const existingUser = await db.query.users.findFirst({
      where: eq(schema.users.email, SEED_ADMIN_EMAIL),
    });

    if (existingUser) {
      console.log("Bootstrap admin already exists, skipping.");
    } else {
      console.log("Creating bootstrap admin auth user...");
      let { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: SEED_ADMIN_EMAIL,
        password: SEED_ADMIN_PASSWORD,
        email_confirm: true,
        app_metadata: { role: "admin" },
      });

      if (error?.message.includes("already been registered")) {
        // Orphaned auth user from a previous run whose public.users row was cleared —
        // reuse it and reset its password/metadata rather than failing.
        const { data: list } = await supabaseAdmin.auth.admin.listUsers();
        const orphan = list?.users.find((u) => u.email === SEED_ADMIN_EMAIL);
        if (!orphan) throw new Error("Could not locate orphaned auth user to reuse");

        const updateResult = await supabaseAdmin.auth.admin.updateUserById(orphan.id, {
          password: SEED_ADMIN_PASSWORD,
          app_metadata: { role: "admin" },
        });
        data = { user: updateResult.data.user };
        error = updateResult.error;
      }

      if (error || !data.user) {
        throw new Error(`Failed to create admin auth user: ${error?.message}`);
      }

      await db.insert(schema.users).values({
        id: data.user.id,
        roleId: roleIds.admin,
        name: SEED_ADMIN_NAME ?? "Admin",
        email: SEED_ADMIN_EMAIL,
        passwordEncrypted: encryptSecret(SEED_ADMIN_PASSWORD),
      });
      console.log(`Bootstrap admin created: email=${SEED_ADMIN_EMAIL}`);
    }
  } else {
    console.log(
      "SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — skipping bootstrap admin creation."
    );
  }

  await client.end();
  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
