import { db } from "@/db";
import { getEmployeeOptions } from "@/lib/options";
import { WeeklyPlannerClient } from "./WeeklyPlannerClient";

export default async function WeeklyPlannerPage() {
  const [rows, employees] = await Promise.all([
    db.query.weeklyPlanner.findMany({
      with: { employee: true },
      orderBy: (w, { desc }) => [desc(w.weekStartDate)],
      limit: 60,
    }),
    getEmployeeOptions(),
  ]);

  const plans = rows.map((r) => ({
    id: r.id,
    employeeId: r.employeeId,
    employeeName: r.employee.name,
    weekStartDate: r.weekStartDate,
    weekEndDate: r.weekEndDate,
    notes: r.notes,
  }));

  return <WeeklyPlannerClient plans={plans} employees={employees} />;
}
