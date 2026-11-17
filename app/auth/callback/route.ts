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
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  // Determine correct public origin (respecting Vercel / reverse proxy headers)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const origin = isLocalEnv
    ? requestUrl.origin
    : forwardedHost
      ? `https://${forwardedHost}`
      : requestUrl.origin;

  const supabase = await createClient();

  // 1. Handle standard PKCE code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}?verified=true`);
    }
    console.error("Auth callback code exchange error:", error.message);
  }

  // 2. Handle token_hash verification (OTP / email confirm link)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}?verified=true`);
    }
    console.error("Auth callback verifyOtp error:", error.message);
  }

  // 3. Fallback when parameters are missing or exchange failed
  return NextResponse.redirect(
    `${origin}/login?error=Verification%20link%20has%20expired%20or%20is%20invalid.%20Please%20sign%20in%20or%20request%20a%20new%20confirmation%20email.`
  );
}
