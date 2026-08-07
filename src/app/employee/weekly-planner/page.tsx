import { db } from "@/db";
import { getCurrentUser } from "@/lib/auth";

export default async function EmployeeWeeklyPlannerPage() {
  const user = await getCurrentUser();

  const plans = user
    ? await db.query.weeklyPlanner.findMany({
        where: (w, { eq }) => eq(w.employeeId, user.id),
        orderBy: (w, { desc }) => [desc(w.weekStartDate)],
        limit: 12,
      })
    : [];

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900">My Weekly Plan</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Set by your admin — contact them for changes.
      </p>

      {plans.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-zinc-300 p-10 text-center">
          <p className="text-sm text-zinc-500">No weekly plan set yet.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-xl border border-zinc-200/70 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <p className="text-xs text-zinc-500">
                {plan.weekStartDate} – {plan.weekEndDate}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">
                {plan.notes || <span className="text-zinc-400">No notes.</span>}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
