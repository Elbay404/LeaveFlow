"use client";

import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

type TopNavProps = {
  firstName?: string;
  lastName?: string;
  role?: string;
  onMenuClick: () => void;
};

export default function TopNav({
  firstName,
  lastName,
  role,
  onMenuClick,
}: TopNavProps) {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);

  const initials =
    `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "U";

  const displayName =
    `${firstName ?? ""} ${lastName ?? ""}`.trim() || "User";

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:8080/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.replace("/login");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-[80px] items-center border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      <button
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="mr-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-blue-50 hover:text-blue-600 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center">
        <div className="mr-4 hidden h-10 w-[3px] rounded-full bg-blue-500 sm:block" />

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Workspace
          </p>

          <div className="mt-1 flex items-center gap-2">
            <span className="text-[15px] font-semibold text-slate-900">
              Management
            </span>

            <span className="h-1 w-1 rounded-full bg-blue-500" />

            <span className="text-xs text-slate-400">
              LeaveFlow
            </span>
          </div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button
          aria-label="Notifications"
          className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
        >
          <Bell className="h-[19px] w-[19px] transition-transform duration-200 group-hover:rotate-[-8deg]" />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-white" />
        </button>

        <div className="hidden h-9 w-px bg-slate-200 sm:block" />

        <div className="relative">
          <button
            onClick={() => setProfileOpen((value) => !value)}
            className={`
              flex items-center gap-3 rounded-2xl border px-2 py-1.5
              transition-all duration-200
              ${
                profileOpen
                  ? "border-blue-200 bg-blue-50"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }
            `}
          >
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0b1120] text-sm font-bold text-white shadow-sm">
                {initials}
              </div>

              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
            </div>

            <div className="hidden text-left sm:block">
              <p className="max-w-[140px] truncate text-sm font-semibold text-slate-900">
                {displayName}
              </p>

              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                {role ?? "User"}
              </p>
            </div>

            <ChevronDown
              className={`hidden h-4 w-4 text-slate-400 transition-transform sm:block ${
                profileOpen ? "rotate-180 text-blue-500" : ""
              }`}
            />
          </button>

          {profileOpen && (
            <>
              <button
                aria-label="Close profile menu"
                onClick={() => setProfileOpen(false)}
                className="fixed inset-0 z-40 cursor-default"
              />

              <div className="absolute right-0 top-[60px] z-50 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                <div className="relative overflow-hidden bg-[#0b1120] p-4">
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-500/20 blur-2xl" />

                  <div className="relative flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/20 text-sm font-bold text-blue-300">
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {displayName}
                      </p>

                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                        {role ?? "User"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <button
                    className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                      <UserRound className="h-4 w-4" />
                    </div>
                    Profile
                  </button>

                  <button
                    className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                      <Settings className="h-4 w-4" />
                    </div>
                    Settings
                  </button>

                  <div className="my-2 h-px bg-slate-100" />

                  <button
                    onClick={handleLogout}
                    className="group flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-red-500 transition hover:bg-red-50"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 transition group-hover:bg-red-100">
                      <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                    </div>
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}