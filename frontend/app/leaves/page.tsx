"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  CircleCheck,
  CircleX,
  Ban,
  Trash2,
  CircleAlert,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import {
  getCurrentUser,
  getMyLeaves,
  getLeaveTypes,
  createLeave,
  getHolidays,
  getDepartments,
  getLeavesByDepartment,
  getAllLeaves,
  getTeamLeaves,
  updateLeaveStatus,
} from "@/lib/api";

type Leave = {
  id: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    department: string;
  };
  leaveType: string;
  startDate: string;
  endDate: string;
  duration: number;
  reason: string | null;
  requestedAt: string;
  updatedAt: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  approvedBy: number | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  documentName: string | null;
};

type LeaveType = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  consumesBalance: boolean;
  requiresDocument: boolean;
  maxDays: number | null;
};

type Holiday = {
  id: number;
  date: string;
  name: string;
  description: string | null;
};

type Department = {
  id: number;
  name: string;
};

type LeaveView = "MY" | "TEAM" | "ALL";

const ITEMS_PER_PAGE = 5;

export default function LeavesPage() {
  const [user, setUser] = useState<{
    id: number;
    firstName: string;
    annualLeaveBalance: number;
    role: string;
    permissions: string[];
  } | null>(null);

  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [teamLeaves, setTeamLeaves] = useState<Leave[]>([]);
  const [allLeaves, setAllLeaves] = useState<Leave[]>([]);

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [leaveView, setLeaveView] = useState<LeaveView>("MY");

  const [selectedDepartmentId, setSelectedDepartmentId] =
    useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showLeaveDetails, setShowLeaveDetails] = useState(false);

  const [selectedLeave, setSelectedLeave] =
    useState<Leave | null>(null);

  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [duration, setDuration] = useState(0);
  const [reason, setReason] = useState("");
  const [document, setDocument] = useState<File | null>(null);

  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const MAX_FILE_SIZE = 5 * 1024 * 1024;

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

    getLeaveTypes()
      .then((data) => {
        setLeaveTypes(data);
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

    getDepartments()
      .then((data) => {
        setDepartments(data.content ?? data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  useEffect(() => {
    if (
      leaveView === "TEAM" &&
      user?.permissions.includes("LEAVE_READ_TEAM")
    ) {
      getTeamLeaves()
        .then((data) => {
          setTeamLeaves(data);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }, [leaveView, user]);

  useEffect(() => {
    if (
      leaveView !== "ALL" ||
      !user?.permissions.includes("LEAVE_READ_ALL")
    ) {
      return;
    }

    if (!selectedDepartmentId) {
      getAllLeaves()
        .then((data) => {
          setAllLeaves(data);
        })
        .catch((error) => {
          console.error(error);
        });

      return;
    }

    getLeavesByDepartment(Number(selectedDepartmentId))
      .then((data) => {
        setAllLeaves(data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [leaveView, selectedDepartmentId, user]);

  useEffect(() => {
    if (!startDate || !endDate) {
      setDuration(0);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      setDuration(0);
      return;
    }

    const holidayDates = new Set(
      holidays.map((holiday) => holiday.date)
    );

    let days = 0;
    const current = new Date(start);

    while (current <= end) {
      const day = current.getDay();
      const dateString = current.toISOString().split("T")[0];

      const isWeekend = day === 0 || day === 6;
      const isHoliday = holidayDates.has(dateString);

      if (!isWeekend && !isHoliday) {
        days++;
      }

      current.setDate(current.getDate() + 1);
    }

    setDuration(days);
  }, [startDate, endDate, holidays]);

  const displayedLeaves = useMemo(() => {
    if (leaveView === "MY") {
      return leaves;
    }

    if (leaveView === "TEAM") {
      return teamLeaves;
    }

    return allLeaves;
  }, [leaveView, leaves, teamLeaves, allLeaves]);

  const filteredLeaves = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return displayedLeaves.filter((leave) => {
      const employeeName =
        `${leave.user.firstName} ${leave.user.lastName}`.toLowerCase();

      const email = leave.user.email.toLowerCase();
      const leaveType = leave.leaveType.toLowerCase();
      const department = leave.user.department.toLowerCase();

      const matchesSearch =
        !search ||
        employeeName.includes(search) ||
        email.includes(search) ||
        leaveType.includes(search) ||
        department.includes(search);

      const matchesStatus =
        !statusFilter || leave.status === statusFilter;

      const matchesStartDate =
        !filterStartDate ||
        leave.startDate >= filterStartDate;

      const matchesEndDate =
        !filterEndDate ||
        leave.endDate <= filterEndDate;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [
    displayedLeaves,
    searchTerm,
    statusFilter,
    filterStartDate,
    filterEndDate,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLeaves.length / ITEMS_PER_PAGE)
  );

  const paginatedLeaves = useMemo(() => {
    const startIndex =
      (currentPage - 1) * ITEMS_PER_PAGE;

    return filteredLeaves.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [filteredLeaves, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    leaveView,
    selectedDepartmentId,
    searchTerm,
    statusFilter,
    filterStartDate,
    filterEndDate,
  ]);

  const refreshLeaves = async () => {
    if (leaveView === "MY") {
      const updatedLeaves = await getMyLeaves();
      setLeaves(updatedLeaves);
    }

    if (leaveView === "TEAM") {
      const updatedLeaves = await getTeamLeaves();
      setTeamLeaves(updatedLeaves);
    }

    if (leaveView === "ALL") {
      if (selectedDepartmentId) {
        const updatedLeaves = await getLeavesByDepartment(
          Number(selectedDepartmentId)
        );

        setAllLeaves(updatedLeaves);
      } else {
        const updatedLeaves = await getAllLeaves();
        setAllLeaves(updatedLeaves);
      }
    }

    const updatedUser = await getCurrentUser();
    setUser(updatedUser);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedDepartmentId("");
    setStatusFilter("");
    setFilterStartDate("");
    setFilterEndDate("");
    setCurrentPage(1);
  };

  const handleSubmit = async () => {
    setFormError("");

    if (!leaveType) {
      setFormError("Please select a leave type.");
      return;
    }

    if (!startDate) {
      setFormError("Please select a start date.");
      return;
    }

    if (!endDate) {
      setFormError("Please select an end date.");
      return;
    }

    if (endDate < startDate) {
      setFormError("End date cannot be before start date.");
      return;
    }

    if (!reason.trim()) {
      setFormError("Please provide a reason for your leave.");
      return;
    }

    const selectedLeaveType = leaveTypes.find(
      (type) => type.id.toString() === leaveType
    );

    if (!selectedLeaveType) {
      setFormError("Invalid leave type.");
      return;
    }

    if (selectedLeaveType.requiresDocument && !document) {
      setFormError(
        "A supporting document is required for this leave type."
      );
      return;
    }

    try {
      setIsSubmitting(true);

      await createLeave(
        Number(leaveType),
        startDate,
        endDate,
        reason.trim(),
        document
      );

      const updatedLeaves = await getMyLeaves();
      setLeaves(updatedLeaves);

      const updatedUser = await getCurrentUser();
      setUser(updatedUser);

      setShowRequestForm(false);

      setLeaveType("");
      setStartDate("");
      setEndDate("");
      setDuration(0);
      setReason("");
      setDocument(null);
      setFormError("");
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError(
          "Failed to submit leave request. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveLeave = async (leaveId: number) => {
    try {
      setIsActionLoading(true);
      setActionError("");

      await updateLeaveStatus(leaveId, "APPROVED");

      await refreshLeaves();

      setShowLeaveDetails(false);
      setSelectedLeave(null);
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        setActionError(error.message);
      } else {
        setActionError("Failed to approve leave request.");
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectLeave = async (leaveId: number) => {
    if (!rejectionReason.trim()) {
      setActionError("Please provide a rejection reason.");
      return;
    }

    try {
      setIsActionLoading(true);
      setActionError("");

      await updateLeaveStatus(
        leaveId,
        "REJECTED",
        rejectionReason.trim()
      );

      await refreshLeaves();

      setShowLeaveDetails(false);
      setSelectedLeave(null);
      setRejectionReason("");
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        setActionError(error.message);
      } else {
        setActionError("Failed to reject leave request.");
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelLeave = async (leaveId: number) => {
    try {
      setIsActionLoading(true);
      setActionError("");

      await updateLeaveStatus(leaveId, "CANCELLED");

      await refreshLeaves();

      setShowLeaveDetails(false);
      setSelectedLeave(null);
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        setActionError(error.message);
      } else {
        setActionError("Failed to cancel leave request.");
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const selectedLeaveType = leaveTypes.find(
    (type) => type.id.toString() === leaveType
  );

  const pendingLeaves = leaves.filter(
    (leave) => leave.status === "PENDING"
  ).length;

  const approvedLeaves = leaves.filter(
    (leave) => leave.status === "APPROVED"
  ).length;

  const rejectedLeaves = leaves.filter(
    (leave) => leave.status === "REJECTED"
  ).length;

  const cancelledLeaves = leaves.filter(
    (leave) => leave.status === "CANCELLED"
  ).length;

  const openLeaveDetails = (leave: Leave) => {
    setSelectedLeave(leave);
    setRejectionReason("");
    setActionError("");
    setShowLeaveDetails(true);
  };

  const closeLeaveDetails = () => {
    if (isActionLoading) {
      return;
    }

    setShowLeaveDetails(false);
    setSelectedLeave(null);
    setRejectionReason("");
    setActionError("");
  };

  const canCancelOwnLeave = (leave: Leave) => {
    return (
      (leave.status === "PENDING" ||
        leave.status === "APPROVED") &&
      user?.id === leave.user.id &&
      user?.permissions.includes("LEAVE_CANCEL_OWN")
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <CalendarDays size={24} />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Leave Management
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage your leave requests and track their status.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setFormError("");
              setShowRequestForm(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Request Leave
          </button>
        </div>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Leave Balance
              </p>

              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900">
                  {user?.annualLeaveBalance ?? 0}
                </span>

                <span className="text-sm font-medium text-gray-500">
                  days available
                </span>
              </div>

              <p className="mt-2 text-sm text-gray-500">
                Your current annual leave balance
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <CalendarDays size={24} />
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Pending
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {pendingLeaves}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  awaiting approval
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Clock3 size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Approved
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {approvedLeaves}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  approved requests
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-600">
                <CircleCheck size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Rejected
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {rejectedLeaves}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  rejected requests
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <CircleX size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Cancelled
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {cancelledLeaves}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  cancelled requests
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                <Ban size={22} />
              </div>
            </div>
          </div>
        </div>

        {showRequestForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Request Leave
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Submit a new leave request for approval.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <CircleX size={24} />
                </button>
              </div>

              <div className="mt-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Leave Type{" "}
                  <span className="text-red-500">*</span>
                </label>

                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="" disabled>
                    Select leave type
                  </option>

                  {leaveTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Start Date{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    End Date{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Duration
                </label>

                <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <span className="text-lg font-semibold text-gray-900">
                    {duration}
                  </span>

                  <span className="ml-2 text-sm text-gray-500">
                    working {duration === 1 ? "day" : "days"}
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Reason <span className="text-red-500">*</span>
                </label>

                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter the reason for your leave..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Supporting Document{" "}
                  {selectedLeaveType?.requiresDocument && (
                    <span className="text-red-500">*</span>
                  )}
                </label>

                {document ? (
                  <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-700">
                        {document.name}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {(document.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDocument(null)}
                      className="ml-4 rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-8 text-center transition hover:border-blue-300 hover:bg-blue-50">
                    <div className="text-sm font-medium text-gray-700">
                      Upload a supporting document
                    </div>

                    <p className="mt-1 text-xs text-gray-500">
                      PDF, JPG or PNG · Maximum 5 MB
                    </p>

                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];

                        if (!file) {
                          return;
                        }

                        if (file.size > MAX_FILE_SIZE) {
                          setFormError(
                            "File size must not exceed 5 MB."
                          );
                          e.target.value = "";
                          return;
                        }

                        setFormError("");
                        setDocument(file);
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {formError && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  <CircleAlert
                    className="mr-2 inline-block"
                    size={18}
                  />
                  {formError}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting
                    ? "Submitting..."
                    : "Submit Request"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Leave Requests
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  View and manage leave requests based on your permissions.
                </p>
              </div>

              <div className="flex rounded-xl bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => setLeaveView("MY")}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    leaveView === "MY"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  My Leaves
                </button>

                {user?.permissions.includes("LEAVE_READ_TEAM") && (
                  <button
                    type="button"
                    onClick={() => setLeaveView("TEAM")}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      leaveView === "TEAM"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Team Leaves
                  </button>
                )}

                {user?.permissions.includes("LEAVE_READ_ALL") && (
                  <button
                    type="button"
                    onClick={() => setLeaveView("ALL")}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      leaveView === "ALL"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  All Leaves
                </button>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-52">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search employee..."
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {leaveView === "ALL" &&
                user?.permissions.includes("LEAVE_READ_ALL") && (
                  <select
                    value={selectedDepartmentId}
                    onChange={(e) =>
                      setSelectedDepartmentId(e.target.value)
                    }
                    className="h-10 w-36 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">All Departments</option>

                    {departments.map((department) => (
                      <option
                        key={department.id}
                        value={department.id}
                      >
                        {department.name}
                      </option>
                    ))}
                  </select>
                )}

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="h-10 w-32 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <input
                type="date"
                value={filterStartDate}
                onChange={(e) =>
                  setFilterStartDate(e.target.value)
                }
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <span className="text-sm text-gray-400">—</span>

              <input
                type="date"
                value={filterEndDate}
                onChange={(e) =>
                  setFilterEndDate(e.target.value)
                }
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <button
                type="button"
                onClick={resetFilters}
                className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                <RotateCcw size={15} />
                Reset
              </button>
            </div>
          </div>

          {filteredLeaves.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  No leave requests found.
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Try changing your filters.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1150px]">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-400">
                        Employee
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-400">
                        Department
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-400">
                        Type
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-400">
                        Start
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-400">
                        End
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-400">
                        Duration
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-400">
                        Reason
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-400">
                        Status
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-400">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedLeaves.map((leave) => {
                      const initials =
                        `${leave.user.firstName.charAt(0)}${leave.user.lastName.charAt(0)}`.toUpperCase();

                      return (
                        <tr
                          key={leave.id}
                          className="border-b border-gray-50 last:border-0"
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                                {initials}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-gray-900">
                                  {leave.user.firstName}{" "}
                                  {leave.user.lastName}
                                </p>

                                <p className="truncate text-xs text-gray-500">
                                  {leave.user.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 text-sm text-gray-600">
                            {leave.user.department}
                          </td>

                          <td className="px-4 py-4 text-sm font-medium text-gray-900">
                            {leave.leaveType}
                          </td>

                          <td className="px-4 py-4 text-sm text-gray-600">
                            {leave.startDate}
                          </td>

                          <td className="px-4 py-4 text-sm text-gray-600">
                            {leave.endDate}
                          </td>

                          <td className="px-4 py-4 text-sm text-gray-600">
                            {leave.duration}{" "}
                            {leave.duration === 1
                              ? "day"
                              : "days"}
                          </td>

                          <td className="max-w-48 px-4 py-4 text-sm text-gray-600">
                            <span className="block truncate">
                              {leave.reason || "—"}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                leave.status === "PENDING"
                                  ? "bg-amber-50 text-amber-600"
                                  : leave.status === "APPROVED"
                                    ? "bg-green-50 text-green-600"
                                    : leave.status === "REJECTED"
                                      ? "bg-red-50 text-red-600"
                                      : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {leave.status}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openLeaveDetails(leave)
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                              >
                                <Eye size={15} />
                                View
                              </button>

                              {leaveView === "MY" &&
                                canCancelOwnLeave(leave) && (
                                  <button
                                    type="button"
                                    disabled={isActionLoading}
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          "Are you sure you want to cancel this leave request?"
                                        )
                                      ) {
                                        handleCancelLeave(
                                          leave.id
                                        );
                                      }
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <Trash2 size={15} />
                                    Cancel
                                  </button>
                                )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Showing{" "}
                  <span className="font-medium text-gray-700">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-gray-700">
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredLeaves.length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-gray-700">
                    {filteredLeaves.length}
                  </span>{" "}
                  requests
                </p>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.max(1, page - 1)
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={17} />
                  </button>

                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1
                  ).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold transition ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(totalPages, page + 1)
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {showLeaveDetails && selectedLeave && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                    {selectedLeave.user.firstName.charAt(0)}
                    {selectedLeave.user.lastName.charAt(0)}
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Leave Request Details
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      {selectedLeave.user.firstName}{" "}
                      {selectedLeave.user.lastName}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeLeaveDetails}
                  className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <CircleX size={24} />
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase text-gray-400">
                    Employee
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {selectedLeave.user.firstName}{" "}
                    {selectedLeave.user.lastName}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {selectedLeave.user.email}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase text-gray-400">
                    Department
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {selectedLeave.user.department}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase text-gray-400">
                    Leave Type
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {selectedLeave.leaveType}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase text-gray-400">
                    Status
                  </p>

                  <p className="mt-1">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        selectedLeave.status === "PENDING"
                          ? "bg-amber-50 text-amber-600"
                          : selectedLeave.status === "APPROVED"
                            ? "bg-green-50 text-green-600"
                            : selectedLeave.status === "REJECTED"
                              ? "bg-red-50 text-red-600"
                              : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {selectedLeave.status}
                    </span>
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase text-gray-400">
                    Start Date
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {selectedLeave.startDate}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase text-gray-400">
                    End Date
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {selectedLeave.endDate}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase text-gray-400">
                    Duration
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {selectedLeave.duration}{" "}
                    {selectedLeave.duration === 1
                      ? "day"
                      : "days"}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase text-gray-400">
                    Requested At
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {selectedLeave.requestedAt
                      ? new Date(
                          selectedLeave.requestedAt
                        ).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase text-gray-400">
                  Reason
                </p>

                <p className="mt-1 text-sm text-gray-700">
                  {selectedLeave.reason ||
                    "No reason provided."}
                </p>
              </div>

              {selectedLeave.rejectionReason && (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">
                  <p className="text-xs font-medium uppercase text-red-500">
                    Rejection Reason
                  </p>

                  <p className="mt-1 text-sm text-red-700">
                    {selectedLeave.rejectionReason}
                  </p>
                </div>
              )}

              <div className="mt-4 rounded-xl bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase text-gray-400">
                  Supporting Document
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {selectedLeave.documentName ||
                    "No document attached."}
                </p>
              </div>

              {selectedLeave.status === "PENDING" &&
                user?.permissions.includes("LEAVE_REJECT") && (
                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Rejection Reason
                    </label>

                    <textarea
                      value={rejectionReason}
                      onChange={(e) =>
                        setRejectionReason(e.target.value)
                      }
                      placeholder="Enter the reason for rejection..."
                      rows={3}
                      className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                )}

              {actionError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  <CircleAlert
                    className="mr-2 inline-block"
                    size={18}
                  />
                  {actionError}
                </div>
              )}

              <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">
                {selectedLeave.status === "PENDING" &&
                  user?.permissions.includes("LEAVE_APPROVE") && (
                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() =>
                        handleApproveLeave(selectedLeave.id)
                      }
                      className="rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isActionLoading
                        ? "Processing..."
                        : "Approve"}
                    </button>
                  )}

                {selectedLeave.status === "PENDING" &&
                  user?.permissions.includes("LEAVE_REJECT") && (
                    <button
                      type="button"
                      disabled={
                        isActionLoading ||
                        !rejectionReason.trim()
                      }
                      onClick={() =>
                        handleRejectLeave(selectedLeave.id)
                      }
                      className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isActionLoading
                        ? "Processing..."
                        : "Reject"}
                    </button>
                  )}

                {canCancelOwnLeave(selectedLeave) && (
                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Are you sure you want to cancel this leave request?"
                        )
                      ) {
                        handleCancelLeave(
                          selectedLeave.id
                        );
                      }
                    }}
                    className="rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel Leave
                  </button>
                )}

                <button
                  type="button"
                  onClick={closeLeaveDetails}
                  className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}