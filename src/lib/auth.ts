import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Deduped per-request via React's cache(): layouts and the pages they render both call this,
// so without cache() every navigation paid for the Supabase Auth round-trip + DB join twice.
export const getCurrentUser = cache(async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const record = await db.query.users.findFirst({
    where: eq(users.id, authUser.id),
    with: { role: true },
  });

  if (!record) return null;

  return {
    id: record.id,
    name: record.name,
    email: record.email,
    avatarUrl: record.avatarUrl,
    role: record.role.name as "admin" | "employee",
  };
});
