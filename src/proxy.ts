import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 requires this exported either as a default export or named `proxy` — the
// auto-generated migration from middleware.ts only renamed the file, not this function name,
// which meant Next silently never invoked it at all (no auth/session-refresh logic was
// actually running on any request).
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
