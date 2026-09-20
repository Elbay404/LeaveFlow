"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3 } from "lucide-react";
import { getHolidays } from "@/lib/api";

type Holiday = {
  id: number;
  date: string;
  name: string;
  description: string | null;
};

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      } finally {
        setLoading(false);
      }
    };

    loadHolidays();
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

  const formatDate = (date: string) => {
    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-US",
      {
        month: "long",
        day: "numeric",
        year: "numeric",
      },
    );
  };

  const getDay = (date: string) => {
    return new Date(`${date}T00:00:00`).getDate();
  };

  const getMonth = (date: string) => {
    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-US",
      {
        month: "short",
      },
    );
  };

  const getWeekday = (date: string) => {
    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-US",
      {
        weekday: "long",
      },
    );
  };

  const getDaysUntil = (date: string) => {
    const holidayDate = new Date(`${date}T00:00:00`);
    const difference =
      holidayDate.getTime() - today.getTime();

    return Math.ceil(difference / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
            <CalendarDays size={28} />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Public Holidays
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Official public holidays and non-working days.
            </p>
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
                    const daysUntil = getDaysUntil(
                      holiday.date,
                    );

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

                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-600">
                            {daysUntil === 0
                              ? "Today"
                              : `In ${daysUntil} days`}
                          </span>
                        </div>

                        <div className="mt-5">
                          <p className="text-lg font-bold text-slate-900">
                            {holiday.name}
                          </p>

                          <p className="mt-1 text-sm font-medium text-slate-500">
                            {getWeekday(holiday.date)},{" "}
                            {formatDate(holiday.date)}
                          </p>

                          <p className="mt-4 text-sm leading-6 text-slate-500">
                            {holiday.description ||
                              "Public holiday."}
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
                <h2 className="text-lg font-bold text-slate-700">
                  Past Holidays
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Previous public holidays.
                </p>
              </div>

              {pastHolidays.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                  <p className="text-sm text-slate-400">
                    No past holidays.
                  </p>
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
                          {holiday.description ||
                            "Public holiday."}
                        </p>

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
    </div>
  );
}