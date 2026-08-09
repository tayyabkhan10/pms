import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // role is stamped into app_metadata when the account is created (see admin employee actions
  // and the seed script) so middleware can authorize routes from the JWT alone, no DB round trip.
  const role = user?.app_metadata?.role as "admin" | "employee" | undefined;

  // A signed-in user whose token carries no recognized role can't be routed anywhere safely —
  // without this, /admin and /employee redirect to each other forever (both branches below
  // treat "not my role" as "go to the other one"). Sign them out and send to login instead of
  // guessing, so the loop terminates and they can get a fresh, correctly-stamped session.
  if (user && role !== "admin" && role !== "employee" && pathname !== "/login") {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isPublicPath && role) {
    const url = request.nextUrl.clone();
    url.pathname = role === "admin" ? "/admin/dashboard" : "/employee/tasks";
    return NextResponse.redirect(url);
  }

  if (user && pathname.startsWith("/admin") && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/employee/tasks";
    return NextResponse.redirect(url);
  }

  if (user && pathname.startsWith("/employee") && role !== "employee") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
