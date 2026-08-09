import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// In dev, Next's hot-reload re-evaluates this module on every file change. Without caching
// the client on globalThis, each reload opens a new connection pool without closing the old
// one, quickly exhausting Supabase's session-pooler connection limit. Note this singleton is
// per-process only — Next spawns several worker processes, each with its own globalThis, so
// the *effective* connection ceiling is (max * worker count), not just `max`. Keep `max` low
// per process so that total stays well under Supabase's shared pooler limit even across workers.
const globalForDb = globalThis as unknown as {
  postgresClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.postgresClient ??
  postgres(process.env.DATABASE_URL, {
    prepare: false,
    // Was 2 — too easy for a single concurrent request (e.g. one notification poll, which
    // itself no longer runs 2 queries in parallel, but other pages still do via Promise.all)
    // to occupy the whole pool and make every other request — including login — queue behind
    // it. Still conservative enough to stay well under Supabase's shared pooler limit even
    // multiplied across Next's worker processes.
    max: 5,
    connect_timeout: 10,
    // Supabase's transaction pooler can silently drop idle backend connections without
    // closing the socket cleanly, which otherwise leaves postgres.js hanging on the next
    // query against a dead connection. Recycling connections proactively avoids that.
    idle_timeout: 10,
    max_lifetime: 60 * 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.postgresClient = client;
}

export const db = drizzle(client, { schema });
