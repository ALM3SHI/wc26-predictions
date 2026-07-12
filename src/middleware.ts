import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Paths that stay reachable without a session. Everything else redirects to /login.
const PUBLIC_PATH_EXACT = new Set<string>([
  "/login",
  "/signup",
  "/manifest.webmanifest",
  "/sw.js",
  "/favicon.ico",
  "/robots.txt",
]);

const PUBLIC_PATH_PREFIX = [
  "/api/auth", // OAuth callback + auth helpers
  "/api/cron", // header-authenticated cron routes
  "/icons/",
  "/flags/",
  "/images/",
  "/fonts/",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATH_EXACT.has(pathname)) return true;
  for (const p of PUBLIC_PATH_PREFIX) {
    if (pathname.startsWith(p)) return true;
  }
  return false;
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          supabaseResponse = NextResponse.next({
            request: { headers: request.headers },
          });
          supabaseResponse.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          supabaseResponse = NextResponse.next({
            request: { headers: request.headers },
          });
          supabaseResponse.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  // Refresh the session cookie if needed and read the user.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  // Not logged in → bounce to /login for every non-public path.
  if (!user && !isPublicPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    // Preserve the intended destination so login can redirect back.
    const next = pathname + (search || "");
    if (next && next !== "/") {
      loginUrl.searchParams.set("next", next);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Already logged in and visiting /login or /signup → send them home.
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match every path except static/next assets and image files.
     * The middleware body then decides whether it's public or gated.
     */
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|json)$).*)",
  ],
};
