"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();

    if (resetMode) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("If an account exists for that email, a reset link has been sent.");
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
              className={`notice ${message.startsWith("If an") ? "success" : "error"}`}
              role="alert"
            >
              {message}
            </div>
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
