"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setMessage("");
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:8080/api/auth/forgot-password?email=${encodeURIComponent(
          email
        )}`,
        {
          method: "POST",
        }
      );

      const data = await response.text();

      if (!response.ok) {
        setSuccess(false);

        try {
          const json = JSON.parse(data);
          setMessage(
            json.message || "Something went wrong. Please try again."
          );
        } catch {
          setMessage(
            data || "Something went wrong. Please try again."
          );
        }

        return;
      }

      setSuccess(true);
      setMessage(
        data || "Password reset instructions have been sent."
      );
    } catch (error) {
      console.error(error);
      setSuccess(false);
      setMessage(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020817] px-6 py-12 text-white">

      <div className="absolute -left-40 top-[-100px] h-[500px] w-[500px] rounded-full bg-[#087cff]/10 blur-[130px]" />

      <div className="absolute bottom-[-180px] right-[-100px] h-[500px] w-[500px] rounded-full bg-[#0645a5]/15 blur-[130px]" />

      <div className="absolute left-6 top-6">
        <img
          src="/images/logo.png"
          alt="LeaveFlow"
          className="w-[190px]"
        />
      </div>

      <div className="relative z-10 w-full max-w-[520px] animate-[fadeUp_0.7s_ease-out]">

        <div className="rounded-[30px] border border-white/[0.12] bg-[#06152b]/80 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:p-10 lg:p-12">

          <Link
            href="/login"
            className="mb-10 inline-flex items-center gap-2 text-sm text-[#7595b7] transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Back to login
          </Link>

          <div className="mb-8">

            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1687ff]/10 text-[#3fa4ff] shadow-[0_0_30px_rgba(22,135,255,0.12)]">
              <Mail size={26} />
            </div>

            <div className="mb-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#3fa4ff]">
              <span className="h-2 w-2 rounded-full bg-[#1687ff] shadow-[0_0_14px_#1687ff]" />
              Account recovery
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Forgot your{" "}
              <span className="text-[#1687ff]">
                password?
              </span>
            </h1>

            <p className="mt-4 text-base leading-7 text-[#829dbc]">
              Enter your work email and we'll send you a secure
              link to reset your password.
            </p>

          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            <div>

              <label className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.25em] text-[#89a4c1]">
                Work email
              </label>

              <div className="group relative">

                <Mail
                  size={20}
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-[#6283a5] transition-all duration-300 group-focus-within:scale-110 group-focus-within:text-[#1687ff]"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 w-full rounded-2xl border border-white/[0.12] bg-[#071a33] pl-14 pr-5 text-[15px] text-white outline-none transition-all duration-300 placeholder:text-[#526d8b] hover:border-white/[0.22] focus:border-[#1687ff] focus:bg-[#0a1f3c] focus:ring-4 focus:ring-[#1687ff]/10 disabled:opacity-60"
                  placeholder="you@company.com"
                  required
                  disabled={loading}
                />

              </div>

            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#0878ff] via-[#1687ff] to-[#2da8ff] text-[15px] font-semibold text-white shadow-[0_12px_35px_rgba(22,135,255,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(22,135,255,0.45)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >

              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

              {loading ? (
                <>
                  <Loader2
                    size={19}
                    className="mr-2 animate-spin"
                  />
                  Sending...
                </>
              ) : (
                <>
                  Send reset link
                  <ArrowRight
                    size={19}
                    className="ml-2 transition-transform duration-300 group-hover:translate-x-1"
                  />
                </>
              )}

            </button>

          </form>

          <div className="mt-8 flex items-center justify-center gap-2 border-t border-white/10 pt-7 text-[11px] text-[#637f9e]">
            <ShieldCheck size={15} />
            Your account security matters
          </div>

        </div>

      </div>

      {message && (
        <div className="fixed right-6 top-6 z-[100] w-[calc(100%-48px)] max-w-[430px] animate-[toastIn_0.4s_cubic-bezier(0.16,1,0.3,1)]">

          <div
            className={`relative overflow-hidden rounded-2xl border bg-[#07182e]/95 p-5 shadow-[0_25px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl ${
              success
                ? "border-[#1687ff]/20"
                : "border-red-400/20"
            }`}
          >

            <div className="flex items-start gap-4">

              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  success
                    ? "bg-[#1687ff]/10 text-[#3fa4ff]"
                    : "bg-red-400/10 text-red-400"
                }`}
              >
                {success ? (
                  <CheckCircle2 size={22} />
                ) : (
                  <AlertCircle size={21} />
                )}
              </div>

              <div className="min-w-0 flex-1">

                <div className="flex items-center justify-between gap-3">

                  <h3 className="text-sm font-semibold text-white">
                    {success
                      ? "Reset link sent"
                      : "Request failed"}
                  </h3>

                  <button
                    type="button"
                    onClick={() => setMessage("")}
                    className="rounded-lg p-1 text-[#607b98] transition hover:bg-white/5 hover:text-white"
                  >
                    ×
                  </button>

                </div>

                <p className="mt-1.5 text-sm leading-5 text-[#8da6c2]">
                  {message}
                </p>

              </div>

            </div>

            <div
              className={`absolute bottom-0 left-0 h-[2px] w-full ${
                success
                  ? "bg-[#1687ff]"
                  : "bg-red-400"
              }`}
            />

          </div>

        </div>
      )}

    </main>
  );
}