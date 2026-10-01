"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Clock3,
  Clock,
  CircleCheck,
  CalendarDays,
  CircleX,
  Ban,
  Coins,
  ClipboardPenLine,
  ArrowRight,
} from "lucide-react";
import {
  getCurrentUser,
  getMyLeaves,
  getHolidays,
  getUsers,
  getWeather,
} from "@/lib/api";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import WeatherCard, {
  type Weather,
} from "@/app/(protected)/dashboard/WeatherCard";
type User = {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string | null;
  annualLeaveBalance: number;
  birthDate?: string | null;
};

type Leave = {
  id: number;
  userId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  duration: number;
  reason: string | null;
  requestedAt: string;
  updatedAt: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  approvedById: number | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  documentName: string | null;
};

type Holiday = {
  id: number;
  date: string;
  name: string;
  description: string | null;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [birthdayUsers, setBirthdayUsers] = useState<User[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();

  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(false);

  const loadWeather = () => {
    setWeatherLoading(true);
    setWeatherError(false);

    if (!navigator.geolocation) {
      getWeather(36.8065, 10.1815, "Tunis")
        .then(setWeather)
        .catch(() => setWeatherError(true))
        .finally(() => setWeatherLoading(false));

      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const data = await getWeather(
            position.coords.latitude,
            position.coords.longitude,
            "Current",
          );

          setWeather(data);
        } catch (error) {
          console.error("Weather API error:", error);
          setWeatherError(true);
        } finally {
          setWeatherLoading(false);
        }
      },
      async () => {
        try {
          const data = await getWeather(36.8065, 10.1815, "Tunis");

          setWeather(data);
        } catch (error) {
          console.error("Weather API error:", error);
          setWeatherError(true);
        } finally {
          setWeatherLoading(false);
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 3000,
        maximumAge: 300000,
      },
    );
  };

  useEffect(() => {
    getCurrentUser()
      .then((data) => {
        setUser(data);
      })
      .catch((error) => {
        console.error(error);
      });

    getMyLeaves()
      .then((data) => {
        setLeaves(data);
      })
      .catch((error) => {
        console.error(error);
      });

    getHolidays()
      .then((data) => {
        setHolidays(data);
      })
      .catch((error) => {
        console.error(error);
      });

    getUsers(0, 200)
      .then((data) => {
        const userData: User[] = Array.isArray(data)
          ? data
          : "content" in data
            ? data.content
            : [];
        setBirthdayUsers(userData);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadWeather();
  }, []);

  useEffect(() => {
    console.log("WEATHER:", weather);
  }, [weather]);

  const hour = currentTime.getHours();

  let greeting = "Good evening";

  if (hour < 12) {
    greeting = "Good morning";
  } else if (hour < 18) {
    greeting = "Good afternoon";
  }

  const formattedDate = currentTime.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const pendingRequests = leaves.filter(
    (leave) => leave.status === "PENDING",
  ).length;

  const approvedLeaves = leaves.filter(
    (leave) => leave.status === "APPROVED",
  ).length;

  const upcomingLeaves = leaves.filter(
    (leave) =>
      leave.status === "APPROVED" && new Date(leave.startDate) > new Date(),
  ).length;

  const rejectedLeaves = leaves.filter(
    (leave) => leave.status === "REJECTED",
  ).length;

  const cancelledLeaves = leaves.filter(
    (leave) => leave.status === "CANCELLED",
  ).length;

  const leaveStatusData = [
    {
      name: "Approved",
      value: approvedLeaves,
      color: "#22c55e",
    },
    {
      name: "Pending",
      value: pendingRequests,
      color: "#f59e0b",
    },
    {
      name: "Rejected",
      value: rejectedLeaves,
      color: "#ef4444",
    },
    {
      name: "Cancelled",
      value: cancelledLeaves,
      color: "#64748b",
    },
  ];

  const monthlyLeaveData = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));

    const month = date.toLocaleDateString("en-US", {
      month: "short",
    });

    const year = date.getFullYear();
    const monthNumber = date.getMonth();

    const count = leaves.filter((leave) => {
      const requestDate = new Date(leave.requestedAt);

      return (
        requestDate.getMonth() === monthNumber &&
        requestDate.getFullYear() === year
      );
    }).length;

    return {
      month,
      requests: count,
    };
  });

  const leaveTypeData = Object.entries(
  leaves
    .filter((leave) => leave.status !== "CANCELLED")
    .reduce<Record<string, number>>((acc, leave) => {
      acc[leave.leaveType] = (acc[leave.leaveType] || 0) + 1;
      return acc;
    }, {}),
).map(([name, value]) => ({
  name,
  value,
}));
  const upcomingHolidays = holidays
    .filter((holiday) => new Date(holiday.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const recentLeaves = [...leaves] //copy leaves
    .sort(
      (a, b) =>
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
    )
    .slice(0, 5);

  const upcomingBirthdays = birthdayUsers
    .filter((person) => person.birthDate)
    .map((person) => {
      const birthDate = new Date(`${person.birthDate}T00:00:00`);
      const today = new Date(currentTime);
      const todayOnly = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );

      let nextBirthday = new Date(
        today.getFullYear(),
        birthDate.getMonth(),
        birthDate.getDate(),
      );

      if (nextBirthday < todayOnly) {
        nextBirthday = new Date(
          today.getFullYear() + 1,
          birthDate.getMonth(),
          birthDate.getDate(),
        );
      }

      const daysUntil = Math.round(
        (nextBirthday.getTime() - todayOnly.getTime()) / (1000 * 60 * 60 * 24),
      );

      return { ...person, nextBirthday, daysUntil };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-7 shadow-lg sm:px-8 sm:py-8">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium text-blue-300">
                Welcome back
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {greeting}, {user ? user.firstName : "Loading..."} 👋
              </h1>

              <p className="mt-2 text-sm text-slate-400 sm:text-base">
                Here's what's happening with your leaves.
              </p>
            </div>

            <div className="flex w-fit items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10">
                <Clock3 size={21} className="text-blue-300" />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Today
                </p>

                <p className="font-semibold text-white">{formattedDate}</p>

                <p className="text-sm text-slate-400">{formattedTime}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Leave Balance</p>

                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {user?.annualLeaveBalance ?? 0}
                </p>

                <p className="mt-1 text-sm text-gray-500">days available</p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <Coins size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Requests</p>

                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {pendingRequests}
                </p>

                <p className="mt-1 text-sm text-gray-500">awaiting approval</p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                <Clock size={24} className="text-orange-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Approved Leaves</p>

                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {approvedLeaves}
                </p>

                <p className="mt-1 text-sm text-gray-500">approved requests</p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <CircleCheck size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Upcoming Leaves</p>

                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {upcomingLeaves}
                </p>

                <p className="mt-1 text-sm text-gray-500">future leaves</p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                <CalendarDays size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <WeatherCard
            weather={weather}
            loading={weatherLoading}
            error={weatherError}
            onRefresh={loadWeather}
          />
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Leave Statistics
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Overview of your leave requests
              </p>
            </div>

            <div className="mt-4 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leaveStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={105}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                    animationBegin={0}
                    animationDuration={1200}
                  >
                    {leaveStatusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value, name) => [`${value} requests`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {leaveStatusData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />

                  <span className="text-sm text-gray-600">{item.name}</span>

                  <span className="ml-auto font-semibold text-gray-900">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Leave Types
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Distribution of your leave requests by type
              </p>
            </div>

            <div className="mt-4 h-[300px]">
              {leaveTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leaveTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={75}
                      outerRadius={105}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                      animationBegin={200}
                      animationDuration={1200}
                    >
                      {leaveTypeData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={
                            [
                              "#2563eb",
                              "#8b5cf6",
                              "#06b6d4",
                              "#f59e0b",
                              "#10b981",
                              "#ef4444",
                            ][index % 6]
                          }
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      formatter={(value, name) => [`${value} requests`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  No leave requests yet
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {leaveTypeData.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: [
                        "#2563eb",
                        "#8b5cf6",
                        "#06b6d4",
                        "#f59e0b",
                        "#10b981",
                        "#ef4444",
                      ][index % 6],
                    }}
                  />

                  <span className="truncate text-sm text-gray-600">
                    {item.name}
                  </span>

                  <span className="ml-auto font-semibold text-gray-900">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Leave Requests
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Your leave requests over the last 6 months
              </p>
            </div>

            <div className="mt-6 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyLeaveData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                  />

                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                  />

                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                  />

                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="requests"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: "#2563eb",
                    }}
                    activeDot={{
                      r: 7,
                    }}
                    animationBegin={0}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Upcoming Holidays
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Next public holidays
                </p>
              </div>

              <button
                onClick={() => router.push("/holidays")}
                className="flex items-center gap-2 rounded-xl bg-slate-950 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                View More
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              {upcomingHolidays.length > 0 ? (
                upcomingHolidays.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                        <CalendarDays size={20} className="text-purple-600" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-slate-900 dark:text-white">
                          {holiday.name}
                        </h3>

                        {holiday.description && (
                          <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                            {holiday.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="ml-4 shrink-0 text-right text-sm font-medium text-slate-500 dark:text-slate-400">
                      {new Date(holiday.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No upcoming holidays.</p>
              )}
            </div>
          </div>
        </div>

        <div className="relative mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-16 -top-20 h-44 w-44 rounded-full bg-emerald-100/50 blur-3xl" />
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-violet-100/45 blur-3xl" />
            <div className="absolute bottom-0 left-1/2 h-32 w-32 rounded-full bg-amber-100/35 blur-3xl" />
          </div>

          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-sm">
                    🎂
                  </span>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                    Team birthdays
                  </p>
                </div>

                <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                  Upcoming birthdays
                </h2>
              </div>

              {upcomingBirthdays.length > 0 && (
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm">
                  {upcomingBirthdays.length} upcoming
                </span>
              )}
            </div>

            <div className="relative mt-4">
              {upcomingBirthdays.length > 0 ? (
                <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[1.05fr_1fr]">
                  <div className="group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-800 via-slate-800 to-emerald-900 p-5 shadow-md transition duration-300 hover:-translate-y-0.5 hover:shadow-lg">
                    <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-emerald-300/10 blur-2xl" />
                    <div className="absolute -bottom-12 -left-10 h-28 w-28 rounded-full bg-blue-300/10 blur-2xl" />

                    <div className="relative flex items-center gap-4">
                      <div className="relative shrink-0">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-lg font-bold text-white ring-1 ring-white/20 backdrop-blur-sm">
                          {upcomingBirthdays[0].firstName?.[0]}
                          {upcomingBirthdays[0].lastName?.[0]}
                        </div>

                        <span className="absolute -left-4 -top-4 animate-[bounce_2s_ease-in-out_infinite] text-xl">
                          🎈
                        </span>
                        <span className="absolute -right-4 -top-1 animate-[bounce_2.4s_ease-in-out_infinite] text-xl">
                          🎈
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
                            Next birthday
                          </span>
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                        </div>

                        <h3 className="mt-1 truncate text-xl font-bold text-white">
                          {upcomingBirthdays[0].firstName}{" "}
                          {upcomingBirthdays[0].lastName}
                        </h3>

                        <p className="truncate text-xs text-slate-300">
                          {upcomingBirthdays[0].department ||
                            upcomingBirthdays[0].role}
                        </p>

                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-300">
                            {upcomingBirthdays[0].nextBirthday.toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </span>

                          <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                            {upcomingBirthdays[0].daysUntil === 0
                              ? "Today 🎉"
                              : upcomingBirthdays[0].daysUntil === 1
                                ? "Tomorrow"
                                : `In ${upcomingBirthdays[0].daysUntil} days`}
                          </span>
                        </div>
                      </div>

                      <div className="hidden shrink-0 text-3xl transition duration-300 group-hover:scale-110 sm:block">
                        🎂
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {upcomingBirthdays.slice(1).map((person, index) => (
                      <div
                        key={person.id ?? `${person.email}-${person.birthDate}`}
                        className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200 transition group-hover:bg-emerald-50 group-hover:text-emerald-700">
                          {person.firstName?.[0]}
                          {person.lastName?.[0]}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {person.firstName} {person.lastName}
                          </p>
                          <p className="truncate text-[10px] text-slate-400">
                            {person.department || person.role}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-[11px] font-semibold text-slate-600">
                            {person.nextBirthday.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <p
                            className={`mt-0.5 text-[10px] font-semibold ${
                              person.daysUntil <= 7
                                ? "text-amber-600"
                                : "text-slate-400"
                            }`}
                          >
                            {person.daysUntil === 1
                              ? "Tomorrow"
                              : `${person.daysUntil} days`}
                          </p>
                        </div>

                        {index === 0 && person.daysUntil <= 7 && (
                          <span className="text-sm opacity-0 transition group-hover:opacity-100">
                            🎈
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No upcoming birthdays to display.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ClipboardPenLine className="text-gray-400" size={22} />

                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Leave Lookup
                </h2>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Your recent leave requests
              </p>
            </div>

            <button
              onClick={() => router.push("/leaves")}
              className="group flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg"
            >
              View More
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="mt-6 overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr_1fr] gap-4 border-b border-gray-100 px-4 pb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                <span>Leave Type</span>
                <span>Start</span>
                <span>End</span>
                <span>Duration</span>
                <span>Status</span>
              </div>

              <div className="divide-y divide-gray-100">
                {recentLeaves.length > 0 ? (
                  recentLeaves.map((leave) => (
                    <div
                      key={leave.id}
                      className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr_1fr] gap-4 px-4 py-4 text-sm"
                    >
                      <span className="font-semibold text-gray-800">
                        {leave.leaveType}
                      </span>

                      <span className="text-gray-500">{leave.startDate}</span>

                      <span className="text-gray-500">{leave.endDate}</span>

                      <span className="font-medium text-gray-700">
                        {leave.duration} days
                      </span>

                      <span
                        className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                          leave.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700"
                            : leave.status === "PENDING"
                              ? "bg-amber-50 text-amber-700"
                              : leave.status === "REJECTED"
                                ? "bg-red-50 text-red-700"
                                : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {leave.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="px-4 py-6 text-sm text-gray-500">
                    No leave requests found.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
