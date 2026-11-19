"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getAuthRedirectUrl } from "@/lib/site-url";
import { validateEmail } from "@/lib/validators";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read URL query parameters for feedback from /auth/confirm, /auth/callback, and reset flow
  const statusParam = searchParams.get("status");
  const verifiedParam = searchParams.get("verified");
  const verificationParam = searchParams.get("verification");
  const errorParam = searchParams.get("error");
  const messageParam = searchParams.get("message");
  const noticeParam = searchParams.get("notice");
  const emailParam = searchParams.get("email");

  const isVerifiedSuccess =
    statusParam === "verified" || verifiedParam === "true" || verifiedParam === "success";
  const isAlreadyVerified = statusParam === "already_verified";
  const isExpired =
    statusParam === "expired" ||
    verificationParam === "failed" ||
    (errorParam &&
      (decodeURIComponent(errorParam).toLowerCase().includes("expired") ||
        decodeURIComponent(errorParam).toLowerCase().includes("invalid")));

  const defaultMessage = isVerifiedSuccess
    ? "Email verified successfully! Your EcoGuard account is now activated. You can sign in to continue."
    : isAlreadyVerified
      ? "Your email address has already been verified. You may sign in to your account."
      : isExpired
        ? "Your verification link has expired. Please request a new confirmation email."
        : messageParam === "password_reset_success"
          ? "Your password has been successfully updated! You can now sign in with your new password."
          : noticeParam === "account_deactivated"
            ? "Your EcoGuard resident account has been successfully deactivated."
            : errorParam
              ? decodeURIComponent(errorParam)
              : "";

  const defaultMessageType =
    isVerifiedSuccess || isAlreadyVerified || messageParam === "password_reset_success" || noticeParam === "account_deactivated"
      ? "success"
      : isExpired || errorParam
        ? "error"
        : "";

  const defaultCanResend = isExpired;

  const [email, setEmail] = useState(emailParam ? decodeURIComponent(emailParam) : "");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(defaultMessage);
  const [messageType, setMessageType] = useState<"success" | "error" | "">(defaultMessageType);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);

  // Email confirmation resend states
  const [canResend, setCanResend] = useState(defaultCanResend);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function handleResendConfirmation() {
    const cleanEmail = email.trim();
    if (!cleanEmail || resendCooldown > 0) return;

    setResending(true);
    try {
      const supabase = createClient();
      const redirectUrl = getAuthRedirectUrl("/auth/confirm");

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: cleanEmail,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        setMessage(`Could not resend email: ${error.message}`);
        setMessageType("error");
      } else {
        setMessage(`A new verification link was sent to ${cleanEmail}. Check your inbox and Spam folder.`);
        setMessageType("success");
        setResendCooldown(60);
      }
    } catch {
      setMessage("Network error while requesting verification email.");
      setMessageType("error");
    } finally {
      setResending(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setMessageType("");
    setEmailError("");
    setPasswordError("");
    setCanResend(false);

    const cleanEmail = email.trim();
    let hasValidationError = false;

    // Validate email
    if (!cleanEmail) {
      setEmailError("Please enter your email address.");
      hasValidationError = true;
    } else {
      const emailValidation = validateEmail(cleanEmail);
      if (!emailValidation.isValid) {
        setEmailError(emailValidation.error || "Please enter a valid email address.");
        hasValidationError = true;
      }
    }

    // Validate password (only in normal sign-in mode)
    if (!resetMode) {
      if (!password) {
        setPasswordError("Please enter your password.");
        hasValidationError = true;
      }
    }

    if (hasValidationError) {
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (resetMode) {
      const redirectUrl = getAuthRedirectUrl("/auth/callback?next=/auth/reset-password");
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        setMessage(error.message);
        setMessageType("error");
      } else {
        setMessage("If an account exists for that email, a password reset link has been sent.");
        setMessageType("success");
      }
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      const errMsg = error.message.toLowerCase();

      // Check if unconfirmed email
      if (errMsg.includes("email not confirmed")) {
        setMessage("Your email address has not been confirmed yet. Please verify your email or click below to resend the confirmation link.");
        setMessageType("error");
        setCanResend(true);
        setPasswordError("");
        setEmailError("");
      } else if (
        errMsg.includes("invalid login credentials") ||
        errMsg.includes("invalid grant") ||
        errMsg.includes("invalid_credentials")
      ) {
        // Highlight password field with red border and generic error message; do not flag email format as invalid
        setPasswordError("Unable to sign in. Please check your email and password.");
        setEmailError("");
        setMessage("");
      } else {
        setMessage(error.message);
        setMessageType("error");
      }

      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profile?.role === "admin") {
        router.push("/admin");
        router.refresh();
        return;
      }
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="auth-page">
      <Link href="/" className="auth-back">
        <ArrowLeft size={16} aria-hidden="true" /> Back to EcoGuard
      </Link>

      <section className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">
            <ShieldCheck size={22} aria-hidden="true" />
          </span>
          <strong className="text-slate-900 dark:text-white" style={{ fontSize: "20px" }}>
            EcoGuard
          </strong>
        </div>

        <div className="auth-heading">
          <p className="eyebrow" style={{ justifyContent: "center" }}>
            Mabini, Batangas
          </p>
          <h1>{resetMode ? "Reset your password" : "Welcome back"}</h1>
          <p>
            {resetMode
              ? "Enter your registered email and we will send a secure reset link."
              : "Sign in to your environmental service portal"}
          </p>
        </div>

        <form className="auth-form" onSubmit={submit} noValidate>
          <div className="form-field">
            <label htmlFor="email">
              Email address <span aria-hidden="true">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (emailError) setEmailError("");
              }}
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={loading}
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? "email-error" : undefined}
              style={emailError ? { borderColor: "#DC2626" } : undefined}
            />
            {emailError && (
              <p id="email-error" className="field-error-text" role="alert">
                {emailError}
              </p>
            )}
          </div>

          {!resetMode && (
            <div className="form-field">
              <div className="form-label-row">
                <label htmlFor="password">
                  Password <span aria-hidden="true">*</span>
                </label>
                <button
                  className="text-link"
                  type="button"
                  onClick={() => {
                    setResetMode(true);
                    setMessage("");
                    setMessageType("");
                    setEmailError("");
                    setPasswordError("");
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="password-input-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={passwordError ? "password-error" : undefined}
                  style={passwordError ? { borderColor: "#DC2626" } : undefined}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <Eye size={18} aria-hidden="true" />
                  ) : (
                    <EyeOff size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p id="password-error" className="field-error-text" role="alert">
                  {passwordError}
                </p>
              )}
            </div>
          )}

          <button
            className="button green auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : resetMode
                ? "Send reset link"
                : "Sign in to Portal"}
            {!loading && <ArrowRight size={16} aria-hidden="true" />}
          </button>

          {message && (
            <div
              className={`notice ${messageType === "success" || message.startsWith("If an") ? "success" : "error"}`}
              role="alert"
            >
              {messageType === "success" && (
                <CheckCircle2 size={15} style={{ display: "inline", verticalAlign: "-2px", marginRight: "6px" }} />
              )}
              {message}
            </div>
          )}

          {canResend && (
            <button
              type="button"
              className="button secondary"
              onClick={handleResendConfirmation}
              disabled={resending || resendCooldown > 0}
              style={{ width: "100%", justifyContent: "center", marginTop: "8px", fontSize: "13px" }}
            >
              {resending ? (
                "Sending..."
              ) : resendCooldown > 0 ? (
                `Resend confirmation email in ${resendCooldown}s`
              ) : (
                <>
                  <RefreshCw size={13} aria-hidden="true" /> Resend confirmation email
                </>
              )}
            </button>
          )}
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="auth-footer">
          {resetMode ? (
            <button
              className="text-link"
              type="button"
              onClick={() => {
                setResetMode(false);
                setMessage("");
                setMessageType("");
                setEmailError("");
                setPasswordError("");
              }}
            >
              Back to sign in
            </button>
          ) : (
            <>
              New to EcoGuard?{" "}
              <Link href="/register">Create resident account</Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-page">
          <div className="auth-card" style={{ textAlign: "center", padding: "40px 20px" }}>
            <p className="hint">Loading EcoGuard sign-in...</p>
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
