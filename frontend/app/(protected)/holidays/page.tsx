"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { getCurrentUser, getHolidays } from "@/lib/api";

const API_URL = "http://localhost:8080";

type Holiday = {
  id: number;
  date: string;
  name: string;
  description: string | null;
};

type HolidayForm = {
  date: string;
  name: string;
  description: string;
};

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [form, setForm] = useState<HolidayForm>({
    date: "",
    name: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [deletingHoliday, setDeletingHoliday] = useState<Holiday | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canCreateHoliday = permissions.includes("HOLIDAY_CREATE");
  const canUpdateHoliday = permissions.includes("HOLIDAY_UPDATE");
  const canDeleteHoliday = permissions.includes("HOLIDAY_DELETE");

  const loadHolidays = async () => {
    setLoading(true);

    try {
      const response = await getHolidays();
      const data: Holiday[] = Array.isArray(response)
        ? response
        : response.content ?? [];
      setHolidays(data);
    } catch (error) {
      console.error(error);
      toast.error("Unable to load holidays.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays();

    getCurrentUser()
      .then((data) => {
        setPermissions(data?.permissions ?? []);
      })
      .catch((error) => console.error(error));
  }, []);

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const upcomingHolidays = useMemo(() => {
    return holidays
      .filter((holiday) => {
        const holidayDate = new Date(`${holiday.date}T00:00:00`);
        return holidayDate >= today;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [holidays, today]);

  const pastHolidays = useMemo(() => {
    return holidays
      .filter((holiday) => {
        const holidayDate = new Date(`${holiday.date}T00:00:00`);
        return holidayDate < today;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [holidays, today]);

  const formatDate = (value: string) =>
    new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const getDay = (value: string) =>
    new Date(`${value}T00:00:00`).getDate();

  const getMonth = (value: string) =>
    new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
    });

  const getWeekday = (value: string) =>
    new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
      weekday: "long",
    });

  const getDaysUntil = (value: string) => {
    const holidayDate = new Date(`${value}T00:00:00`);
    const difference = holidayDate.getTime() - today.getTime();
    return Math.ceil(difference / (1000 * 60 * 60 * 24));
  };

  const openAddModal = () => {
    setEditingHoliday(null);
    setForm({ date: "", name: "", description: "" });
    setModalOpen(true);
  };

  const openEditModal = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setForm({
      date: holiday.date,
      name: holiday.name,
      description: holiday.description ?? "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingHoliday(null);
    setForm({ date: "", name: "", description: "" });
  };

  const handleDelete = async () => {
    if (!deletingHoliday) return;

    setDeleting(true);

    try {
      const response = await fetch(
        `${API_URL}/api/holidays/${deletingHoliday.id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Unable to delete holiday.");
      }

      setDeletingHoliday(null);
      await loadHolidays();
      toast.success("Holiday deleted successfully.");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Unable to delete holiday.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!form.date || !form.name.trim()) {
      toast.error("Holiday name and date are required.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        editingHoliday
          ? `${API_URL}/api/holidays/${editingHoliday.id}`
          : `${API_URL}/api/holidays`,
        {
          method: editingHoliday ? "PUT" : "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: form.date,
            name: form.name.trim(),
            description: form.description.trim() || null,
          }),
        },
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Unable to save holiday.");
      }

      await loadHolidays();
      closeModal();
      toast.success(
        editingHoliday
          ? "Holiday updated successfully."
          : "Holiday added successfully.",
      );
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Unable to save holiday.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-slate-950 px-6 py-6 shadow-lg sm:px-7">
          <div className="relative flex items-center justify-between gap-4">
            <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-blue-400/10 blur-3xl" />
            <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-blue-300 ring-1 ring-white/10">
              <CalendarDays size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Public Holidays
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Official public holidays and non-working days.
              </p>
            </div>
          </div>

          {canCreateHoliday && (
            <button
              type="button"
              onClick={openAddModal}
              className="relative flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-150 hover:shadow-md active:scale-[0.98]"
            >
              <Plus size={18} />
              Add Holiday
            </button>
          )}
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex min-h-[350px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                <p className="text-sm font-medium text-slate-500">
                  Loading holidays...
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <section className="mb-10">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Upcoming Holidays
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    The next public holidays on the calendar.
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600">
                  <Clock3 size={14} />
                  {upcomingHolidays.length} upcoming
                </div>
              </div>

              {upcomingHolidays.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <CalendarDays size={25} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700">
                    No upcoming holidays
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    There are currently no upcoming public holidays.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {upcomingHolidays.map((holiday) => {
                    const daysUntil = getDaysUntil(holiday.date);

                    return (
                      <div
                        key={holiday.id}
                        className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <span className="text-[10px] font-bold uppercase">
                              {getMonth(holiday.date)}
                            </span>
                            <span className="text-xl font-bold leading-none">
                              {getDay(holiday.date)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-600">
                              {daysUntil === 0 ? "Today" : `In ${daysUntil} days`}
                            </span>
                            {(canUpdateHoliday || canDeleteHoliday) && (
                              <>
                                {canUpdateHoliday && (
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(holiday)}
                                    title="Edit holiday"
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                )}
                                {canDeleteHoliday && (
                                  <button
                                    type="button"
                                    onClick={() => setDeletingHoliday(holiday)}
                                    title="Delete holiday"
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        <div className="mt-5">
                          <p className="text-lg font-bold text-slate-900">
                            {holiday.name}
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-500">
                            {getWeekday(holiday.date)}, {formatDate(holiday.date)}
                          </p>
                          <p className="mt-4 text-sm leading-6 text-slate-500">
                            {holiday.description || "Public holiday."}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <div className="mb-5">
                <h2 className="text-lg font-bold text-slate-700">Past Holidays</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Previous public holidays.
                </p>
              </div>

              {pastHolidays.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                  <p className="text-sm text-slate-400">No past holidays.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white opacity-80 shadow-sm">
                  <div className="divide-y divide-slate-100">
                    {pastHolidays.map((holiday) => (
                      <div
                        key={holiday.id}
                        className="flex flex-col gap-4 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center"
                      >
                        <div className="flex items-center gap-4 sm:w-[260px]">
                          <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                            <span className="text-[9px] font-bold uppercase">
                              {getMonth(holiday.date)}
                            </span>
                            <span className="text-lg font-bold leading-none">
                              {getDay(holiday.date)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-700">
                              {holiday.name}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-400">
                              {formatDate(holiday.date)}
                            </p>
                          </div>
                        </div>
                        <p className="flex-1 text-sm text-slate-400">
                          {holiday.description || "Public holiday."}
                        </p>
                        {(canUpdateHoliday || canDeleteHoliday) && (
                          <div className="flex shrink-0 items-center gap-2">
                            {canUpdateHoliday && (
                              <button
                                type="button"
                                onClick={() => openEditModal(holiday)}
                              title="Edit holiday"
                              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                            >
                                <Pencil size={16} />
                              </button>
                            )}
                            {canDeleteHoliday && (
                              <button
                                type="button"
                                onClick={() => setDeletingHoliday(holiday)}
                              title="Delete holiday"
                              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                            >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        )}
                        <span className="hidden text-xs font-medium text-slate-400 sm:block">
                          Past
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {deletingHoliday && canDeleteHoliday && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <Trash2 size={19} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Delete Holiday
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Are you sure you want to delete{" "}
                    <span className="font-semibold text-slate-700">
                      {deletingHoliday.name}
                    </span>
                    ? This action cannot be undone.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeletingHoliday(null)}
                disabled={deleting}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
              <button
                type="button"
                onClick={() => setDeletingHoliday(null)}
                disabled={deleting}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete Holiday"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (editingHoliday ? canUpdateHoliday : canCreateHoliday) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingHoliday ? "Edit Public Holiday" : "Add Public Holiday"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingHoliday
                    ? "Update the holiday information."
                    : "Add a new official non-working day."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Holiday name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="e.g. Independence Day"
                  className="h-11 w-full rounded-xl border-0 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none ring-1 ring-slate-200 transition focus:bg-white focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, date: event.target.value }))
                  }
                  className="h-11 w-full rounded-xl border-0 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none ring-1 ring-slate-200 transition focus:bg-white focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Optional description"
                  rows={4}
                  className="w-full resize-none rounded-xl border-0 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none ring-1 ring-slate-200 transition focus:bg-white focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingHoliday
                    ? "Save Changes"
                    : "Add Holiday"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
