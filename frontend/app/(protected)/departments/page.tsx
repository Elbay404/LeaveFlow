"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import { getCurrentUser, getDepartments, createDepartment, updateDepartment } from "@/lib/api";

type Department = {
  id: number;
  name: string;
  description: string | null;
};

type PageResponse = {
  content: Department[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
};

type CurrentUser = {
  permissions?: string[];
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState<PageResponse | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const permissions = currentUser?.permissions ?? [];
  const canRead = permissions.includes("DEPARTMENT_READ");
  const canCreate = permissions.includes("DEPARTMENT_CREATE");
  const canUpdate = permissions.includes("DEPARTMENT_UPDATE");

  const loadDepartments = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getDepartments(page, 10);
      setPageData(data);
      setDepartments(data.content ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load current user");
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    if (currentUser && canRead) {
      loadDepartments();
    } else if (currentUser) {
      setLoading(false);
    }
  }, [currentUser, page]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  const filteredDepartments = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return departments;

    return departments.filter((department) =>
      `${department.name} ${department.description ?? ""}`
        .toLowerCase()
        .includes(value)
    );
  }, [departments, search]);

  const openCreateModal = () => {
    setEditingDepartment(null);
    setName("");
    setDescription("");
    setError("");
    setShowModal(true);
  };

  const openEditModal = (department: Department) => {
    setEditingDepartment(department);
    setName(department.name);
    setDescription(department.description ?? "");
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingDepartment(null);
    setName("");
    setDescription("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      setError("Department name is required");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (editingDepartment) {
        await updateDepartment(editingDepartment.id, {
          name: name.trim(),
          description: description.trim(),
        });
        setSuccess("Department updated successfully");
      } else {
        await createDepartment({
          name: name.trim(),
          description: description.trim(),
        });
        setSuccess("Department created successfully");
      }

      closeModal();
      await loadDepartments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !currentUser) {
    return (
      <main className="min-h-screen bg-[#f6f8fb] p-6 lg:p-10">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-32 rounded-3xl bg-white" />
          <div className="h-24 rounded-3xl bg-white" />
          <div className="h-96 rounded-3xl bg-white" />
        </div>
      </main>
    );
  }

  if (!canRead) {
    return (
      <main className="min-h-screen bg-[#f6f8fb] p-6 lg:p-10">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <Building2 className="h-8 w-8 text-slate-500" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Access restricted
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              You do not have permission to view departments.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-[28px] bg-slate-950 p-7 text-white shadow-xl sm:p-9">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                  <Building2 className="h-5 w-5 text-blue-300" />
                </div>
                <span className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
                  Organization
                </span>
              </div>

              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Departments
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
                Organize your company structure and keep department information
                clear and centralized.
              </p>
            </div>

            {canCreate && (
              <button
                onClick={openCreateModal}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-semibold text-slate-950 shadow-lg transition hover:bg-slate-100 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                Add Department
              </button>
            )}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total departments
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  {pageData?.totalElements ?? 0}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Departments on this page
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  {filteredDepartments.length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Department directory
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Browse and manage your organization's departments.
                </p>
              </div>

              <div className="relative w-full lg:max-w-sm">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search departments..."
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                />
              </div>
            </div>
          </div>

          {error && !showModal && (
            <div className="mx-5 mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6">
              {error}
            </div>
          )}

          {success && (
            <div className="mx-5 mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 sm:mx-6">
              {success}
            </div>
          )}

          {loading ? (
            <div className="space-y-3 p-5 sm:p-6">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-2xl bg-slate-100"
                />
              ))}
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <Building2 className="h-7 w-7 text-slate-400" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">
                No departments found
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                {search
                  ? "Try another search term."
                  : "Create your first department to get started."}
              </p>
              {!search && canCreate && (
                <button
                  onClick={openCreateModal}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4" />
                  Create department
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden grid-cols-[minmax(220px,1fr)_minmax(280px,1.5fr)_110px] gap-6 border-b border-slate-100 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 md:grid">
                <span>Department</span>
                <span>Description</span>
                <span className="text-right">Action</span>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredDepartments.map((department) => {
                  const initials = department.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase();

                  return (
                    <div
                      key={department.id}
                      className="group grid gap-4 px-5 py-5 transition hover:bg-slate-50/70 md:grid-cols-[minmax(220px,1fr)_minmax(280px,1.5fr)_110px] md:items-center md:gap-6 md:px-6"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-700 transition group-hover:bg-slate-900 group-hover:text-white">
                          {initials || "D"}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {department.name}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            Department #{department.id}
                          </p>
                        </div>
                      </div>

                      <p className="line-clamp-2 text-sm leading-6 text-slate-500">
                        {department.description || "No description provided."}
                      </p>

                      <div className="flex justify-end">
                        {canUpdate && (
                          <button
                            onClick={() => openEditModal(department)}
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100"
                          >
                            <Edit3 className="h-4 w-4" />
                            <span className="hidden lg:inline">Edit</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-sm text-slate-500">
                  Page {(pageData?.number ?? 0) + 1} of{" "}
                  {pageData?.totalPages ?? 1}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage((value) => value - 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-slate-950 px-3 text-sm font-semibold text-white">
                    {page + 1}
                  </div>

                  <button
                    disabled={page + 1 >= (pageData?.totalPages ?? 1)}
                    onClick={() => setPage((value) => value + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-slate-950">
                  {editingDepartment ? "Edit department" : "Create department"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingDepartment
                    ? "Update the department information."
                    : "Add a new department to your organization."}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Department name
                </label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Information Technology"
                  maxLength={100}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe the department..."
                  rows={4}
                  maxLength={500}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="h-11 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingDepartment
                      ? "Save changes"
                      : "Create department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
