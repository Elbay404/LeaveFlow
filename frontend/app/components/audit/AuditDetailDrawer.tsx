"use client";

import {
  ArrowRight,
  Clock3,
  History,
  UserRound,
  X,
} from "lucide-react";

type AuditChange = {
  field: string;
  oldValue: string | null;
  newValue: string | null;
};

type AuditDetail = {
  entityType: string;
  entityId: number;
  action: string;
  username: string | null;
  timestamp: string;
  revision: number;
  changes: AuditChange[];
};

type AuditDetailDrawerProps = {
  audit: AuditDetail | null;
  open: boolean;
  onClose: () => void;
};

const formatValue = (value: string | null) => {
  if (value === null || value === "") {
    return "—";
  }

  return value;
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

export default function AuditDetailDrawer({
  audit,
  open,
  onClose,
}: AuditDetailDrawerProps) {
  if (!open || !audit) {
    return null;
  }

  return (
    <>
      <button
        aria-label="Close audit details"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm"
      />

      <aside className="fixed right-0 top-0 z-50 h-screen w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />

              <h2 className="text-lg font-semibold text-slate-900">
                Audit Details
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {audit.entityType} #{audit.entityId}
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Action
              </p>

              <span
                className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getActionStyle(
                  audit.action,
                )}`}
              >
                {audit.action}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Revision
              </p>

              <p className="mt-2 text-lg font-semibold text-slate-900">
                #{audit.revision}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <UserRound className="h-5 w-5 text-blue-600" />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Changed by
                </p>

                <p className="text-sm font-medium text-slate-900">
                  {audit.username || "SYSTEM"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                <Clock3 className="h-5 w-5 text-slate-600" />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Date
                </p>

                <p className="text-sm font-medium text-slate-900">
                  {formatDateTime(audit.timestamp)}
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-4">
              <h3 className="text-base font-semibold text-slate-900">
                Changes
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Values recorded for this revision.
              </p>
            </div>

            <div className="space-y-3">
              {audit.changes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center">
                  <p className="text-sm text-slate-500">
                    No field changes recorded.
                  </p>
                </div>
              ) : (
                audit.changes.map((change, index) => (
                  <div
                    key={`${change.field}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <p className="mb-3 text-sm font-semibold text-slate-800">
                      {change.field}
                    </p>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1 rounded-xl bg-red-50 px-4 py-3">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-red-400">
                          Previous
                        </p>

                        <p className="break-words text-sm text-red-700">
                          {formatValue(change.oldValue)}
                        </p>
                      </div>

                      <ArrowRight className="hidden h-4 w-4 shrink-0 text-slate-400 sm:block" />

                      <div className="min-w-0 flex-1 rounded-xl bg-emerald-50 px-4 py-3">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-500">
                          New
                        </p>

                        <p className="break-words text-sm text-emerald-700">
                          {formatValue(change.newValue)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}