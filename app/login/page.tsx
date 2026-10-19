
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      router.push("/dashboard");
      router.refresh();
    }

    setLoading(false);
  }

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(
        "If an account exists for that email, a password-reset link will be sent. Please check your inbox and spam folder."
      );
    }

    setLoading(false);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f4f7fb",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "white",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "8px",
            color: "#166534",
          }}
        >
          EcoGuard
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#666",
            marginBottom: "25px",
          }}
        >
          {resetMode ? "Reset Your Password" : "Resident Login"}
        </p>

        {resetMode ? (
          <form onSubmit={handlePasswordReset}>
            <label htmlFor="reset-email">Registered Email</label>

            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email"
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px",
                marginTop: "6px",
                marginBottom: "16px",
                border: "1px solid #ccc",
                borderRadius: "8px",
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: "#166534",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: loading ? "wait" : "pointer",
                fontWeight: "bold",
              }}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <button
              type="button"
              onClick={() => {
                setResetMode(false);
                setMessage("");
              }}
              style={{
                width: "100%",
                marginTop: "12px",
                padding: "10px",
                background: "white",
                color: "#166534",
                border: "1px solid #166534",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Back to Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <label htmlFor="login-email">Email</label>

            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px",
                marginTop: "6px",
                marginBottom: "16px",
                border: "1px solid #ccc",
                borderRadius: "8px",
              }}
            />

            <label htmlFor="login-password">Password</label>

            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px",
                marginTop: "6px",
                marginBottom: "8px",
                border: "1px solid #ccc",
                borderRadius: "8px",
              }}
            />

            <div style={{ textAlign: "right", marginBottom: "20px" }}>
              <button
                type="button"
                onClick={() => {
                  setResetMode(true);
                  setMessage("");
                }}
                style={{
                  border: "none",
                  background: "none",
                  color: "#166534",
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                }}
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: "#166534",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: loading ? "wait" : "pointer",
                fontWeight: "bold",
              }}
            >
              {loading ? "Signing In..." : "Login"}
            </button>
          </form>
        )}

        {message && (
          <p
            role="status"
            style={{
              marginTop: "20px",
              textAlign: "center",
              color: message.includes("If an account exists")
                ? "#166534"
                : "#dc2626",
              overflowWrap: "anywhere",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </main>
  );
}