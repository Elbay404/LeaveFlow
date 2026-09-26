"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  CalendarDays,
  Users,
  BarChart3,
} from "lucide-react";

import GuestGuard from "../../components/GuestGuard";

type ToastType = "success" | "error" | "warning";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [toastType, setToastType] = useState<ToastType>("error");

  const router = useRouter();
  const searchParams = useSearchParams();

  const redirect = searchParams.get("redirect");

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8080/api/auth/login",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      console.log("Status:", response.status);
      console.log("Response:", data);

      if (!response.ok) {
        if (response.status === 429) {
          setToastType("warning");
        } else {
          setToastType("error");
        }

        setError(
          data.message ||
            "Unable to sign in. Please try again."
        );

        return;
      }

      if (data.mustChangePassword) {
        setSuccess(
          "Login successful. Let's secure your account."
        );

        setTimeout(() => {
          router.push("/change-password");
        }, 700);

        return;
      }

      setSuccess("Welcome back!");

      setTimeout(() => {
        router.push(redirect || "/dashboard");
      }, 700);
    } catch (error) {
      console.error(error);

      setToastType("error");

      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestGuard>
      <main className="min-h-screen overflow-hidden bg-[#020817] text-white">

        <div className="grid min-h-screen lg:grid-cols-[55%_45%]">

          <section className="relative hidden overflow-hidden lg:block">

            <img
              src="/images/login.png"
              alt="LeaveFlow leave management"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-[#020817]/30 via-transparent to-[#020817]/80" />

            <div className="absolute inset-0 bg-gradient-to-t from-[#020817]/30 via-transparent to-transparent" />

            <div className="absolute -left-32 top-1/4 h-96 w-96 animate-pulse rounded-full bg-[#1687ff]/20 blur-[120px]" />

            <div className="absolute bottom-[-150px] left-1/3 h-96 w-96 rounded-full bg-[#006eff]/20 blur-[120px]" />

            <div className="relative z-10 flex h-full flex-col p-10 xl:p-14">

              <div className="animate-[fadeDown_0.7s_ease-out]">

                <img
                  src="/images/logo.png"
                  alt="LeaveFlow - Leave Management"
                  className="h-auto w-[210px]"
                />

              </div>

              <div className="mt-20 max-w-[520px] animate-[fadeUp_0.9s_ease-out]">

                <div className="mb-5 flex items-center gap-3">

                  <span className="h-px w-12 bg-[#1687ff] shadow-[0_0_10px_#1687ff]" />

                  <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#65b5ff]">
                    Simple • Efficient • For teams
                  </span>

                </div>

                <h2 className="text-5xl font-bold leading-[0.98] tracking-tight xl:text-[64px]">

                  Time off,
                  <br />

                  made{" "}

                  <span className="relative text-[#1687ff]">

                    simple.

                    <span className="absolute -bottom-2 left-0 h-[3px] w-full rounded-full bg-[#1687ff] shadow-[0_0_18px_#1687ff]" />

                  </span>

                </h2>

                <p className="mt-7 max-w-[500px] text-[15px] leading-7 text-[#b4cbe5]">

                  Request, approve and track leave in one place —
                  designed for modern teams who value balance,
                  productivity and simplicity.

                </p>

                <div className="mt-8 flex w-full max-w-[470px] flex-col gap-3">

                  <div className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-[#071a33]/65 px-4 py-3 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1687ff]/50 hover:bg-[#0a2343]/80 hover:shadow-[0_10px_30px_rgba(22,135,255,0.12)]">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0878ff]/15 text-[#1687ff] transition-transform duration-300 group-hover:scale-105">

                      <CalendarDays size={24} />

                    </div>

                    <div className="flex-1">

                      <h3 className="text-sm font-semibold text-white">
                        Plan your time easily
                      </h3>

                      <p className="mt-1 text-xs text-[#7895b5]">
                        Organize your leave with ease
                      </p>

                    </div>

                    <ArrowRight
                      size={19}
                      className="text-[#1687ff] transition-transform duration-300 group-hover:translate-x-1"
                    />

                  </div>

                  <div className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-[#071a33]/65 px-4 py-3 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1687ff]/50 hover:bg-[#0a2343]/80 hover:shadow-[0_10px_30px_rgba(22,135,255,0.12)]">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0878ff]/15 text-[#1687ff] transition-transform duration-300 group-hover:scale-105">

                      <Users size={24} />

                    </div>

                    <div className="flex-1">

                      <h3 className="text-sm font-semibold text-white">
                        Keep your team aligned
                      </h3>

                      <p className="mt-1 text-xs text-[#7895b5]">
                        Better visibility and collaboration
                      </p>

                    </div>

                    <ArrowRight
                      size={19}
                      className="text-[#1687ff] transition-transform duration-300 group-hover:translate-x-1"
                    />

                  </div>

                  <div className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-[#071a33]/65 px-4 py-3 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1687ff]/50 hover:bg-[#0a2343]/80 hover:shadow-[0_10px_30px_rgba(22,135,255,0.12)]">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0878ff]/15 text-[#1687ff] transition-transform duration-300 group-hover:scale-105">

                      <BarChart3 size={24} />

                    </div>

                    <div className="flex-1">

                      <h3 className="text-sm font-semibold text-white">
                        Stay productive
                      </h3>

                      <p className="mt-1 text-xs text-[#7895b5]">
                        Focus on what matters
                      </p>

                    </div>

                    <ArrowRight
                      size={19}
                      className="text-[#1687ff] transition-transform duration-300 group-hover:translate-x-1"
                    />

                  </div>

                  <div className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-[#071a33]/65 px-4 py-3 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1687ff]/50 hover:bg-[#0a2343]/80 hover:shadow-[0_10px_30px_rgba(22,135,255,0.12)]">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0878ff]/15 text-[#1687ff] transition-transform duration-300 group-hover:scale-105">

                      <ShieldCheck size={24} />

                    </div>

                    <div className="flex-1">

                      <h3 className="text-sm font-semibold text-white">
                        Secure & reliable
                      </h3>

                      <p className="mt-1 text-xs text-[#7895b5]">
                        Your data is safe with us
                      </p>

                    </div>

                    <ArrowRight
                      size={19}
                      className="text-[#1687ff] transition-transform duration-300 group-hover:translate-x-1"
                    />

                  </div>

                </div>

              </div>

              <div className="mt-auto text-xs text-[#7594b5]">
                © {new Date().getFullYear()} LeaveFlow
              </div>

            </div>

          </section>

          <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12 sm:px-10">

            <div className="absolute right-[-150px] top-[-150px] h-[450px] w-[450px] rounded-full bg-[#087cff]/10 blur-[120px]" />

            <div className="absolute bottom-[-150px] left-[-100px] h-[400px] w-[400px] rounded-full bg-[#0645a5]/10 blur-[120px]" />

            <div className="absolute left-6 top-6 lg:hidden">

              <img
                src="/images/logo.png"
                alt="LeaveFlow"
                className="w-[180px]"
              />

            </div>

            <div className="relative z-10 w-full max-w-[560px] animate-[fadeUp_0.7s_ease-out]">

              <div className="rounded-[30px] border border-white/[0.12] bg-[#06152b]/75 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:p-10 lg:p-12">

                <div className="mb-10">

                  <div className="mb-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#3fa4ff]">

                    <span className="h-2 w-2 rounded-full bg-[#1687ff] shadow-[0_0_14px_#1687ff]" />

                    Welcome back

                  </div>

                  <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">

                    Sign in to{" "}

                    <span className="text-[#1687ff]">
                      LeaveFlow
                    </span>

                  </h1>

                  <p className="mt-4 max-w-lg text-base leading-7 text-[#829dbc]">

                    Access your account to manage your leave,
                    view your requests and stay connected with your team.

                  </p>

                </div>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-7"
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
                        onChange={(e) =>
                          setEmail(e.target.value)
                        }
                        placeholder="you@company.com"
                        required
                        disabled={loading}
                        className="h-14 w-full rounded-2xl border border-white/[0.12] bg-[#071a33] pl-14 pr-5 text-[15px] text-white outline-none transition-all duration-300 placeholder:text-[#526d8b] hover:border-white/[0.22] focus:border-[#1687ff] focus:bg-[#0a1f3c] focus:ring-4 focus:ring-[#1687ff]/10 disabled:cursor-not-allowed disabled:opacity-60"
                      />

                    </div>

                  </div>

                  <div>

                    <label className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.25em] text-[#89a4c1]">
                      Password
                    </label>

                    <div className="group relative">

                      <LockKeyhole
                        size={20}
                        className="absolute left-5 top-1/2 -translate-y-1/2 text-[#6283a5] transition-all duration-300 group-focus-within:scale-110 group-focus-within:text-[#1687ff]"
                      />

                      <input
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        value={password}
                        onChange={(e) =>
                          setPassword(e.target.value)
                        }
                        placeholder="Enter your password"
                        required
                        disabled={loading}
                        className="h-14 w-full rounded-2xl border border-white/[0.12] bg-[#071a33] pl-14 pr-14 text-[15px] text-white outline-none transition-all duration-300 placeholder:text-[#526d8b] hover:border-white/[0.22] focus:border-[#1687ff] focus:bg-[#0a1f3c] focus:ring-4 focus:ring-[#1687ff]/10 disabled:cursor-not-allowed disabled:opacity-60"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2.5 text-[#6283a5] transition-all duration-200 hover:bg-white/[0.06] hover:text-[#3fa4ff]"
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>

                    </div>

                  </div>

                  <div className="flex justify-end">

                    <Link
                      href="/forgot-password"
                      className="text-sm font-medium text-[#3fa4ff] transition hover:text-white hover:underline"
                    >
                      Forgot password?
                    </Link>

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

                        Signing in...
                      </>
                    ) : (
                      <>
                        Log in

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

                  Secure, private, and built for teams

                </div>

              </div>

            </div>

          </section>

        </div>

        {error && (
          <div className="fixed right-6 top-6 z-[100] w-[calc(100%-48px)] max-w-[430px] animate-[toastIn_0.4s_cubic-bezier(0.16,1,0.3,1)]">

            <div
              className={`relative overflow-hidden rounded-2xl border bg-[#07182e]/95 p-5 shadow-[0_25px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl ${
                toastType === "warning"
                  ? "border-yellow-400/20"
                  : "border-red-400/20"
              }`}
            >

              <div className="flex items-start gap-4">

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    toastType === "warning"
                      ? "bg-yellow-400/10 text-yellow-400"
                      : "bg-red-400/10 text-red-400"
                  }`}
                >

                  {toastType === "warning" ? (
                    <span className="text-xl">
                      ⏱
                    </span>
                  ) : (
                    <AlertCircle size={21} />
                  )}

                </div>

                <div className="min-w-0 flex-1">

                  <div className="flex items-center justify-between gap-3">

                    <h3 className="text-sm font-semibold text-white">

                      {toastType === "warning"
                        ? "Too many attempts"
                        : "Sign in failed"}

                    </h3>

                    <button
                      type="button"
                      onClick={() => setError("")}
                      className="rounded-lg p-1 text-[#607b98] transition hover:bg-white/5 hover:text-white"
                    >
                      ×
                    </button>

                  </div>

                  <p className="mt-1.5 text-sm leading-5 text-[#8da6c2]">
                    {error}
                  </p>

                </div>

              </div>

              <div
                className={`absolute bottom-0 left-0 h-[2px] animate-[toastProgress_5s_linear_forwards] ${
                  toastType === "warning"
                    ? "bg-yellow-400"
                    : "bg-red-400"
                }`}
              />

            </div>

          </div>
        )}

        {success && (
          <div className="fixed right-6 top-6 z-[100] w-[calc(100%-48px)] max-w-[430px] animate-[toastIn_0.4s_cubic-bezier(0.16,1,0.3,1)]">

            <div className="relative overflow-hidden rounded-2xl border border-[#1687ff]/20 bg-[#07182e]/95 p-5 shadow-[0_25px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1687ff]/10 text-[#3fa4ff]">
                  <CheckCircle2 size={22} />
                </div>

                <div className="flex-1">

                  <div className="flex items-center justify-between">

                    <h3 className="text-sm font-semibold text-white">
                      Welcome back
                    </h3>

                    <button
                      type="button"
                      onClick={() => setSuccess("")}
                      className="rounded-lg p-1 text-[#607b98] transition hover:bg-white/5 hover:text-white"
                    >
                      ×
                    </button>

                  </div>

                  <p className="mt-1.5 text-sm leading-5 text-[#8da6c2]">
                    {success}
                  </p>

                </div>

              </div>

              <div className="absolute bottom-0 left-0 h-[2px] w-full animate-[toastProgress_2s_linear_forwards] bg-[#1687ff]" />

            </div>

          </div>
        )}

      </main>
    </GuestGuard>
  );
}