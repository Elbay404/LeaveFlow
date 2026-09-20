"use client";

import { useEffect, useMemo, useState } from "react"; //useMemo for optimizing the calculation
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Gift,
  GlobeOff,
  Plus,
} from "lucide-react";
import { getAllLeaves, getHolidays, getUsers } from "@/lib/api";

type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  type: "leave" | "holiday" | "birthday";
  employee?: string;
};

type Holiday = {
  id: number;
  date: string;
  name: string;
  description: string | null;
};

type User = {
  id: number;
  firstName: string;
  lastName: string;
  birthDate?: string | null;
};

type Leave = {
  id: number;
  startDate: string;
  endDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  user?: {
    firstName: string;
    lastName: string;
  };
  leaveType?: {
    name: string;
  };
};

type LeaveApiResponse =
  | Leave[]
  | {
      content: Leave[];
    };

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCalendarData = async () => {
      setLoading(true);
      setError("");

      try {
        const [leavesResponse, holidaysResponse, usersResponse] =
          await Promise.all([getAllLeaves(), getHolidays(), getUsers()]);

        const leaveData: Leave[] = Array.isArray(leavesResponse)
  ? leavesResponse
  : "content" in leavesResponse
    ? leavesResponse.content
    : [];

        const holidayData: Holiday[] = Array.isArray(holidaysResponse)
          ? holidaysResponse
          : (holidaysResponse.content ?? []);

        const userData: User[] = Array.isArray(usersResponse)
          ? usersResponse
          : (usersResponse.content ?? []);

        setLeaves(leaveData);
        setHolidays(holidayData);
        setUsers(userData);
      } catch (err) {
        console.error(err);
        setError("Unable to load calendar data.");
      } finally {
        setLoading(false);
      }
    };

    loadCalendarData();
  }, []);

  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  ).getDate();

  const firstDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  ).getDay();

  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];

    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  }, [adjustedFirstDay, daysInMonth]);

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (day: number) => {
    const today = new Date();

    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const getEventsForDay = (day: number): CalendarEvent[] => {
    const date = formatDateKey(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), day),
    );

    const dayEvents: CalendarEvent[] = [];

    holidays.forEach((holiday) => {
      if (holiday.date === date) {
        dayEvents.push({
          id: `holiday-${holiday.id}`,
          title: holiday.name,
          date: holiday.date,
          type: "holiday",
        });
      }
    });

    users.forEach((user) => {
      if (!user.birthDate) {
        return;
      }

      const [, birthMonth, birthDay] = user.birthDate.split("-");

      const currentMonth = String(currentDate.getMonth() + 1).padStart(2, "0");

      const currentDay = String(day).padStart(2, "0");

      if (birthMonth === currentMonth && birthDay === currentDay) {
        dayEvents.push({
          id: `birthday-${user.id}`,
          title: "Birthday",
          date,
          type: "birthday",
          employee: `${user.firstName} ${user.lastName}`,
        });
      }
    });

    leaves.forEach((leave) => {
      if (leave.status !== "APPROVED" && leave.status !== "PENDING") {
        return;
      }

      if (date >= leave.startDate && date <= leave.endDate) {
        dayEvents.push({
          id: `leave-${leave.id}-${date}`,
          title:
            leave.leaveType?.name ??
            (leave.status === "PENDING" ? "Leave Pending" : "Leave"),
          date,
          type: "leave",
          employee: leave.user
            ? `${leave.user.firstName} ${leave.user.lastName}`
            : undefined,
        });
      }
    });

    return dayEvents;
  };

  const currentMonthPrefix = `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1,
  ).padStart(2, "0")}`;

  const leaveEventsCount = leaves.filter((leave) => {
    if (leave.status !== "APPROVED" && leave.status !== "PENDING") {
      return false;
    }

    return (
      leave.startDate.startsWith(currentMonthPrefix) ||
      leave.endDate.startsWith(currentMonthPrefix) ||
      (leave.startDate < `${currentMonthPrefix}-01` &&
        leave.endDate >= `${currentMonthPrefix}-01`)
    );
  }).length;

  const holidayCount = holidays.filter((holiday) =>
    holiday.date.startsWith(currentMonthPrefix),
  ).length;

  const birthdayCount = users.filter((user) => {
    if (!user.birthDate) {
      return false;
    }

    const [, month] = user.birthDate.split("-");

    return month === String(currentDate.getMonth() + 1).padStart(2, "0");
  }).length;

  const getEventStyle = (type: CalendarEvent["type"]) => {
    if (type === "leave") {
      return "border-red-100 bg-red-50 text-red-600";
    }

    if (type === "holiday") {
      return "border-blue-100 bg-blue-50 text-blue-600";
    }

    return "border-pink-100 bg-pink-50 text-pink-600";
  };

  const getEventIcon = (type: CalendarEvent["type"]) => {
    if (type === "leave") {
      return <GlobeOff size={12} />;
    }

    if (type === "holiday") {
      return <CalendarDays size={12} />;
    }

    return <Gift size={12} />;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              <CalendarDays size={28} />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Calendar
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                View leaves, holidays and important employee events.
              </p>
            </div>
          </div>

          <Link
            href="/leaves"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={17} />
            Request Leave
          </Link>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <GlobeOff size={19} />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">
                  Leave Events
                </p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                  {leaveEventsCount}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <CalendarDays size={19} />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">
                  Public Holidays
                </p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                  {holidayCount}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                <Gift size={19} />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">Birthdays</p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                  {birthdayCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{monthName}</h2>

              <p className="mt-1 text-xs text-slate-400">
                Monthly employee calendar
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                type="button"
                onClick={goToToday}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Today
              </button>

              <button
                type="button"
                onClick={goToNextMonth}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {[
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ].map((day) => (
              <div
                key={day}
                className="border-r border-slate-200 px-3 py-3 text-center last:border-r-0"
              >
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  {day}
                </span>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex min-h-[500px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

                <p className="text-sm font-medium text-slate-500">
                  Loading calendar...
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                const dayEvents = day ? getEventsForDay(day) : [];

                return (
                  <div
                    key={`${day}-${index}`}
                    className={`min-h-[145px] border-b border-r border-slate-100 p-2.5 transition ${
                      day ? "bg-white hover:bg-slate-50/70" : "bg-slate-50/50"
                    }`}
                  >
                    {day && (
                      <>
                        <div className="mb-2 flex justify-end">
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                              isToday(day)
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-slate-600"
                            }`}
                          >
                            {day}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {dayEvents.map((event) => (
                            <div
                              key={event.id}
                              className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-semibold ${getEventStyle(
                                event.type,
                              )}`}
                            >
                              {getEventIcon(event.type)}

                              <span className="truncate">
                                {event.employee
                                  ? `${event.employee} · ${event.title}`
                                  : event.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-medium">
          <div className="flex items-center gap-2 rounded-full bg-red-50 px-3 py-2 text-red-700">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            Leave
          </div>

          <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-blue-700">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            Public Holiday
          </div>

          <div className="flex items-center gap-2 rounded-full bg-pink-50 px-3 py-2 text-pink-700">
            <span className="h-2.5 w-2.5 rounded-full bg-pink-500" />
            Birthday
          </div>
        </div>
      </div>
    </div>
  );
}
