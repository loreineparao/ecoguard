import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as
    | "signup"
    | "email"
    | "recovery"
    | "invite"
    | "magiclink"
    | null;
  const rawNext = requestUrl.searchParams.get("next");

  // Open-redirect protection: ensure destination is relative and strictly local
  let safeNext = "/dashboard";
  if (rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")) {
    safeNext = rawNext;
  }

  const isPasswordRecovery = type === "recovery" || safeNext.includes("reset-password");

  // Determine correct public origin (respecting Vercel x-forwarded-host)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const origin = isLocalEnv
    ? requestUrl.origin
    : forwardedHost
      ? `https://${forwardedHost}`
      : process.env.NEXT_PUBLIC_SITE_URL
        ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
        : requestUrl.origin;

  const supabase = await createClient();

  // 1. Handle standard PKCE code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (isPasswordRecovery) {
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }
      return NextResponse.redirect(`${origin}${safeNext}?verified=true`);
    }
    console.error("Auth callback code exchange error:", error.message);
  }

  // 2. Handle token_hash verification (OTP / email confirm link / recovery)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });
    if (!error) {
      if (isPasswordRecovery) {
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }
      return NextResponse.redirect(`${origin}${safeNext}?verified=true`);
    }
    console.error("Auth callback verifyOtp error:", error.message);
  }

  // 3. Fallback when parameters are missing or exchange failed
  const errorMsg = isPasswordRecovery
    ? "Password reset link has expired or is invalid. Please request a new link."
    : "Verification link has expired or is invalid. Please sign in or request a new confirmation email.";

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(errorMsg)}`
  );
}
