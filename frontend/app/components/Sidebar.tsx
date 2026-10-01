"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Balloon,
  BarChart3,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  NotebookDot,
  ShieldCheck,
  Users,
  WalletCards,
  X,
} from "lucide-react";

type SidebarProps = {
  permissions: string[];
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onCloseMobile: () => void;
};

type NavigationItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  permission?: string;
};

const navigationGroups = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        label: "Users",
        href: "/users",
        icon: Users,
        permission: "USER_READ",
      },
      {
        label: "Departments",
        href: "/departments",
        icon: Building2,
        permission: "DEPARTMENT_READ",
      },
      {
        label: "Leaves",
        href: "/leaves",
        icon: NotebookDot,
        permission: "LEAVE_READ_OWN",
      },
      {
  label: "Calendar",
  href: "/calendar",
  icon: CalendarDays,
},
      {
        label: "Holidays",
        href: "/holidays",
        icon: Balloon,
        permission: "HOLIDAY_READ",
      },
      {
        label: "Availability",
        href: "/availability",
        icon: BarChart3,
      },
      {
        label: "Leave Types",
        href: "/leave-types",
        icon: FileText,
        permission: "LEAVE_TYPE_READ",
      },
      {
  label: "My Leave Balance",
  href: "/my-leave-balance",
  icon: WalletCards,
},
    ],
  },
  {
    title: "Security",
    items: [
      {
        label: "Roles & Permissions",
        href: "/roles",
        icon: ShieldCheck,
        permission: "USER_UPDATE",
      },
    ],
  },
];

export default function Sidebar({
  permissions,
  collapsed,
  mobileOpen,
  onToggle,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();

  const canAccess = (item: NavigationItem) => {
    if (!item.permission) return true;
    return permissions.includes(item.permission);
  };

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:8080/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      window.location.replace("/login");
    }
  };

  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen flex-col
          border-r border-white/[0.08] bg-[#080f1f] text-white
          shadow-2xl shadow-black/30
          transition-all duration-300
          ${collapsed ? "w-[96px]" : "w-[280px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div
          className={`
            flex h-[104px] shrink-0 items-center border-b border-white/[0.08]
            ${collapsed ? "justify-center px-3" : "px-6"}
          `}
        >
          {!collapsed ? (
            <div className="flex items-center">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg shadow-blue-600/20">
                <span className="text-[25px] font-extrabold tracking-tight text-white">
                  LF
                </span>
              </div>

              <div className="ml-4">
                <div className="text-[22px] font-bold leading-none tracking-tight">
                  Leave<span className="text-blue-500">Flow</span>
                </div>
                <div className="mt-2 text-[9px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Leave Management
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg shadow-blue-600/20">
              <span className="text-[25px] font-extrabold tracking-tight text-white">
                LF
              </span>
            </div>
          )}

          <button
            onClick={onCloseMobile}
            aria-label="Close navigation"
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-7">
          {navigationGroups.map((group) => {
            const visibleItems = group.items.filter(canAccess);

            if (!visibleItems.length) return null;

            return (
              <div key={group.title} className="mb-8">
                {!collapsed && (
                  <p className="mb-4 px-3 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
                    {group.title}
                  </p>
                )}

                {collapsed && (
                  <div className="mx-2 mb-5 h-px bg-white/[0.07]" />
                )}

                <div className="space-y-2">
                  {visibleItems.map((item) => {
                    const active =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);

                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onCloseMobile}
                        title={collapsed ? item.label : undefined}
                        className={`
                          group relative flex h-14 items-center rounded-2xl
                          text-[15px] font-medium transition-all duration-200
                          ${collapsed ? "justify-center px-0" : "gap-4 px-4"}
                          ${
                            active
                              ? "bg-gradient-to-r from-blue-500/[0.18] to-blue-500/[0.06] text-white shadow-inner"
                              : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                          }
                        `}
                      >
                        {active && (
                          <span className="absolute left-0 h-8 w-[3px] rounded-r-full bg-blue-400 shadow-lg shadow-blue-500/40" />
                        )}

                        <Icon
                          className={`
                            h-[21px] w-[21px] shrink-0 transition-all duration-200
                            ${
                              active
                                ? "text-blue-400"
                                : "text-slate-500 group-hover:text-slate-300"
                            }
                          `}
                        />

                        {!collapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="shrink-0 border-t border-white/[0.08] p-4">
          <button
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
            className={`
              group flex h-14 w-full items-center rounded-2xl
              bg-red-500/[0.08] text-[15px] font-semibold text-red-400
              transition-all duration-200
              hover:bg-red-500/[0.15] hover:text-red-300
              active:scale-[0.98]
              ${collapsed ? "justify-center px-0" : "gap-4 px-4"}
            `}
          >
            <LogOut className="h-[21px] w-[21px] shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />

            {!collapsed && <span>Logout</span>}
          </button>

          <button
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`
              mt-3 hidden h-10 w-full items-center justify-center
              rounded-xl text-slate-500 transition-all duration-200
              hover:bg-white/[0.05] hover:text-white lg:flex
            `}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
