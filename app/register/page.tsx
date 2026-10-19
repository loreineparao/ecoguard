"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(
        "Registration successful! Please check your email to confirm your account."
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
          Create your resident account
        </p>

        <form onSubmit={handleRegister}>
          <label>Full Name</label>

          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            required
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "6px",
              marginBottom: "16px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          />

          <label>Email</label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "6px",
              marginBottom: "16px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          />

          <label>Password</label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            required
            minLength={6}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "6px",
              marginBottom: "20px",
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
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {message && (
          <p
            style={{
              marginTop: "20px",
              textAlign: "center",
              color: "#166534",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </main>
  );
}