"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
} from "@/lib/api";

type LeaveType = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  consumesBalance: boolean;
  requiresDocument: boolean;
  maxDays: number | null;
};

type LeaveTypeForm = {
  code: string;
  name: string;
  description: string;
  consumesBalance: boolean;
  requiresDocument: boolean;
  maxDays: number;
};

export default function LeaveTypesPage() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [balanceFilter, setBalanceFilter] = useState("ALL");
  const [documentFilter, setDocumentFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [editingLeaveType, setEditingLeaveType] =
    useState<LeaveType | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<LeaveType | null>(null);

  const [form, setForm] = useState<LeaveTypeForm>({
    code: "",
    name: "",
    description: "",
    consumesBalance: true,
    requiresDocument: false,
    maxDays: 30,
  });

  const loadLeaveTypes = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getLeaveTypes();

      setLeaveTypes(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load leave types."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaveTypes();
  }, []);

  const openCreateModal = () => {
    setEditingLeaveType(null);

    setForm({
      code: "",
      name: "",
      description: "",
      consumesBalance: true,
      requiresDocument: false,
      maxDays: 30,
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEditModal = (leaveType: LeaveType) => {
    setEditingLeaveType(leaveType);

    setForm({
      code: leaveType.code,
      name: leaveType.name,
      description: leaveType.description ?? "",
      consumesBalance: leaveType.consumesBalance,
      requiresDocument: leaveType.requiresDocument,
      maxDays: leaveType.maxDays ?? 1,
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingLeaveType(null);
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (!form.code.trim()) {
      setError("Code is required.");
      return;
    }

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    if (form.maxDays < 1) {
      setError("Maximum days must be at least 1.");
      return;
    }

    try {
      setSaving(true);

      const data = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        description: form.description.trim(),
        consumesBalance: form.consumesBalance,
        requiresDocument: form.requiresDocument,
        maxDays: form.maxDays,
      };

      if (editingLeaveType) {
        await updateLeaveType(editingLeaveType.id, data);
        setSuccess("Leave type updated successfully.");
      } else {
        await createLeaveType(data);
        setSuccess("Leave type created successfully.");
      }

      setShowModal(false);
      setEditingLeaveType(null);

      await loadLeaveTypes();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to save leave type."
      );
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (leaveType: LeaveType) => {
    setDeleteTarget(leaveType);
    setError("");
    setSuccess("");
  };

  const closeDeleteModal = () => {
    if (deleting) return;

    setDeleteTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      await deleteLeaveType(deleteTarget.id);

      setDeleteTarget(null);
      setSuccess("Leave type deleted successfully.");

      await loadLeaveTypes();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to delete leave type."
      );
    } finally {
      setDeleting(false);
    }
  };

  const filteredLeaveTypes = leaveTypes.filter((leaveType) => {
    const value = search.trim().toLowerCase();

    const matchesSearch =
      !value ||
      leaveType.name.toLowerCase().includes(value) ||
      leaveType.code.toLowerCase().includes(value) ||
      (leaveType.description ?? "").toLowerCase().includes(value);

    const matchesBalance =
      balanceFilter === "ALL" ||
      (balanceFilter === "YES" && leaveType.consumesBalance) ||
      (balanceFilter === "NO" && !leaveType.consumesBalance);

    const matchesDocument =
      documentFilter === "ALL" ||
      (documentFilter === "YES" && leaveType.requiresDocument) ||
      (documentFilter === "NO" && !leaveType.requiresDocument);

    return matchesSearch && matchesBalance && matchesDocument;
  });

  return (
    <div className="min-h-full px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1250px]">

        <div className="mb-6 flex min-h-[112px] items-center rounded-[20px] bg-[#020617] px-6 py-5 shadow-lg sm:px-7">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <FileText className="h-6 w-6 text-blue-400" />
            </div>

            <div>
              <h1 className="text-[25px] font-extrabold tracking-tight text-white">
                Leave Types
              </h1>

              <p className="mt-1 text-[13px] font-medium text-blue-300">
                Manage leave types, limits and requirements.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400">
            {success}
          </div>
        )}

        <div className="mb-5 rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex flex-1 flex-col gap-3 sm:flex-row">

              <div className="relative w-full sm:max-w-[280px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search leave type..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowFilters((value) => !value)}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${
                  showFilters
                    ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-400"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </button>

              {showFilters && (
                <>
                  <select
                    value={balanceFilter}
                    onChange={(e) => setBalanceFilter(e.target.value)}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                  >
                    <option value="ALL">All Balance</option>
                    <option value="YES">Consumes Balance</option>
                    <option value="NO">No Balance</option>
                  </select>

                  <select
                    value={documentFilter}
                    onChange={(e) =>
                      setDocumentFilter(e.target.value)
                    }
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                  >
                    <option value="ALL">All Documents</option>
                    <option value="YES">Document Required</option>
                    <option value="NO">No Document</option>
                  </select>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Leave Type
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Leave Type Configuration
                </h2>

                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {filteredLeaveTypes.length} leave type
                  {filteredLeaveTypes.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">

              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Leave Type
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Code
                  </th>

                  <th className="px-5 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Max Days
                  </th>

                  <th className="px-5 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Balance
                  </th>

                  <th className="px-5 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Document
                  </th>

                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">

                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-sm font-medium text-slate-500 dark:text-slate-400"
                    >
                      Loading leave types...
                    </td>
                  </tr>
                ) : filteredLeaveTypes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-sm font-medium text-slate-500 dark:text-slate-400"
                    >
                      No leave types found.
                    </td>
                  </tr>
                ) : (
                  filteredLeaveTypes.map((leaveType) => (
                    <tr
                      key={leaveType.id}
                      className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50">
                            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>

                          <div className="min-w-0">
                            <div className="truncate text-sm font-bold text-slate-900 dark:text-white">
                              {leaveType.name}
                            </div>

                            {leaveType.description && (
                              <div className="mt-0.5 max-w-[280px] truncate text-[11px] text-slate-500 dark:text-slate-400">
                                {leaveType.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {leaveType.code}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {leaveType.maxDays !== null
                            ? `${leaveType.maxDays}`
                            : "∞"}
                        </span>

                        {leaveType.maxDays !== null && (
                          <span className="ml-1 text-[11px] text-slate-500 dark:text-slate-400">
                            days
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        {leaveType.consumesBalance ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                            <Check className="h-3 w-3" />
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            <X className="h-3 w-3" />
                            No
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        {leaveType.requiresDocument ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                            <Check className="h-3 w-3" />
                            Required
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            <X className="h-3 w-3" />
                            No
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(leaveType)
                            }
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-400"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openDeleteModal(leaveType)
                            }
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}

              </tbody>
            </table>
          </div>
        </div>

      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingLeaveType
                    ? "Edit Leave Type"
                    : "Add Leave Type"}
                </h2>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Configure the leave type and its limits.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Code
                  </label>

                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="ANNUAL"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Name
                  </label>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                      })
                    }
                    placeholder="Annual Leave"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="Describe this leave type..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Maximum Days
                </label>

                <input
                  type="number"
                  min={1}
                  value={form.maxDays}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      maxDays: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Consumes Balance
                    </p>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Deduct days from balance.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={form.consumesBalance}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        consumesBalance: e.target.checked,
                      })
                    }
                    className="h-5 w-5 accent-blue-600"
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Requires Document
                    </p>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Attachment required.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={form.requiresDocument}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        requiresDocument: e.target.checked,
                      })
                    }
                    className="h-5 w-5 accent-blue-600"
                  />
                </label>

              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingLeaveType
                    ? "Save Changes"
                    : "Create Leave Type"}
              </button>
            </div>

          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">

            <div className="p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/40">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>

              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Delete Leave Type
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Are you sure you want to delete{" "}
                <span className="font-bold text-slate-900 dark:text-white">
                  {deleteTarget.name}
                </span>
                ?
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}