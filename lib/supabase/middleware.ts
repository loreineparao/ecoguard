import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session tokens securely
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protected portal paths
  const isResidentRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/complaints") ||
    pathname.startsWith("/permits") ||
    pathname.startsWith("/schedules") ||
    pathname.startsWith("/settings");

  const isAdminRoute = pathname.startsWith("/admin");

  if (isResidentRoute || isAdminRoute) {
    // 1. Unauthenticated users redirected to login
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "Please sign in to access the portal.");
      return NextResponse.redirect(url);
    }

    // 2. Unconfirmed users MUST NOT access protected portal
    if (!user.email_confirmed_at) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set(
        "error",
        "Your email address has not been confirmed yet. Please verify your email or click below to resend the confirmation link."
      );
      return NextResponse.redirect(url);
    }

    // 3. Prevent deleted accounts or stale sessions from accessing protected portal
    if (user.user_metadata?.account_status === "deleted") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "Your account has been deleted and access is no longer permitted.");
      const response = NextResponse.redirect(url);
      request.cookies.getAll().forEach((c) => {
        if (c.name.includes("sb-") || c.name.includes("auth")) {
          response.cookies.delete(c.name);
        }
      });
      return response;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, deletion_status")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.deletion_status === "deleted") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "Your account has been deleted and access is no longer permitted.");
      const response = NextResponse.redirect(url);
      request.cookies.getAll().forEach((c) => {
        if (c.name.includes("sb-") || c.name.includes("auth")) {
          response.cookies.delete(c.name);
        }
      });
      return response;
    }

    // 4. Admin routes require admin role
    if (isAdminRoute && profile.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
