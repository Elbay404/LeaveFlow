"use client";

import { useEffect, useState } from "react";
import {
  getAvailability,
  getDepartments,
  getUsers,
  getHolidays,
  getCurrentUser,
} from "@/lib/api";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock3,
  Gift,
  GlobeOff,
  Search,
} from "lucide-react";

type DayAvailability = {
  status: string;
  label: string;
};

type Availability = {
  userId: number;
  firstName: string;
  lastName: string;
  department: string | null;
  availability: Record<string, DayAvailability>;
};

type AvailabilityResponse = {
  content: Availability[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
};

type Department = {
  id: number;
  name: string;
};

type User = {
  id: number;
  firstName: string;
  lastName: string;
  departmentName: string | null;
};

type Holiday = {
  id: number;
  date: string;
  name: string;
  description: string | null;
};

export default function AvailabilityPage() {
  const [data, setData] = useState<AvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState<
    { role: string } | null
  >(null);

  useEffect(() => {
    setLoading(true);

    getAvailability(
      selectedDepartment ? Number(selectedDepartment) : undefined,
      selectedUser ? Number(selectedUser) : undefined,
      0,
      10,
      startDate,
      search.trim() || undefined,
    )
      .then((response) => {
        setData(response);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
      });

    getHolidays()
      .then((response) => {
        setHolidays(response);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [selectedDepartment, selectedUser, weekOffset, search]);

  useEffect(() => {
    getCurrentUser()
      .then((response) => {
        setCurrentUser(response);
      })
      .catch((error) => {
        console.error(error);
      });

    getDepartments()
      .then((response) => {
        setDepartments(response.content);
      })
      .catch((error) => {
        console.error(error);
      });

    getUsers()
      .then((response) => {
        setUsers(response.content);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  useEffect(() => {
    setSelectedUser("");
    setSearch("");
  }, [selectedDepartment]);

  const today = new Date();

  const monday = new Date(today);
  const day = monday.getDay();
  const difference = day === 0 ? -6 : 1 - day;

  monday.setDate(monday.getDate() + difference + weekOffset * 7);
  const startDate = monday.toISOString().split("T")[0];

  const weekDays = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  const formatWeek = () => {
    const start = weekDays[0];
    const end = weekDays[4];

    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const getStatus = (status: string) => {
    if (status === "ON_LEAVE") {
      return {
        label: "On Leave",
        className: "bg-red-50 text-red-600 border-red-100",
        icon: <GlobeOff size={15} />,
      };
    }

    if (status === "PENDING") {
      return {
        label: "Pending",
        className: "bg-amber-50 text-amber-600 border-amber-100",
        icon: <Clock3 size={15} />,
      };
    }

    if (status === "HOLIDAY") {
      return {
        label: "Holiday",
        className: "bg-blue-50 text-blue-600 border-blue-100",
        icon: <Gift size={15} />,
      };
    }

    return {
      label: "Available",
      className: "bg-emerald-50 text-emerald-600 border-emerald-100",
      icon: <CircleCheck size={15} />,
    };
  };

  const selectedDepartmentName = departments.find(
    (department) => department.id === Number(selectedDepartment),
  )?.name;

  const filteredUsers = selectedDepartmentName
    ? users.filter((user) => user.departmentName === selectedDepartmentName)
    : users;

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto  max-w-[1500px]">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              <CalendarDays size={28} />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Availability
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                View employee availability, leaves and public holidays.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee..."
              className="w-56 rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedDepartment}
              onChange={(event) => setSelectedDepartment(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
            >
            <option value="">
  {currentUser?.role === "HR" ? "All Departments" : "My Department"}
</option>

              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>

            <select
              value={selectedUser}
              onChange={(event) => setSelectedUser(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="" disabled={selectedDepartment === ""}>
                All Employees
              </option>

              {filteredUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex  items-center gap-3">
            <button
              onClick={() => setWeekOffset((current) => current - 1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex min-w-[190px] items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2">
              <CalendarDays size={17} className="text-blue-600" />
              <span className="text-sm font-semibold text-slate-700">
                {formatWeek()}
              </span>
            </div>

            <button
              onClick={() => setWeekOffset((current) => current + 1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            >
              <ChevronRight size={18} />
            </button>

            <button
              onClick={() => setWeekOffset(0)}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Today
            </button>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-emerald-700">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Available
            </div>

            <div className="flex items-center gap-2 rounded-full bg-red-50 px-3 py-2 text-red-700">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              On Leave
            </div>

            <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-amber-700">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              Pending
            </div>

            <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-blue-700">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              Holiday
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <div className="grid  min-w-[900px] grid-cols-[240px_repeat(5,minmax(150px,1fr))] border-b border-slate-200 bg-slate-50">
            <div className="flex items-center px-6 py-4">
              <span className="text-sm font-bold text-slate-700">
                Employees
              </span>
            </div>

            {weekDays.map((date) => {
              const dateKey = date.toISOString().split("T")[0];

              const holiday = holidays.find((item) => item.date === dateKey);

              return (
                <div
                  key={date.toISOString()}
                  className={`border-l border-slate-200 px-4 py-4 text-center ${
                    holiday ? "bg-blue-50/60" : ""
                  }`}
                >
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    {date.toLocaleDateString("en-US", {
                      weekday: "short",
                    })}
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {formatDate(date)}
                  </p>

                  {holiday && (
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                      <Gift size={12} />
                      {holiday.name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {loading && (
            <div className="p-12 text-center text-sm text-slate-500">
              Loading availability...
            </div>
          )}

          {!loading && data?.content.length === 0 && (
            <div className="p-12 text-center text-sm text-slate-500">
              No employees found.
            </div>
          )}

          {!loading &&
            data?.content.map((employee) => (
              <div
                key={employee.userId}
                className=" grid  grid-cols-[240px_repeat(5,minmax(150px,1fr))] border-b border-slate-100 last:border-b-0"
              >
                <div className="flex items-center gap-3 px-6 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                    {employee.firstName.charAt(0)}
                    {employee.lastName.charAt(0)}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {employee.firstName} {employee.lastName}
                    </p>

                    <p className="truncate text-xs text-slate-400">
                      {employee.department ?? "No department"}
                    </p>
                  </div>
                </div>

                {weekDays.map((date) => {
                  const dateKey = date.toISOString().split("T")[0];

                  const dayAvailability = employee.availability[dateKey] ?? {
                    status: "AVAILABLE",
                    label: "Available",
                  };

                  const statusInfo = getStatus(dayAvailability.status);

                  return (
                    <div
                      key={dateKey}
                      className="flex items-center border-l border-slate-100 p-2"
                    >
                      <div
                        className={`group flex min-h-[64px] w-full flex-col items-center justify-center gap-1 rounded-xl border px-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${statusInfo.className}`}
                      >
                        <div className="flex items-center gap-1.5">
                          {statusInfo.icon}
                          <span className="text-xs font-semibold">
                            {dayAvailability.label}
                          </span>
                        </div>

                        <span className="text-[10px] opacity-60">
                          {dayAvailability.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
        </div>

        {data && (
          <div className="mt-5 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Showing {data.content.length} of {data.totalElements} employees
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={data.number === 0}
                onClick={() => {
                  getAvailability(
                    selectedDepartment ? Number(selectedDepartment) : undefined,
                    selectedUser ? Number(selectedUser) : undefined,
                    data.number - 1,
                    10,
                    startDate,
                  ).then(setData);
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="px-2 text-sm font-semibold text-slate-700">
                {data.number + 1} / {data.totalPages || 1}
              </span>

              <button
                disabled={data.number >= data.totalPages - 1}
                onClick={() => {
                  getAvailability(
                    selectedDepartment ? Number(selectedDepartment) : undefined,
                    selectedUser ? Number(selectedUser) : undefined,
                    data.number + 1,
                    10,
                    startDate,
                  ).then(setData);
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
