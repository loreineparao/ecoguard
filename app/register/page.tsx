"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await createClient().auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Registration successful. Please check your email to confirm your account.");
    }
    setLoading(false);
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
          <h1>Create resident account</h1>
          <p>Join the digital environmental service portal.</p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <div className="form-field">
            <label htmlFor="full-name">
              Full name <span aria-hidden="true">*</span>
            </label>
            <input
              id="full-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Juan Dela Cruz"
              autoComplete="name"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="register-email">
              Email address <span aria-hidden="true">*</span>
            </label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="register-password">
              Password <span aria-hidden="true">*</span>
            </label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              minLength={6}
              autoComplete="new-password"
              required
            />
          </div>

          <button
            className="button green auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create resident account"}
            {!loading && <ArrowRight size={16} aria-hidden="true" />}
          </button>

          {message && (
            <div
              className={`notice ${message.startsWith("Registration") ? "success" : "error"}`}
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
          Already have an account? <Link href="/login">Sign in</Link>
        </div>
      </section>
    </main>
  );
}
