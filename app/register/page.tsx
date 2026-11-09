"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [fullName, setFullName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setMessage("");
    const { error } = await createClient().auth.signUp({ email, password, options: { data: { full_name: fullName } } });
    setMessage(error?.message ?? "Registration successful. Check your email to confirm your account."); setLoading(false);
  }
  return <main className="auth-page"><section className="auth-card"><div className="auth-brand"><span className="brand-mark">E</span><strong>EcoGuard</strong></div><h1>Create your account</h1><p>Join Mabini’s digital environmental service portal.</p><form className="auth-form" onSubmit={submit}><div className="form-field"><label htmlFor="full-name">Full name</label><input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Juan Dela Cruz" required /></div><div className="form-field"><label htmlFor="register-email">Email address</label><input id="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /></div><div className="form-field"><label htmlFor="register-password">Password</label><input id="register-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} required /></div><button className="button green" type="submit" disabled={loading}>{loading ? "Creating account…" : "Create resident account"}</button>{message && <div className={`notice ${message.startsWith("Registration") ? "success" : "error"}`} role="status">{message}</div>}</form><div className="auth-footer">Already have an account? <Link href="/login">Sign in</Link></div></section></main>;
}
