import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Everything except API routes, Next internals, the service worker, manifest and static files
    "/((?!api|_next/static|_next/image|sw\\.js|manifest\\.webmanifest|icons/|icon\\.svg|favicon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)",
  ],
};
