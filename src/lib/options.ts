import { unstable_cache } from "next/cache";
import { db } from "@/db";

// Shared dropdown-option loaders, reused by Client Master, Task Board, and Client Update
// Register forms. Cached (tag-based) since master data changes rarely but is read on nearly
// every admin page — mutating actions call revalidateTag with the matching tag below.

export const getPlatformOptions = unstable_cache(
  async () => {
    const rows = await db.query.platforms.findMany({
      orderBy: (platforms, { asc }) => [asc(platforms.name)],
    });
    return rows.map((r) => ({ id: r.id, label: r.name }));
  },
  ["platform-options"],
  { tags: ["platforms"] }
);

export const getBossOptions = unstable_cache(
  async () => {
    const rows = await db.query.bosses.findMany({
      orderBy: (bosses, { asc }) => [asc(bosses.name)],
    });
    return rows.map((r) => ({ id: r.id, label: r.name }));
  },
  ["boss-options"],
  { tags: ["bosses"] }
);

export const getTaskTypeOptions = unstable_cache(
  async () => {
    const rows = await db.query.taskTypes.findMany({
      orderBy: (taskTypes, { asc }) => [asc(taskTypes.name)],
    });
    return rows.map((r) => ({ id: r.id, label: r.name }));
  },
  ["task-type-options"],
  { tags: ["task-types"] }
);

export const getEmployeeOptions = unstable_cache(
  async () => {
    const rows = await db.query.employees.findMany({
      with: { user: true },
      orderBy: (employees, { asc }) => [asc(employees.createdAt)],
    });
    return rows
      .filter((r) => r.user.isActive)
      .map((r) => ({ id: r.user.id, label: r.user.name }));
  },
  ["employee-options"],
  { tags: ["employees"] }
);

export const getClientOptions = unstable_cache(
  async () => {
    const rows = await db.query.clients.findMany({
      where: (clients, { eq }) => eq(clients.isActive, true),
      orderBy: (clients, { asc }) => [asc(clients.name)],
    });
    return rows.map((r) => ({ id: r.id, label: r.name }));
  },
  ["client-options"],
  { tags: ["clients"] }
);
