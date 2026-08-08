import { isNull } from "drizzle-orm";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { requireAdmin } from "@/lib/authGuard";
import { toCSV, csvResponse } from "@/lib/csv";

export async function GET() {
  await requireAdmin();

  const rows = await db.query.clients.findMany({
    where: isNull(clients.deletedAt),
    with: { platform: true, boss: true, defaultEmployee: true },
    orderBy: (c, { asc }) => [asc(c.name)],
  });

  const csv = toCSV(
    rows.map((r) => ({
      name: r.name,
      platform: r.platform.name,
      boss: r.boss?.name ?? "",
      brandGroup: r.brandGroup ?? "",
      defaultEmployee: r.defaultEmployee?.name ?? "",
      isActive: r.isActive ? "Yes" : "No",
    })),
    [
      { key: "name", label: "Name" },
      { key: "platform", label: "Platform" },
      { key: "boss", label: "Boss" },
      { key: "brandGroup", label: "Brand/Group" },
      { key: "defaultEmployee", label: "Default Employee" },
      { key: "isActive", label: "Active" },
    ]
  );

  return csvResponse("clients.csv", csv);
}
