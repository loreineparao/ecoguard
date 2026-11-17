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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read URL query parameters for feedback from /auth/callback
  const verifiedParam = searchParams.get("verified");
  const errorParam = searchParams.get("error");

  const defaultMessage =
    verifiedParam === "true"
      ? "Your email address has been successfully verified! You may now sign in."
      : errorParam
        ? decodeURIComponent(errorParam)
        : "";
  const defaultMessageType =
    verifiedParam === "true"
      ? "success"
      : errorParam
        ? "error"
        : "";
  const defaultCanResend = errorParam
    ? decodeURIComponent(errorParam).toLowerCase().includes("expired") ||
      decodeURIComponent(errorParam).toLowerCase().includes("invalid")
    : false;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;

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
    setLoading(true);
    setMessage("");
    setMessageType("");
    setCanResend(false);

    const supabase = createClient();

    if (resetMode) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login`,
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
      email: email.trim(),
      password,
    });

    if (error) {
      setMessage(error.message);
      setMessageType("error");
      // Check if unconfirmed email
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setCanResend(true);
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
          <strong style={{ fontSize: "20px", color: "var(--dark-forest)" }}>
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

        <form className="auth-form" onSubmit={submit}>
          <div className="form-field">
            <label htmlFor="email">
              Email address <span aria-hidden="true">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={loading}
            />
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
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
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
