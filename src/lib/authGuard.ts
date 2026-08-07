import "server-only";
import { getCurrentUser } from "@/lib/auth";

// Defense-in-depth for Server Actions that manage credentials — middleware already
// blocks page navigation to /admin/*, but actions are called directly and should
// re-verify the caller's role themselves rather than relying solely on routing.
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Forbidden");
  }
  return user;
}
