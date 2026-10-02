"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  UsersRound,
  Plus,
  X,
  Pencil,
  Info,
  UserCheck,
  UserX,
  KeyRound,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import {
  getCurrentUser,
  getUsers,
  getDepartments,
  createUser,
  updateUser,
  getRoles,
  resetUserPassword,
  importUsers,
} from "@/lib/api";

type CurrentUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string | null;
  permissions: string[];
};

type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  active: boolean;
  mustChangePassword: boolean;
  roleName: string;
  departmentName: string | null;
  hireDate: string;
  annualLeaveBalance: number;
  birthDate?: string | null;
  managerId?: number | null;
  managerFirstName?: string | null;
  managerLastName?: string | null;
  
};

type Department = {
  id: number;
  name: string;
};

type Role = {
  id: number;
  name: string;
  description: string | null;
};

type UserForm = {
  firstName: string;
  lastName: string;
  phone: string;
  roleId: string;
  departmentId: string;
  hireDate: string;
  birthDate: string;
  active: boolean;
};

type ConfirmAction = {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
} | null;

const ITEMS_PER_PAGE = 8;

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ACTIVE" | "INACTIVE" | "ALL"
  >("ACTIVE");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [originalForm, setOriginalForm] = useState<UserForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<UserForm>({
    firstName: "",
    lastName: "",
    phone: "",
    roleId: "",
    departmentId: "",
    hireDate: "",
    birthDate: "",
    active: true,
  });
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState("");

  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    totalRows: number;
    successCount: number;
    failedCount: number;
    errors: {
      row: number;
      message: string;
    }[];
  } | null>(null);

  const handleImportUsers = async () => {
    if (!importFile) {
      toast.error("Please select an Excel file.");
      return;
    }

    const extension = importFile.name.toLowerCase();

    if (!extension.endsWith(".xlsx") && !extension.endsWith(".xls")) {
      toast.error("Only .xlsx and .xls files are supported.");
      return;
    }

    try {
      setImporting(true);
      setImportResult(null);

      const result = await importUsers(importFile);

      setImportResult(result);

      if (result.failedCount === 0) {
        toast.success(`${result.successCount} users imported successfully.`);
      } else {
        toast.warning(
          `${result.successCount} users imported, ${result.failedCount} failed.`,
        );
      }

      await loadUsers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to import users.",
      );
    } finally {
      setImporting(false);
    }
  };

  const hasPermission = (permission: string) =>
    currentUser?.permissions?.includes(permission) ?? false;

  const isPrivilegedViewer =
    currentUser?.role === "HR" || currentUser?.role === "CEO";

  const loadUsers = async (page = currentPage) => {
    setUsersLoading(true);
    setError("");

    try {
     const usersResponse = await getUsers(page,ITEMS_PER_PAGE,search);
      const userData: User[] = Array.isArray(usersResponse)
        ? usersResponse
        : "content" in usersResponse
          ? usersResponse.content
          : [];

      setUsers(userData);

      if (!Array.isArray(usersResponse) && "totalPages" in usersResponse) {
        setTotalPages(Math.max(1, usersResponse.totalPages));
        setTotalUsers(usersResponse.totalElements ?? 0);
      } else {
        setTotalPages(Math.max(1, Math.ceil(userData.length / ITEMS_PER_PAGE)));
        setTotalUsers(userData.length);
      }
    } catch (loadError) {
      console.error(loadError);
      setError("Unable to load users.");
    } finally {
      setUsersLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [currentUserResponse, departmentsResponse] = await Promise.all([
        getCurrentUser(),
        getDepartments(0, 100),
      ]);

      setCurrentUser(currentUserResponse);

      const departmentData: Department[] = Array.isArray(departmentsResponse)
        ? departmentsResponse
        : "content" in departmentsResponse
          ? departmentsResponse.content
          : [];

      setDepartments(departmentData);

      if (
        currentUserResponse.permissions.includes("USER_CREATE") ||
        currentUserResponse.permissions.includes("USER_UPDATE")
      ) {
        try {
          const rolesResponse = await getRoles();
          const roleData: Role[] = Array.isArray(rolesResponse)
            ? rolesResponse
            : "content" in rolesResponse
              ? rolesResponse.content
              : [];
          setRoles(roleData);
        } catch (roleError) {
          console.error(roleError);
        }
      }
    } catch (loadError) {
      console.error(loadError);
      setError("Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    loadUsers(currentPage);
  }, [currentUser, currentPage,search]);

  useEffect(() => {
    if (!currentUser || isPrivilegedViewer) return;
    setDepartmentFilter(currentUser.department ?? "");
  }, [currentUser, isPrivilegedViewer]);

  useEffect(() => {
    setCurrentPage(0);
  }, [search, departmentFilter, statusFilter]);

  const getRoleStyle = (role: string) => {
    switch (role) {
      case "CEO":
        return "bg-amber-50 text-amber-700";
      case "HR":
        return "bg-green-50 text-green-600";
      case "MANAGER":
        return "bg-purple-50 text-purple-600";
      case "EMPLOYEE":
        return "bg-blue-50 text-blue-600";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const getInitials = (user: User) =>
    `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  const formatDate = (date?: string | null) => {
    if (!date) return "—";
    return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const filteredUsers = useMemo(() => {
    const value = search.trim().toLowerCase();

    return users
      .filter((user) => {
        if (!isPrivilegedViewer && !user.active) return false;

        const matchesStatus =
          !isPrivilegedViewer ||
          statusFilter === "ALL" ||
          (statusFilter === "ACTIVE" && user.active) ||
          (statusFilter === "INACTIVE" && !user.active);

        const matchesSearch =
          !value ||
          String(user.id).includes(value) ||
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(value) ||
          user.email.toLowerCase().includes(value) ||
          user.roleName.toLowerCase().includes(value) ||
          (user.departmentName ?? "").toLowerCase().includes(value);

        const matchesDepartment =
          !departmentFilter || user.departmentName === departmentFilter;

        return matchesSearch && matchesDepartment && matchesStatus;
      })
      .sort((a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`,
        ),
      );
  }, [users, search, departmentFilter, statusFilter, isPrivilegedViewer]);

  const paginatedUsers = filteredUsers;

  const resetForm = () => {
    setForm({
      firstName: "",
      lastName: "",
      phone: "",
      roleId: "",
      departmentId: "",
      hireDate: "",
      birthDate: "",
      active: true,
    });
    setOriginalForm(null);
  };

  const openAddModal = () => {
    resetForm();
    setError("");
    setShowAddModal(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);

    const role = roles.find((item) => item.name === user.roleName);
    const department = departments.find(
      (item) => item.name === user.departmentName,
    );

    const editForm: UserForm = {
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      phone: user.phone ?? "",
      roleId: role?.id?.toString() ?? "",
      departmentId: department?.id?.toString() ?? "",
      hireDate: user.hireDate ?? "",
      birthDate: user.birthDate ?? "",
      active: user.active,
    };

    setForm(editForm);
    setOriginalForm(editForm);
    setError("");
    setShowEditModal(true);
  };

  const openInfoModal = (user: User) => {
    setSelectedUser(user);
    setShowInfoModal(true);
  };

  const validateCreateForm = () => {
    const errors: string[] = [];

    if (!form.firstName.trim()) errors.push("First name is required.");
    if (!form.lastName.trim()) errors.push("Last name is required.");

    if (!form.phone.trim()) {
      errors.push("Phone is required.");
    } else if (!/^\d{8}$/.test(form.phone.trim())) {
      errors.push("Phone must contain exactly 8 digits.");
    }

    if (!form.roleId) errors.push("Role is required.");
    if (!form.departmentId) errors.push("Department is required.");
    if (!form.hireDate) errors.push("Hire date is required.");
    if (!form.birthDate) errors.push("Birth date is required.");

    

    if (form.birthDate) {
      const birthDate = new Date(form.birthDate);
      if (birthDate > new Date())
        errors.push("Birth date cannot be in the future.");
    }

    return errors;
  };

  const validateEditForm = () => {
    if (!originalForm) return [];

    const errors: string[] = [];
    const firstNameChanged = form.firstName !== originalForm.firstName;
    const lastNameChanged = form.lastName !== originalForm.lastName;
    const phoneChanged = form.phone !== originalForm.phone;
    const roleChanged = form.roleId !== originalForm.roleId;
    const departmentChanged = form.departmentId !== originalForm.departmentId;
    const hireDateChanged = form.hireDate !== originalForm.hireDate;

    if (firstNameChanged && !form.firstName.trim())
      errors.push("First name cannot be empty.");
    if (lastNameChanged && !form.lastName.trim())
      errors.push("Last name cannot be empty.");

    if (phoneChanged) {
      if (!form.phone.trim()) errors.push("Phone cannot be empty.");
      else if (!/^\d{8}$/.test(form.phone.trim()))
        errors.push("Phone must contain exactly 8 digits.");
    }

    if (roleChanged && !form.roleId) errors.push("Role cannot be empty.");
    if (departmentChanged && !form.departmentId)
      errors.push("Department cannot be empty.");
    if (hireDateChanged && !form.hireDate)
      errors.push("Hire date cannot be empty.");
   

    return errors;
  };

  const handleCreate = async () => {
    const errors = validateCreateForm();
    if (errors.length) {
      setError(errors.join(" "));
      return;
    }

    setSaving(true);
    setError("");

    try {
      await createUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        roleId: Number(form.roleId),
        departmentId: Number(form.departmentId),
        hireDate: form.hireDate,
        birthDate: form.birthDate,
        active: true,
      });

      setShowAddModal(false);
      resetForm();
      toast.success("User created successfully.");
      await loadUsers(currentPage);
    } catch (createError) {
      console.error(createError);
      setError("Unable to create user.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;

    const errors = validateEditForm();
    if (errors.length) {
      setError(errors.join(" "));
      return;
    }

    setSaving(true);
    setError("");

    try {
      await updateUser(selectedUser.id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        roleId: Number(form.roleId),
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        hireDate: form.hireDate,
        birthDate: selectedUser.birthDate || null,
        active: form.active,
      });

      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
      toast.success("User updated successfully.");
      await loadUsers(currentPage);
    } catch (updateError) {
      console.error(updateError);
      setError("Unable to update user.");
    } finally {
      setSaving(false);
    }
  };

  const executeToggleActive = async (user: User) => {
    try {
      const roleId = roles.find((role) => role.name === user.roleName)?.id;

      if (!roleId) {
        toast.error("Unable to determine user role.");
        return;
      }

      await updateUser(user.id, {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone ?? "",
        roleId,
        departmentId:
          departments.find(
            (department) => department.name === user.departmentName,
          )?.id ?? null,
        hireDate: user.hireDate,
        birthDate: user.birthDate || null,
        active: !user.active,
      });

      toast.success(user.active ? "User deactivated." : "User activated.");
      await loadUsers(currentPage);
    } catch (toggleError) {
      console.error(toggleError);
      toast.error("Unable to change user status.");
    }
  };

  const openResetPasswordModal = (user: User) => {
    setResetPasswordUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setResetPasswordError("");
    setShowNewPassword(false);
    setShowResetPasswordModal(true);
  };

  const closeResetPasswordModal = () => {
    if (resetPasswordLoading) return;
    setShowResetPasswordModal(false);
    setResetPasswordUser(null);
    setNewPassword("");
    setConfirmPassword("");
    setResetPasswordError("");
    setShowNewPassword(false);
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser) return;

    const password = newPassword.trim();
    const confirmation = confirmPassword.trim();

    if (!password) {
      setResetPasswordError("New password is required.");
      return;
    }

    if (!confirmation) {
      setResetPasswordError("Please confirm the new password.");
      return;
    }

    if (password.length < 8) {
      setResetPasswordError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmation) {
      setResetPasswordError("Passwords do not match.");
      return;
    }

    setResetPasswordLoading(true);
    setResetPasswordError("");

    try {
      await resetUserPassword(resetPasswordUser.id, {
        password,
        confirmPassword: confirmation,
      });

      closeResetPasswordModal();
      toast.success("Password updated successfully.");
    } catch (resetError) {
      console.error(resetError);
      setResetPasswordError(
        resetError instanceof Error
          ? resetError.message
          : "Unable to update password.",
      );
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const askToggleActive = (user: User) => {
    setConfirmAction({
      title: user.active ? "Deactivate user?" : "Activate user?",
      description: user.active
        ? `${user.firstName} ${user.lastName} will no longer be able to access the system.`
        : `${user.firstName} ${user.lastName} will regain access to the system.`,
      confirmLabel: user.active ? "Deactivate" : "Activate",
      danger: user.active,
      onConfirm: () => executeToggleActive(user),
    });
  };

  const askResetPassword = (user: User) => {
    openResetPasswordModal(user);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
              <p className="text-sm font-medium text-slate-500">
                Loading users...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasPermission("USER_READ")) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="mx-auto max-w-[1500px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h1 className="text-lg font-bold text-slate-900">Access denied</h1>
            <p className="mt-2 text-sm text-slate-500">
              You do not have permission to view users.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={4000}
        toastOptions={{
          classNames: {
            toast:
              "w-[420px] min-h-[72px] rounded-2xl border shadow-xl px-5 py-4",
            title: "text-base font-bold",
            description: "text-sm font-medium",
          },
        }}
      />

      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl bg-slate-950 px-6 py-5 shadow-lg sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-blue-300 ring-1 ring-white/10">
              <UsersRound size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Collaborators
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                {filteredUsers.length} users shown · {totalUsers} total users
              </p>
            </div>
          </div>

          {hasPermission("USER_CREATE") && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-md"
              >
                <FileSpreadsheet size={17} />
                Import Users
              </button>

              <button
                type="button"
                onClick={openAddModal}
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-md"
              >
                <Plus size={17} />
                Add User
              </button>
            </div>
          )}
        </div>

        {error && !showAddModal && !showEditModal && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        <div className="relative rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex min-h-[76px] items-center justify-between gap-4 overflow-hidden border-b border-slate-100 px-4 py-3">
            <div className="min-w-0 shrink-0">
              <p className="text-sm font-bold  text-slate-800">
                User Directory
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-400">
                Search and refine the user list when needed.
              </p>
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
              <div
                className={`flex min-w-0 items-center gap-2 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${showSearchFilters ? "max-w-[900px] flex-1 translate-x-0 opacity-100" : "pointer-events-none max-w-0 translate-x-6 opacity-0"}`}
              >
                <div className="relative min-w-[180px] flex-1">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search ID, name, email, role..."
                    autoFocus={showSearchFilters}
                    className="h-10 w-full rounded-xl border-0 bg-slate-50 py-2.5 pl-9 pr-4 text-sm font-medium text-slate-700 outline-none ring-1 ring-slate-200 transition focus:bg-white focus:ring-2 focus:ring-blue-200 placeholder:text-slate-400"
                  />
                </div>

                <select
                  value={departmentFilter}
                  onChange={(event) => setDepartmentFilter(event.target.value)}
                  className="h-10 w-[170px] rounded-xl border-0 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none ring-1 ring-slate-200 transition focus:bg-white focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">All Departments</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.name}>
                      {department.name}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as "ACTIVE" | "INACTIVE" | "ALL",
                    )
                  }
                  disabled={!isPrivilegedViewer}
                  className="h-10 w-[130px] rounded-xl border-0 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none ring-1 ring-slate-200 transition focus:bg-white focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="ACTIVE">Active</option>
                  {isPrivilegedViewer && (
                    <option value="INACTIVE">Inactive</option>
                  )}
                  {isPrivilegedViewer && (
                    <option value="ALL">All Statuses</option>
                  )}
                </select>

                {(search ||
                  (isPrivilegedViewer ? departmentFilter : false) ||
                  (isPrivilegedViewer && statusFilter !== "ACTIVE")) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setDepartmentFilter(
                        isPrivilegedViewer
                          ? ""
                          : (currentUser?.department ?? ""),
                      );
                      setStatusFilter("ACTIVE");
                    }}
                    className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                  >
                    <X size={14} />
                    Clear
                  </button>
                )}
              </div>

              <button
                type="button"
                title={
                  showSearchFilters ? "Close search" : "Search and filter users"
                }
                onClick={() => setShowSearchFilters((value) => !value)}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${showSearchFilters ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
              >
                {showSearchFilters ? <X size={18} /> : <Search size={18} />}
              </button>
            </div>
          </div>

          <div className="relative">
            {usersLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
                <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-lg ring-1 ring-slate-100">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                  Loading users...
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Name
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Email
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Department
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Role
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Status
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Hire Date
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="transition hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                            {getInitials(user)}
                          </div>
                          <span className="text-sm font-semibold text-slate-800">
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">
                        {user.email}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          {user.departmentName ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getRoleStyle(user.roleName)}`}
                        >
                          {user.roleName}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${user.active ? "bg-green-500" : "bg-slate-300"}`}
                          />
                          <span
                            className={`text-xs font-semibold ${user.active ? "text-green-600" : "text-slate-400"}`}
                          >
                            {user.active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">
                        {formatDate(user.hireDate)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            title="View information"
                            onClick={() => openInfoModal(user)}
                            className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 text-violet-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-violet-100 hover:shadow-md active:scale-95"
                          >
                            <Info size={17} />
                          </button>

                          {hasPermission("USER_UPDATE") && (
                            <>
                              <button
                                type="button"
                                title="Edit user"
                                onClick={() => openEditModal(user)}
                                className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-blue-100 hover:shadow-md active:scale-95"
                              >
                                <Pencil size={17} />
                              </button>
                              <button
                                type="button"
                                title={
                                  user.active
                                    ? "Deactivate user"
                                    : "Activate user"
                                }
                                onClick={() => askToggleActive(user)}
                                className={`flex h-11 w-11 items-center justify-center rounded-xl border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:shadow-md active:scale-95 ${user.active ? "border-red-100 bg-red-50 text-red-600 hover:bg-red-100" : "border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}
                              >
                                {user.active ? (
                                  <UserX size={17} />
                                ) : (
                                  <UserCheck size={17} />
                                )}
                              </button>
                              <button
                                type="button"
                                title="Reset password"
                                onClick={() => askResetPassword(user)}
                                className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-amber-100 hover:shadow-md active:scale-95"
                              >
                                <KeyRound size={17} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {paginatedUsers.length === 0 && (
            <div className="px-6 py-12 text-center">
              <UsersRound size={28} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">
                No users found.
              </p>
            </div>
          )}

          {filteredUsers.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
              <p className="text-xs font-medium text-slate-500">
                Page {currentPage + 1} of {totalPages} · {totalUsers} users
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 0}
                  onClick={() =>
                    setCurrentPage((page) => Math.max(0, page - 1))
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={17} />
                </button>
                <span className="min-w-9 text-center text-sm font-semibold text-slate-700">
                  {currentPage + 1}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages - 1, page + 1))
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          )}
        </div>

        {showAddModal && (
          <UserModal
            title="Add User"
            isEdit={false}
            form={form}
            setForm={setForm}
            departments={departments}
            roles={roles}
            saving={saving}
            error={error}
            onClose={() => {
              setShowAddModal(false);
              setError("");
            }}
            onSubmit={handleCreate}
          />
        )}

        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                    Import Users
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Upload an Excel file to create multiple users at once.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    setImportResult(null);
                  }}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6 p-6">
                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition dark:border-slate-700 dark:bg-slate-950/40">
                  <FileSpreadsheet className="mx-auto h-12 w-12 text-blue-500" />

                  <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
                    Select Excel file
                  </h3>

                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Supported formats: .xlsx and .xls
                  </p>

                  <label className="mt-5 inline-flex cursor-pointer items-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700">
                    Choose File
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        setImportFile(file);
                        setImportResult(null);
                      }}
                    />
                  </label>

                  {importFile && (
                    <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-left dark:border-blue-900 dark:bg-blue-950/40">
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                            {importFile.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {(importFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {importResult && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-950">
                        <p className="text-2xl font-extrabold text-slate-950 dark:text-white">
                          {importResult.totalRows}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Total
                        </p>
                      </div>

                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center dark:border-emerald-900/60 dark:bg-emerald-950/30">
                        <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                          {importResult.successCount}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          Imported
                        </p>
                      </div>

                      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center dark:border-red-900/60 dark:bg-red-950/30">
                        <p className="text-2xl font-extrabold text-red-600 dark:text-red-400">
                          {importResult.failedCount}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">
                          Failed
                        </p>
                      </div>
                    </div>

                    {importResult.errors.length > 0 && (
                      <div className="max-h-56 overflow-y-auto rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/20">
                        <p className="mb-3 text-sm font-bold text-red-700 dark:text-red-400">
                          Import Errors
                        </p>

                        <div className="space-y-2">
                          {importResult.errors.map((item, index) => (
                            <div
                              key={`${item.row}-${index}`}
                              className="rounded-xl bg-white px-3 py-2 text-xs dark:bg-slate-900"
                            >
                              <span className="font-bold text-slate-900 dark:text-white">
                                Row {item.row}:
                              </span>{" "}
                              <span className="text-slate-600 dark:text-slate-400">
                                {item.message}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportModal(false);
                      setImportFile(null);
                      setImportResult(null);
                    }}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    disabled={!importFile || importing}
                    onClick={handleImportUsers}
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {importing ? "Importing..." : "Import Users"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showEditModal && selectedUser && (
          <UserModal
            title="Edit User"
            isEdit={true}
            form={form}
            setForm={setForm}
            departments={departments}
            roles={roles}
            saving={saving}
            error={error}
            onClose={() => {
              setShowEditModal(false);
              setSelectedUser(null);
              setOriginalForm(null);
              setError("");
            }}
            onSubmit={handleUpdate}
          />
        )}

        {showInfoModal && selectedUser && (
          <UserInfoModal
            user={selectedUser}
            onClose={() => setShowInfoModal(false)}
            formatDate={formatDate}
          />
        )}

        {showResetPasswordModal && resetPasswordUser && (
          <ResetPasswordModal
            user={resetPasswordUser}
            password={newPassword}
            setPassword={setNewPassword}
            confirmation={confirmPassword}
            setConfirmation={setConfirmPassword}
            showPassword={showNewPassword}
            setShowPassword={setShowNewPassword}
            error={resetPasswordError}
            loading={resetPasswordLoading}
            onClose={closeResetPasswordModal}
            onSubmit={handleResetPassword}
          />
        )}

        {confirmAction && (
          <ConfirmModal
            action={confirmAction}
            loading={confirmLoading}
            onClose={() => {
              if (!confirmLoading) setConfirmAction(null);
            }}
            onConfirm={async () => {
              setConfirmLoading(true);
              try {
                await confirmAction.onConfirm();
                setConfirmAction(null);
              } finally {
                setConfirmLoading(false);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

type UserModalProps = {
  title: string;
  isEdit: boolean;
  form: UserForm;
  setForm: React.Dispatch<React.SetStateAction<UserForm>>;
  departments: Department[];
  roles: Role[];
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: () => void;
};

function UserModal({
  title,
  isEdit,
  form,
  setForm,
  departments,
  roles,
  saving,
  error,
  onClose,
  onSubmit,
}: UserModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
              {title}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {isEdit
                ? "Update the employee information below."
                : "Enter the employee information below."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-all duration-200 hover:scale-105 hover:bg-slate-200 hover:text-slate-800 active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[75vh] space-y-6 overflow-y-auto p-7">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First Name" required={!isEdit}>
              <input
                value={form.firstName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    firstName: event.target.value,
                  }))
                }
                placeholder="First name"
                className="input-style !border-0 !bg-slate-50 !text-slate-900 placeholder:!text-slate-400 focus:!border-0 focus:!ring-2 focus:!ring-blue-100"
              />
            </Field>
            <Field label="Last Name" required={!isEdit}>
              <input
                value={form.lastName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    lastName: event.target.value,
                  }))
                }
                placeholder="Last name"
                className="input-style !border-0 !bg-slate-50 !text-slate-900 placeholder:!text-slate-400 focus:!border-0 focus:!ring-2 focus:!ring-blue-100"
              />
            </Field>
          </div>

          <Field label="Phone" required={!isEdit}>
            <input
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
              placeholder="Phone number"
              className="input-style !border-0 !bg-slate-50 !text-slate-900 placeholder:!text-slate-400 focus:!border-0 focus:!ring-2 focus:!ring-blue-100"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Role" required={!isEdit}>
              <select
                value={form.roleId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    roleId: event.target.value,
                  }))
                }
                className="input-style !border-0 bg-slate-50 !text-slate-900 focus:!border-0 focus:!ring-2 focus:!ring-blue-100"
              >
                <option value="" disabled>
                  Select role
                </option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Department" required={!isEdit}>
              <select
                value={form.departmentId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    departmentId: event.target.value,
                  }))
                }
                className="input-style !border-0 bg-slate-50 !text-slate-900 focus:!border-0 focus:!ring-2 focus:!ring-blue-100"
              >
                <option value="" disabled>
                  Select department
                </option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className={isEdit ? "" : "grid gap-4 sm:grid-cols-2"}>
            <Field label="Hire Date" required={!isEdit}>
              <input
                type="date"
                value={form.hireDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    hireDate: event.target.value,
                  }))
                }
                className="input-style !border-0 !bg-slate-50 !text-slate-900 placeholder:!text-slate-400 focus:!border-0 focus:!ring-2 focus:!ring-blue-100"
              />
            </Field>
            {!isEdit && (
              <Field label="Birth Date" required>
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      birthDate: event.target.value,
                    }))
                  }
                  className="input-style !border-0 !bg-slate-50 !text-slate-900 placeholder:!text-slate-400 focus:!border-0 focus:!ring-2 focus:!ring-blue-100"
                />
              </Field>
            )}
          </div>

          {isEdit && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Account Status
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {form.active
                      ? "This user can access the system."
                      : "This user cannot access the system."}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.active}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      active: !current.active,
                    }))
                  }
                  className={`relative h-7 w-12 rounded-full transition ${form.active ? "bg-green-500" : "bg-slate-300"}`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${form.active ? "left-6" : "left-1"}`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving}
            className="rounded-xl bg-blue-600 px-7 py-3 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Add User"}
          </button>
        </div>
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  required?: boolean;
  children: React.ReactNode;
};

function Field({ label, required, children }: FieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

type UserInfoModalProps = {
  user: User;
  onClose: () => void;
  formatDate: (date?: string | null) => string;
};

function UserInfoModal({ user, onClose, formatDate }: UserInfoModalProps) {
  const initials =
    `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="relative overflow-hidden bg-slate-950 px-7 pb-7 pt-6 text-white">
          <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-blue-500/20 blur-2xl" />
          <div className="relative flex items-start justify-between gap-5">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-lg font-extrabold ring-1 ring-white/15 backdrop-blur-sm">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-xl font-extrabold tracking-tight">
                    {user.firstName} {user.lastName}
                  </h2>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${user.active ? "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/20" : "bg-red-400/15 text-red-300 ring-1 ring-red-300/20"}`}
                  >
                    {user.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm font-medium text-slate-300">
                  {user.email}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold text-slate-200">
                    {user.roleName}
                  </span>
                  <span className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold text-slate-200">
                    {user.departmentName || "No department"}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-slate-300 transition hover:bg-white/15 hover:text-white active:scale-95"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="max-h-[68vh] overflow-y-auto bg-slate-50/70 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <InfoCard title="Contact" icon="@">
              <InfoValue label="Email" value={user.email} />
              <InfoValue label="Phone" value={user.phone || "—"} />
              <InfoValue
                label="Birth Date"
                value={formatDate(user.birthDate)}
              />
            </InfoCard>

            <InfoCard title="Employment" icon="•">
              <InfoValue label="Role" value={user.roleName} badge />
              <InfoValue
                label="Department"
                value={user.departmentName || "—"}
              />
              <InfoValue
                label="Manager"
                value={
                  user.managerFirstName && user.managerLastName
                    ? `${user.managerFirstName} ${user.managerLastName}`
                    : "—"
                }
              />
              
              <InfoValue label="Hire Date" value={formatDate(user.hireDate)} />
            </InfoCard>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
                    Leave balance
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    Annual leave remaining
                  </p>
                </div>
                <div className="rounded-2xl bg-blue-50 px-4 py-2 text-right">
                  <p className="text-2xl font-extrabold text-blue-600">
                    {user.annualLeaveBalance}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-blue-400">
                    days
                  </p>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{
                    width: `${Math.min(Math.max((user.annualLeaveBalance / 30) * 100, 4), 100)}%`,
                  }}
                />
              </div>
            </div>

            <InfoCard title="Account & Security" icon="✓">
              <InfoValue
                label="Account"
                value={user.active ? "Active" : "Inactive"}
                status={user.active}
              />
              <InfoValue
                label="Password"
                value={
                  user.mustChangePassword ? "Change required" : "Configured"
                }
              />
            </InfoCard>

            <InfoCard title="Account ID" icon="#">
              <InfoValue label="User ID" value={`#${user.id}`} />
              <InfoValue label="Profile" value="Employee account" />
            </InfoCard>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-xs font-extrabold text-slate-600">
          {icon}
        </div>
        <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function InfoValue({
  label,
  value,
  badge,
  status,
}: {
  label: string;
  value: string;
  badge?: boolean;
  status?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-3.5 py-3">
      <span className="text-xs font-semibold text-slate-400">{label}</span>
      {badge ? (
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-extrabold text-blue-600">
          {value}
        </span>
      ) : status !== undefined ? (
        <span
          className={`text-sm font-extrabold ${status ? "text-emerald-600" : "text-red-600"}`}
        >
          {value}
        </span>
      ) : (
        <span className="max-w-[65%] truncate text-right text-sm font-bold text-slate-800">
          {value}
        </span>
      )}
    </div>
  );
}

type ResetPasswordModalProps = {
  user: User;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  confirmation: string;
  setConfirmation: React.Dispatch<React.SetStateAction<string>>;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  error: string;
  loading: boolean;
  onClose: () => void;
  onSubmit: () => void;
};

function ResetPasswordModal({
  user,
  password,
  setPassword,
  confirmation,
  setConfirmation,
  showPassword,
  setShowPassword,
  error,
  loading,
  onClose,
  onSubmit,
}: ResetPasswordModalProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const passwordsMatch = confirmation.length > 0 && password === confirmation;
  const passwordLongEnough = password.length >= 8;
  const hasLettersAndNumbers =
    password.length > 0 && /[A-Za-z]/.test(password) && /\d/.test(password);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-md">
      <div className="w-full max-w-xl overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="relative overflow-hidden border-b border-slate-100 px-7 py-7">
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-10 -translate-y-10 rounded-full bg-amber-100/70 blur-2xl" />
          <div className="relative flex items-start justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                <KeyRound size={25} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-amber-600">
                  Account Security
                </p>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
                  Reset Password
                </h2>
                <p className="mt-1.5 text-sm font-medium leading-5 text-slate-500">
                  Create a new password for{" "}
                  <span className="font-bold text-slate-700">
                    {user.firstName} {user.lastName}
                  </span>
                  .
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              title="Close"
            >
              <X size={19} />
            </button>
          </div>
        </div>
        <div className="space-y-5 px-7 py-6">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-xs font-extrabold text-blue-600 shadow-sm ring-1 ring-slate-100">
              {`${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                User account
              </p>
              <p className="truncate text-sm font-bold text-slate-800">
                {user.email}
              </p>
            </div>
          </div>
          <div className="grid gap-4">
            <PasswordField
              label="New Password"
              value={password}
              onChange={setPassword}
              visible={showPassword}
              onToggle={() => setShowPassword((value) => !value)}
            />
            <PasswordField
              label="Confirm New Password"
              value={confirmation}
              onChange={setConfirmation}
              visible={showConfirmation}
              onToggle={() => setShowConfirmation((value) => !value)}
            />
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
              Password requirements
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Requirement
                checked={passwordLongEnough}
                text="At least 8 characters"
              />
              <Requirement
                checked={hasLettersAndNumbers}
                text="Letters and numbers"
              />
              <Requirement
                checked={password.length > 0}
                text="Use a strong password"
              />
              <Requirement checked={passwordsMatch} text="Passwords match" />
            </div>
          </div>
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm font-semibold text-red-700">
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
              <span>{error}</span>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-7 py-5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="rounded-xl bg-amber-500 px-7 py-3 text-sm font-extrabold text-white shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5 hover:bg-amber-600 hover:shadow-xl hover:shadow-amber-500/25 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Requirement({ checked, text }: { checked: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${checked ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-400"}`}
      >
        {checked ? "✓" : "•"}
      </span>
      <span
        className={`text-xs font-semibold ${checked ? "text-slate-700" : "text-slate-400"}`}
      >
        {text}
      </span>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Enter password"
          autoComplete="new-password"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-12 text-sm font-semibold text-slate-900 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-50 placeholder:text-slate-400"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

type ConfirmModalProps = {
  action: NonNullable<ConfirmAction>;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

function ConfirmModal({
  action,
  loading,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          <Info size={22} />
        </div>
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
          {action.title}
        </h2>
        <p className="mt-2 text-base font-medium leading-6 text-slate-600">
          {action.description}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md active:scale-95 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`rounded-xl px-7 py-3 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 disabled:opacity-50 ${action.danger ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {loading ? "Processing..." : action.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
