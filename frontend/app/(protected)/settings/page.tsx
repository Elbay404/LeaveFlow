"use client";

import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ShieldCheck,
  LockKeyhole,
  Moon,
  Sun,
  ChevronRight,
  Settings as SettingsIcon,
  CheckCircle2,
} from "lucide-react";

import { getCurrentUser } from "@/lib/api";

type CurrentUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  active: boolean;
  mustChangePassword: boolean;
  role: string;
  department: string | null;
  managerId?: number | null;
  managerFirstName?: string | null;
  managerLastName?: string | null;
  managerEmail?: string | null;
  hireDate?: string | null;
  annualLeaveBalance?: number;
};

export default function SettingsPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {   loadUser();
}, []);

  const loadUser = async () => {
    try {
      const data = await getCurrentUser();
      setUser(data);
    } catch (error) {
      console.error("Failed to load user:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = () => {
    const nextValue = !darkMode;

    setDarkMode(nextValue);

    if (nextValue) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const formatDate = (date?: string | null) => {
    if (!date) return "Not provided";

    return new Date(date).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-2 pb-10 pt-10">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />

        <div className="h-[480px] animate-pulse rounded-[28px] bg-slate-200 dark:bg-slate-800" />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-48 animate-pulse rounded-[24px] bg-slate-200 dark:bg-slate-800" />
          <div className="h-48 animate-pulse rounded-[24px] bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="text-center">
          <User className="mx-auto h-10 w-10 text-slate-400" />

          <h2 className="mt-4 text-lg font-bold text-slate-800 dark:text-white">
            Unable to load your profile
          </h2>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Please refresh the page and try again.
          </p>
        </div>
      </div>
    );
  }

  const initials =
    `${user.firstName?.charAt(0) ?? ""}${user.lastName?.charAt(0) ?? ""}`.toUpperCase();

  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-2 pb-10 pt-10">

    <div className="mb-8 mt-10 px-1">
  <div className="flex items-center gap-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-100 shadow-sm dark:border-blue-800 dark:bg-blue-950">
      <SettingsIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
    </div>

    <div>
     <h1 className="text-[26px] font-extrabold tracking-tight text-slate-950 dark:!text-slate-950">
  Settings
</h1>

      <p className="mt-1 text-[13px] font-medium text-slate-500 dark:text-slate-400">
        Manage your account, profile and preferences.
      </p>
    </div>
  </div>
</div>

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_6px_25px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">

        <div className="relative h-36 overflow-hidden bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900">
          <div className="absolute -right-20 -top-32 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />

          <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-indigo-400/10 blur-3xl" />

          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-black/10" />
        </div>

        <div className="relative px-6 pb-7 sm:px-8">

          <div className="-mt-14 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

            <div className="flex items-end gap-5">

              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-[26px] border-[5px] border-white bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-3xl font-extrabold text-white shadow-2xl shadow-blue-900/30">
                {initials}
              </div>

              <div className="pb-1 pt-14">

                <h2 className="text-[25px] font-extrabold leading-tight tracking-tight text-slate-950 dark:text-white">
                  {fullName}
                </h2>

                <div className="mt-2 flex flex-wrap items-center gap-2">

                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {user.role}
                  </span>

                  {user.department && (
                    <>
                      <span className="text-slate-300 dark:text-slate-600">
                        •
                      </span>

                      <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                        {user.department}
                      </span>
                    </>
                  )}

                </div>

              </div>
            </div>

            <div className="mt-14 flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 dark:border-emerald-900/60 dark:bg-emerald-950/40">

              <CheckCircle2 className="h-4 w-4 text-emerald-500" />

              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {user.active ? "Active account" : "Inactive account"}
              </span>

            </div>

          </div>

          <div className="my-7 h-px bg-slate-200 dark:bg-slate-800" />

          <div className="mb-5">
            <h3 className="text-[17px] font-extrabold tracking-tight text-slate-950 dark:text-white">
              Account information
            </h3>

            <p className="mt-1 text-[12px] font-medium text-slate-500 dark:text-slate-400">
              Information associated with your company account.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">

            <ProfileInfo
              icon={Mail}
              label="Email"
              value={user.email}
            />

            <ProfileInfo
              icon={Phone}
              label="Phone"
              value={user.phone || "Not provided"}
            />

            <ProfileInfo
              icon={Building2}
              label="Department"
              value={user.department || "Not assigned"}
            />

            <ProfileInfo
              icon={BriefcaseBusiness}
              label="Role"
              value={user.role}
            />

            <ProfileInfo
              icon={CalendarDays}
              label="Hire date"
              value={formatDate(user.hireDate)}
            />

            <ProfileInfo
              icon={ShieldCheck}
              label="Leave balance"
              value={`${user.annualLeaveBalance ?? 0} days`}
            />

          </div>

        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition hover:shadow-[0_8px_30px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">

          <div className="flex items-start justify-between">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/60">
                <LockKeyhole className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Security
                </h3>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Protect your account
                </p>
              </div>

            </div>

          </div>

          <div className="mt-6">

            <button
              onClick={() => {
                window.location.href = "/change-password";
              }}
              className="group flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-100 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-800 dark:hover:bg-slate-750"
            >

              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  Change password
                </p>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Update your account password
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">

                <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400" />

              </div>

            </button>

          </div>

        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition hover:shadow-[0_8px_30px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">

          <div className="flex items-start justify-between">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-100 bg-purple-50 dark:border-purple-900 dark:bg-purple-950/60">

                {darkMode ? (
                  <Moon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                ) : (
                  <Sun className="h-5 w-5 text-purple-600" />
                )}

              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Appearance
                </h3>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Customize your experience
                </p>
              </div>

            </div>

          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-100 p-4 dark:border-slate-700 dark:bg-slate-800">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">

                {darkMode ? (
                  <Moon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <Sun className="h-4 w-4 text-amber-500" />
                )}

              </div>

              <div>

                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  Dark mode
                </p>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {darkMode
                    ? "Dark theme enabled"
                    : "Use the light theme"}
                </p>

              </div>

            </div>

            <button
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
              className={`relative h-7 w-12 rounded-full transition-all duration-300 ${
                darkMode
                  ? "bg-blue-600"
                  : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                  darkMode
                    ? "left-6"
                    : "left-1"
                }`}
              />
            </button>

          </div>

        </section>

      </div>

    </div>
  );
}

function ProfileInfo({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-slate-100/80 p-4 transition hover:border-blue-200 hover:bg-blue-50/50 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-blue-800 dark:hover:bg-slate-800">

      <div className="flex items-center gap-2">

        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">

          <Icon className="h-4 w-4 text-slate-500 transition group-hover:text-blue-600 dark:text-slate-400 dark:group-hover:text-blue-400" />

        </div>

        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {label}
        </span>

      </div>

      <p className="mt-3 truncate text-sm font-bold text-slate-900 dark:text-white">
        {value}
      </p>

    </div>
  );
}