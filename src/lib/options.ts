import { cache } from "react";
import { db } from "@/db";

// Shared dropdown-option loaders, reused by Client Master, Task Board, and Client Update
// Register forms — each is a single, cheap indexed query so pages that need several run them
// in parallel. Page-level caching is handled by Next's client Router Cache (see next.config.ts
// staleTimes) rather than a hand-rolled server cache here, since Next 16's revalidateTag/
// unstable_cache pairing proved unreliable for on-write invalidation in testing. Each loader is
// still wrapped in React's request-scoped cache() so multiple callers within one render tree
// (e.g. a page and a panel it renders) dedupe to a single query instead of re-querying.

export const getPlatformOptions = cache(async function getPlatformOptions() {
  const rows = await db.query.platforms.findMany({
    orderBy: (platforms, { asc }) => [asc(platforms.name)],
  });
  return rows.map((r) => ({ id: r.id, label: r.name }));
});

export const getBossOptions = cache(async function getBossOptions() {
  const rows = await db.query.bosses.findMany({
    orderBy: (bosses, { asc }) => [asc(bosses.name)],
  });
  return rows.map((r) => ({ id: r.id, label: r.name }));
});

export const getTaskTypeOptions = cache(async function getTaskTypeOptions() {
  const rows = await db.query.taskTypes.findMany({
    orderBy: (taskTypes, { asc }) => [asc(taskTypes.name)],
  });
  return rows.map((r) => ({ id: r.id, label: r.name }));
});

export const getEmployeeOptions = cache(async function getEmployeeOptions() {
  const rows = await db.query.employees.findMany({
    where: (employees, { isNull }) => isNull(employees.deletedAt),
    with: { user: true },
    orderBy: (employees, { asc }) => [asc(employees.createdAt)],
  });
  return rows
    .filter((r) => r.user.isActive)
    .map((r) => ({ id: r.user.id, label: r.user.name }));
});

export const getClientOptions = cache(async function getClientOptions() {
  const rows = await db.query.clients.findMany({
    where: (clients, { eq, and, isNull }) =>
      and(eq(clients.isActive, true), isNull(clients.deletedAt)),
    orderBy: (clients, { asc }) => [asc(clients.name)],
  });
  return rows.map((r) => ({ id: r.id, label: r.name }));
});
