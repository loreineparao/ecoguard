"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setMessage("");
    const supabase = createClient();
    const result = resetMode
      ? await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) setMessage(result.error.message);
    else if (resetMode) setMessage("If an account exists for that email, a reset link has been sent.");
    else { router.push("/dashboard"); router.refresh(); }
    setLoading(false);
  }

  return <main className="auth-page"><section className="auth-card">
    <div className="auth-brand"><span className="brand-mark">E</span><strong>EcoGuard</strong></div>
    <h1>{resetMode ? "Reset your password" : "Welcome back"}</h1>
    <p>{resetMode ? "Enter your registered email and we will send a secure reset link." : "Sign in to your environmental service portal."}</p>
    <form className="auth-form" onSubmit={submit}>
      <div className="form-field"><label htmlFor="email">Email address</label><input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /></div>
      {!resetMode && <div className="form-field"><label htmlFor="password">Password</label><input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required /></div>}
      {!resetMode && <button className="text-link" type="button" onClick={() => { setResetMode(true); setMessage(""); }}>Forgot password?</button>}
      <button className="button green" type="submit" disabled={loading}>{loading ? "Please wait…" : resetMode ? "Send reset link" : "Sign in"}</button>
      {message && <div className={`notice ${message.startsWith("If an") ? "success" : "error"}`} role="status">{message}</div>}
    </form>
    <div className="auth-footer">{resetMode ? <button className="text-link" type="button" onClick={() => { setResetMode(false); setMessage(""); }}>Back to sign in</button> : <>New to EcoGuard? <Link href="/register">Create a resident account</Link></>}</div>
  </section></main>;
}
