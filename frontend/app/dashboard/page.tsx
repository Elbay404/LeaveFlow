"use client";

import { useEffect, useState } from "react";
import {useRouter} from "next/navigation";
import {
  Clock3,
  Palmtree,
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
} from "@/lib/api";

type User = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string | null;
  annualLeaveBalance: number;
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();

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
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

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
    (leave) => leave.status === "PENDING"
  ).length;

  const approvedLeaves = leaves.filter(
    (leave) => leave.status === "APPROVED"
  ).length;

  const upcomingLeaves = leaves.filter(
    (leave) =>
      leave.status === "APPROVED" &&
      new Date(leave.startDate) > new Date()
  ).length;

  const rejectedLeaves = leaves.filter(
    (leave) => leave.status === "REJECTED"
  ).length;

  const cancelledLeaves = leaves.filter(
    (leave) => leave.status === "CANCELLED"
  ).length;

  const upcomingHolidays = holidays
    .filter(
      (holiday) =>
        new Date(holiday.date) >= new Date()
    )
    .sort(
      (a, b) =>
        new Date(a.date).getTime() -
        new Date(b.date).getTime()
    )
    .slice(0, 3);

    const recentLeaves = [...leaves] //copy leaves
      .sort(
        (a, b) =>
          new Date(b.requestedAt).getTime() -
          new Date(a.requestedAt).getTime()
      )
      .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {greeting},{" "}
              {user ? user.firstName : "Loading..."} 👋
            </h1>

            <p className="mt-2 text-gray-500">
              Here's what's happening with your leaves.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-sm">
            <Clock3 size={22} />

            <div>
              <p className="text-sm text-gray-500">
                Today
              </p>

              <p className="font-semibold text-gray-900">
                {formattedDate}
              </p>

              <p className="text-sm text-gray-500">
                {formattedTime}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Leave Balance
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {user?.annualLeaveBalance ?? 0}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  days available
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <Coins
                  size={24}
                  className="text-green-600"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Pending Requests
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {pendingRequests}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  awaiting approval
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                <Clock
                  size={24}
                  className="text-orange-600"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Approved Leaves
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {approvedLeaves}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  approved requests
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <CircleCheck
                  size={24}
                  className="text-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Upcoming Leaves
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {upcomingLeaves}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  future leaves
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                <CalendarDays
                  size={24}
                  className="text-purple-600"
                />
              </div>
            </div>
          </div>

        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Leave Statistics
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Overview of your leave requests
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    <CircleCheck
                      size={20}
                      className="text-green-600"
                    />
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Approved
                    </p>

                    <p className="text-2xl font-bold text-gray-900">
                      {approvedLeaves}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                    <Clock
                      size={20}
                      className="text-orange-600"
                    />
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Pending
                    </p>

                    <p className="text-2xl font-bold text-gray-900">
                      {pendingRequests}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                    <CircleX
                      size={20}
                      className="text-red-600"
                    />
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Rejected
                    </p>

                    <p className="text-2xl font-bold text-gray-900">
                      {rejectedLeaves}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                    <Ban
                      size={20}
                      className="text-gray-600"
                    />
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Cancelled
                    </p>

                    <p className="text-2xl font-bold text-gray-900">
                      {cancelledLeaves}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Upcoming Holidays
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Next public holidays
                </p>
              </div>

              <CalendarDays
                className="text-gray-400"
                size={22}
              />
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
                        <CalendarDays
                          size={20}
                          className="text-purple-600"
                        />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-gray-900">
                          {holiday.name}
                        </h3>

                        {holiday.description && (
                          <p className="mt-1 truncate text-sm text-gray-500">
                            {holiday.description}
                          </p>
                        )}
                      </div>

                    </div>

                    <p className="ml-4 shrink-0 text-right text-sm font-medium text-gray-500">
                      {new Date(
                        holiday.date
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>

                  </div>

                ))
              ) : (
                <p className="text-sm text-gray-500">
                  No upcoming holidays.
                </p>
              )}

            </div>
          </div>

        </div>

          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                  
                  <div className="flex items-center gap-2">
                    <ClipboardPenLine
                      className="text-gray-400"
                      size={22}
                    />

                    <h2 className="text-lg font-semibold text-gray-900">
                      Leave Lookup
                    </h2>
                  </div>

                  <p className="mt-1 text-sm text-gray-500">
                    Your recent leave requests
                  </p>
                </div>

              
              <button
                onClick={() => router.push("/leaves")}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
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

                        <span className="text-gray-500">
                          {leave.startDate}
                        </span>

                        <span className="text-gray-500">
                          {leave.endDate}
                        </span>

                        <span className="font-medium text-gray-700">
                          {leave.duration} days
                        </span>

                        <span className="font-semibold">
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