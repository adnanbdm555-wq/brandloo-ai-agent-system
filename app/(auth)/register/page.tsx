"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-indigo focus:outline-none focus:ring-1 focus:ring-indigo";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteFromUrl = searchParams.get("invite") ?? "";

  const [mode, setMode] = useState<"create" | "join">(inviteFromUrl ? "join" : "create");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [inviteCode, setInviteCode] = useState(inviteFromUrl);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload =
        mode === "create"
          ? { mode, name, email, password, agencyName }
          : { mode, name, email, password, inviteCode };

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { error: `Server error (${res.status}): Please check database connection.` };
      }

      if (!res.ok) {
        setError(data.error ?? "Registration failed. Please check your database connection.");
        setLoading(false);
        return;
      }

      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        setError("Account created — please sign in from the login page.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="font-display text-2xl text-ink">
        {mode === "create" ? "Start a new agency" : "Join your team"}
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        {mode === "create"
          ? "You'll be this agency's Super Admin."
          : "Ask a teammate for their agency's invite code."}
      </p>

      <div className="mt-5 flex rounded-lg border border-border p-1">
        <button
          type="button"
          onClick={() => setMode("create")}
          className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
            mode === "create" ? "bg-indigo text-white" : "text-muted hover:text-ink"
          }`}
        >
          Create new agency
        </button>
        <button
          type="button"
          onClick={() => setMode("join")}
          className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
            mode === "join" ? "bg-indigo text-white" : "text-muted hover:text-ink"
          }`}
        >
          Join with code
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "create" ? (
          <div>
            <label htmlFor="agencyName" className="block text-sm font-medium text-ink">
              Agency name
            </label>
            <input
              id="agencyName"
              required
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              className={inputClass}
              placeholder="Your Agency Name"
            />
          </div>
        ) : (
          <div>
            <label htmlFor="inviteCode" className="block text-sm font-medium text-ink">
              Invite code
            </label>
            <input
              id="inviteCode"
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className={inputClass}
              placeholder="a1b2c3d4e5"
            />
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-ink">
            Full name
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Adnan Karim"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="you@agency.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-ink">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="At least 8 characters"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-danger-light px-3.5 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-dark disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-indigo hover:text-indigo-dark">
          Sign in
        </Link>
      </p>
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
