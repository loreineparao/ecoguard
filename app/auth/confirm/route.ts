import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase Email Confirmation Route Handler
 * Endpoint: /auth/confirm
 *
 * Validates token_hash and type=email (or type=signup) using Supabase auth.verifyOtp().
 * Preserves authentication cookies and Supabase SSR session handling.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const token_hash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const email = searchParams.get("email");

  // Determine correct public origin (respecting Vercel x-forwarded-host)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const origin = isLocalEnv
    ? request.nextUrl.origin
    : forwardedHost
      ? `https://${forwardedHost}`
      : process.env.NEXT_PUBLIC_SITE_URL
        ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
        : request.nextUrl.origin;

  // Accept type=email, type=signup, or any valid EmailOtpType; default to 'email'
  const validOtpTypes: EmailOtpType[] = [
    "email",
    "signup",
    "recovery",
    "invite",
    "magiclink",
    "email_change",
  ];

  const primaryType: EmailOtpType =
    rawType && validOtpTypes.includes(rawType as EmailOtpType)
      ? (rawType as EmailOtpType)
      : "email";

  // 1. Verify token_hash if provided
  if (token_hash) {
    const supabase = await createClient();

    // Primary verification attempt with provided type (e.g. 'email')
    let { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: primaryType,
    });

    // Fallback: If 'email' was sent but Supabase registered the token as 'signup' (or vice-versa),
    // try the alternative signup/email OTP type
    if (error && (primaryType === "email" || primaryType === "signup")) {
      const fallbackType: EmailOtpType = primaryType === "email" ? "signup" : "email";
      const fallbackAttempt = await supabase.auth.verifyOtp({
        token_hash,
        type: fallbackType,
      });

      if (!fallbackAttempt.error && fallbackAttempt.data.user) {
        data = fallbackAttempt.data;
        error = null;
      }
    }

    if (!error && data.user) {
      // Password recovery redirect
      if (primaryType === "recovery") {
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }

      // Successful confirmation -> /login?verified=success
      return NextResponse.redirect(`${origin}/login?verified=success`);
    }

    // 2. If token verification returned an error, check if the account is already verified
    // (Prevents false expired errors if email scanners/link previews pre-fetched the link)
    const errMsg = error ? error.message.toLowerCase() : "";
    if (
      errMsg.includes("already") ||
      errMsg.includes("already confirmed") ||
      errMsg.includes("already verified")
    ) {
      return NextResponse.redirect(`${origin}/login?status=already_verified`);
    }

    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (currentUser?.email_confirmed_at) {
        return NextResponse.redirect(`${origin}/login?status=already_verified`);
      }
    } catch {
      // Ignore session read error
    }

    // 3. Token is expired or invalid -> /login?verification=failed
    const emailParam = email ? `&email=${encodeURIComponent(email)}` : "";
    return NextResponse.redirect(
      `${origin}/login?verification=failed&error=${encodeURIComponent(
        "Your verification link has expired. Please request a new confirmation email."
      )}${emailParam}`
    );
  }

  // 4. Missing token_hash -> /login?verification=failed
  return NextResponse.redirect(
    `${origin}/login?verification=failed&error=${encodeURIComponent(
      "Verification link is incomplete or missing. Please request a new confirmation email."
    )}`
  );
}
