import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/env";

const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];
const PUBLIC_PREFIXES = ["/auth/", "/offline", "/reset-password"];
const APP_PREFIXES = ["/home", "/reminders", "/notes", "/calendar", "/profile", "/settings"];

function matches(path: string, list: string[]) {
  return list.some((p) => path === p || path.startsWith(p.endsWith("/") ? p : `${p}/`));
}

/** Refreshes the Supabase session cookie and applies auth redirects. */
export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Demo mode (no Supabase configured): no auth, go straight to the app.
  if (!isSupabaseConfigured) {
    if (path === "/") return NextResponse.redirect(new URL("/home", request.url));
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // IMPORTANT: getClaims() validates the JWT; don't run code between client creation and this call.
  const { data } = await supabase.auth.getClaims();
  const isAuthed = Boolean(data?.claims?.sub);

  const redirect = (to: string) => {
    const url = request.nextUrl.clone();
    url.pathname = to;
    url.search = "";
    const res = NextResponse.redirect(url);
    // carry refreshed auth cookies across the redirect
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (matches(path, PUBLIC_PREFIXES)) return response;
  if (path === "/") return redirect(isAuthed ? "/home" : "/login");
  if (!isAuthed && matches(path, APP_PREFIXES)) return redirect("/login");
  if (isAuthed && matches(path, AUTH_ROUTES)) return redirect("/home");

  return response;
}
