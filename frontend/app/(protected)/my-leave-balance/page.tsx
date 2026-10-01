"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileClock,
  Info,
  Loader2,
  TrendingUp,
  XCircle,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getMyLeaveBalance } from "@/lib/api";

type MonthlyConsumption = {
  month: string;
  days: number;
};

type LeaveBalance = {
  year: number;
  accruedDays: number;
  usedDays: number;
  remainingDays: number;
  workingDays: number;
  userWorkingDays: number;
  nonWorkingDays: number;
  utilizationPercentage: number;
  nextAccrualDate: string;
  monthlyConsumption: MonthlyConsumption[];
};

export default function MyLeaveBalancePage() {
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMyLeaveBalance();

      setBalance(data);
    } catch {
      setError("Unable to load your leave balance.");
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (!balance) return [];

    return balance.monthlyConsumption.map((item) => ({
      month: item.month.substring(0, 3),
      days: item.days,
    }));
  }, [balance]);

  const resetYear = balance
    ? balance.year + 1
    : new Date().getFullYear() + 1;

  const formattedAccrualDate = balance
    ? new Date(
        `${balance.nextAccrualDate}T00:00:00`
      ).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Loading your leave balance...
          </p>
        </div>
      </div>
    );
  }

  if (error || !balance) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/30">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              {error || "Unable to load your leave balance."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Remaining",
      value: balance.remainingDays,
      suffix: "days",
      description: "Available to use",
      icon: CalendarDays,
      iconClass:
        "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    },
    {
      label: "Used",
      value: balance.usedDays,
      suffix: "days",
      description: "Approved this year",
      icon: FileClock,
      iconClass:
        "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
    },
    {
      label: "Accrued",
      value: balance.accruedDays,
      suffix: "days",
      description: "Earned this year",
      icon: TrendingUp,
      iconClass:
        "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    },
    {
      label: "Your Working Days",
      value: balance.userWorkingDays,
      suffix: "days",
      description: `After approved leave in ${balance.year}`,
      icon: CheckCircle2,
      iconClass:
        "bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400",
    },
  ];

  return (
    <div className="min-h-full px-4 py-8 font-sans sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#07152f] via-[#0b2148] to-[#103b79] px-6 py-7 shadow-xl shadow-blue-950/10 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 ring-1 ring-blue-400/20">
                <CalendarDays className="h-6 w-6 text-blue-300" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[27px]">
                  My Leave Balance
                </h1>

                <p className="mt-1 text-sm font-medium text-blue-100/75">
                  Track your leave balance and yearly consumption.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-sm sm:self-auto">
              <Clock3 className="h-4 w-4 text-blue-200" />

              <span className="text-sm font-semibold text-white">
                {balance.year}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">
                      {stat.label}
                    </p>

                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                        {stat.value}
                      </span>

                      <span className="text-sm font-medium text-slate-400 dark:text-slate-500">
                        {stat.suffix}
                      </span>
                    </div>

                    <p className="mt-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                      {stat.description}
                    </p>
                  </div>

                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.iconClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-950 dark:text-white">
                  Monthly Leave Consumption
                </h2>

                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Approved leave days taken by month. Weekends and public
                  holidays are excluded.
                </p>
              </div>

              <div className="flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 dark:bg-blue-950/40">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />

                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                  {balance.usedDays} days used
                </span>
              </div>
            </div>

            <div className="mt-6 h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -15,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-slate-200 dark:stroke-slate-800"
                  />

                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                    className="fill-slate-500"
                  />

                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                    className="fill-slate-500"
                  />

                  <Tooltip
                    cursor={{
                      stroke: "rgba(59,130,246,0.15)",
                      strokeWidth: 2,
                    }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      backgroundColor: "#ffffff",
                      boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
                      fontSize: "13px",
                    }}
                    formatter={(value) => [
                      `${value} days`,
                      "Leave consumed",
                    ]}
                  />

                  <Line
                    type="monotone"
                    dataKey="days"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      strokeWidth: 2,
                      fill: "#ffffff",
                    }}
                    activeDot={{
                      r: 6,
                      strokeWidth: 3,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-950/50">
                  <XCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    Non-working days
                  </p>

                  <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
                    {balance.nonWorkingDays} days
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-5 text-slate-500 dark:text-slate-400">
                Weekends and public holidays in the {balance.year} company
                calendar.
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/30">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/60">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-blue-950 dark:text-blue-200">
                    Annual balance cycle
                  </h3>

                  <p className="mt-2 text-sm leading-5 text-blue-800/80 dark:text-blue-300/75">
                    Your leave balance resets on January 1, {resetYear}.
                    Monthly accrual then starts again according to the
                    configured company leave policy.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/30">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/60">
                  <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                    Next accrual
                  </h3>

                  <p className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-300">
                    +2 days
                  </p>

                  <p className="mt-1 text-sm font-medium text-emerald-800/70 dark:text-emerald-300/70">
                    {formattedAccrualDate}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    Leave utilization
                  </p>

                  <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
                    {balance.utilizationPercentage.toFixed(0)}%
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950">
                  <TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600 transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      balance.utilizationPercentage,
                      100
                    )}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                {balance.usedDays} of {balance.accruedDays} accrued days used
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}