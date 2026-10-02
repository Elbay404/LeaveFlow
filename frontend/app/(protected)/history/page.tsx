"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  ChevronRight,
  Clock3,
  FileClock,
  Filter,
  History,
  Search,
  UserRound,
} from "lucide-react";

import {
  getAuditHistory,
  getAuditLogs,
} from "@/lib/api";

import AuditDetailDrawer from "@/app/components/audit/AuditDetailDrawer";

type AuditLog = {
  entityType: string;
  entityId: number;
  action: string;
  username: string | null;
  timestamp: string;
  revision: number;
};

type AuditChange = {
  field: string;
  oldValue: string | null;
  newValue: string | null;
};

type AuditDetail = AuditLog & {
  changes: AuditChange[];
};

const formatDateTime = (value: string) => {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const getActionStyle = (action: string) => {
  switch (action) {
    case "CREATED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "UPDATED":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "DELETED":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const getEntityStyle = (entityType: string) => {
  switch (entityType) {
    case "USER":
      return "bg-blue-50 text-blue-700";

    case "LEAVE":
      return "bg-violet-50 text-violet-700";

    case "ROLE":
      return "bg-amber-50 text-amber-700";

    case "DEPARTMENT":
      return "bg-emerald-50 text-emerald-700";

    case "LEAVE_TYPE":
      return "bg-cyan-50 text-cyan-700";

    default:
      return "bg-slate-50 text-slate-700";
  }
};

export default function HistoryPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");

  const [selectedAudit, setSelectedAudit] =
    useState<AuditDetail | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    getAuditLogs()
      .then((data) => {
        setLogs(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setLogs([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredLogs = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return logs.filter((log) => {

      const matchesSearch =
        !normalizedSearch ||
        log.entityType
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(log.entityId)
          .includes(normalizedSearch) ||
        (log.username || "")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesEntity =
        entityFilter === "ALL" ||
        log.entityType === entityFilter;

      const matchesAction =
        actionFilter === "ALL" ||
        log.action === actionFilter;

      return (
        matchesSearch &&
        matchesEntity &&
        matchesAction
      );
    });
  }, [
    logs,
    search,
    entityFilter,
    actionFilter,
  ]);

  const openDetails = async (log: AuditLog) => {
    setDetailLoading(true);
    setDrawerOpen(true);

    try {
      const history = await getAuditHistory(
        log.entityType,
        log.entityId,
      );

      const detail = history.find(
        (item: AuditDetail) =>
          item.revision === log.revision,
      );

      if (detail) {
        setSelectedAudit(detail);
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedAudit(null);
  };

  return (
    <div className="min-h-full bg-[#f6f8fb] p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
                <History className="h-5 w-5 text-white" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  History
                </h1>

                <p className="text-sm text-slate-500">
                  Track changes made across your system.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <Activity className="h-4 w-4 text-blue-600" />

            <span className="text-sm font-medium text-slate-700">
              {filteredLogs.length} events
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search user, entity or ID..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={entityFilter}
              onChange={(event) =>
                setEntityFilter(event.target.value)
              }
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="ALL">
                All entities
              </option>

              <option value="USER">
                Users
              </option>

              <option value="LEAVE">
                Leaves
              </option>

              <option value="ROLE">
                Roles
              </option>

              <option value="DEPARTMENT">
                Departments
              </option>

              <option value="LEAVE_TYPE">
                Leave Types
              </option>
            </select>

            <select
              value={actionFilter}
              onChange={(event) =>
                setActionFilter(event.target.value)
              }
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="ALL">
                All actions
              </option>

              <option value="CREATED">
                Created
              </option>

              <option value="UPDATED">
                Updated
              </option>

              <option value="DELETED">
                Deleted
              </option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                Loading history...
              </div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <FileClock className="h-7 w-7 text-slate-400" />
              </div>

              <h3 className="text-base font-semibold text-slate-900">
                No audit events found
              </h3>

              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Try changing your filters or make a change to an audited entity.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <button
                  key={`${log.entityType}-${log.entityId}-${log.revision}`}
                  onClick={() => openDetails(log)}
                  className="group flex w-full items-center gap-4 px-5 py-5 text-left transition hover:bg-slate-50"
                >
                  <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 sm:flex">
                    <UserRound className="h-5 w-5 text-slate-500" />
                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${getEntityStyle(
                          log.entityType,
                        )}`}
                      >
                        {log.entityType}
                      </span>

                      <span className="text-sm font-semibold text-slate-900">
                        #{log.entityId}
                      </span>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getActionStyle(
                          log.action,
                        )}`}
                      >
                        {log.action}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-col gap-1 text-sm text-slate-500 sm:flex-row sm:items-center sm:gap-4">
                      <span className="flex items-center gap-1.5">
                        <UserRound className="h-3.5 w-3.5" />

                        {log.username || "SYSTEM"}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5" />

                        {formatDateTime(log.timestamp)}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          {detailLoading ? (
            <div className="flex h-32 w-80 items-center justify-center rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                Loading details...
              </div>
            </div>
          ) : (
            <AuditDetailDrawer
              audit={selectedAudit}
              open={drawerOpen}
              onClose={closeDrawer}
            />
          )}
        </div>
      )}
    </div>
  );
}