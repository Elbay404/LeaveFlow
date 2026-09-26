"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  Plus,
  Pencil,
  X,
  Settings2,
  Check,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import {
  getCurrentUser,
  getRoles,
  createRole,
  updateRole,
  getModules,
  getPermissions,
  getRolePermissions,
  updateRolePermissions,
} from "@/lib/api";

type CurrentUser = {
  role: string;
  permissions: string[];
};

type Role = {
  id: number;
  name: string;
  description: string | null;
};

type RoleForm = {
  name: string;
  description: string;
};

type Module = {
  id: number;
  name: string;
  description: string | null;
};

type Permission = {
  id: number;
  name: string;
  description: string | null;
  moduleId: number;
  moduleName: string;
};

export default function RolesPage() {
  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);

  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const [loading, setLoading] = useState(true);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] =
    useState(false);

  const [selectedRole, setSelectedRole] =
    useState<Role | null>(null);

  const [selectedPermissionIds, setSelectedPermissionIds] =
    useState<number[]>([]);

  const [loadingPermissions, setLoadingPermissions] =
    useState(false);

  const [savingPermissions, setSavingPermissions] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<RoleForm>({
    name: "",
    description: "",
  });

  const loadData = async () => {
    setLoading(true);

    try {
      const [
        currentUserResponse,
        rolesResponse,
        modulesResponse,
        permissionsResponse,
      ] = await Promise.all([
        getCurrentUser(),
        getRoles(),
        getModules(),
        getPermissions(),
      ]);

      setCurrentUser(currentUserResponse);

      const roleData: Role[] = Array.isArray(rolesResponse)
        ? rolesResponse
        : "content" in rolesResponse
          ? rolesResponse.content
          : [];

      const moduleData: Module[] = Array.isArray(modulesResponse)
        ? modulesResponse
        : "content" in modulesResponse
          ? modulesResponse.content
          : [];

      const permissionData: Permission[] = Array.isArray(
        permissionsResponse,
      )
        ? permissionsResponse
        : "content" in permissionsResponse
          ? permissionsResponse.content
          : [];

      setRoles(roleData);
      setModules(moduleData);
      setPermissions(permissionData);
    } catch (error) {
      console.error(error);
      toast.error("Unable to load roles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isHr = currentUser?.role === "HR";
  const isCeo = currentUser?.role === "CEO";

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
    });
  };

  const openCreateModal = () => {
    resetForm();
    setSelectedRole(null);
    setShowRoleModal(true);
  };

  const openEditModal = (role: Role) => {
    setSelectedRole(role);

    setForm({
      name: role.name,
      description: role.description ?? "",
    });

    setShowRoleModal(true);
  };

  const openPermissionModal = async (role: Role) => {
    setSelectedRole(role);
    setSelectedPermissionIds([]);
    setShowPermissionModal(true);
    setLoadingPermissions(true);

    try {
      const response = await getRolePermissions(role.id);

      const ids: number[] = Array.isArray(response)
        ? response.map((permission: Permission | number) =>
            typeof permission === "number"
              ? permission
              : permission.id,
          )
        : response.permissionIds ?? [];

      setSelectedPermissionIds(ids);
    } catch (error) {
      console.error(error);
      toast.error("Unable to load role permissions.");
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Role name is required.");
      return;
    }

    setSaving(true);

    try {
      if (selectedRole) {
        await updateRole(selectedRole.id, {
          name: form.name.trim(),
          description: form.description.trim(),
        });

        toast.success("Role updated successfully.");
      } else {
        await createRole({
          name: form.name.trim(),
          description: form.description.trim(),
        });

        toast.success("Role created successfully.");
      }

      setShowRoleModal(false);
      setSelectedRole(null);
      resetForm();

      await loadData();
    } catch (error) {
      console.error(error);

      toast.error(
        selectedRole
          ? "Unable to update role."
          : "Unable to create role.",
      );
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (permissionId: number) => {
    setSelectedPermissionIds((current) =>
      current.includes(permissionId)
        ? current.filter((id) => id !== permissionId)
        : [...current, permissionId],
    );
  };

  const toggleModule = (moduleId: number) => {
    const modulePermissionIds = permissions
      .filter((permission) => permission.moduleId === moduleId)
      .map((permission) => permission.id);

    const allSelected = modulePermissionIds.every((id) =>
      selectedPermissionIds.includes(id),
    );

    if (allSelected) {
      setSelectedPermissionIds((current) =>
        current.filter((id) => !modulePermissionIds.includes(id)),
      );
    } else {
      setSelectedPermissionIds((current) => [
        ...new Set([...current, ...modulePermissionIds]),
      ]);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;

    setSavingPermissions(true);

    try {
      await updateRolePermissions(
        selectedRole.id,
        selectedPermissionIds,
      );

      toast.success("Permissions updated successfully.");

      setShowPermissionModal(false);
    } catch (error) {
      console.error(error);
      toast.error("Unable to update permissions.");
    } finally {
      setSavingPermissions(false);
    }
  };

  const permissionsByModule = useMemo(() => {
    return modules.map((module) => ({
      module,
      permissions: permissions.filter(
        (permission) => permission.moduleId === module.id,
      ),
    }));
  }, [modules, permissions]);

  if (loading) {
    return (
      <>
      <Toaster
  position="top-right"
  richColors
  closeButton
  toastOptions={{
    classNames: {
      toast:
        "w-[420px] min-h-[72px] rounded-2xl border shadow-xl px-5 py-4",
      title: "text-base font-bold",
      description: "text-sm font-medium",
    },
  }}
/>

        <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
          <div className="mx-auto max-w-[1200px]">
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-purple-600" />

                <p className="text-sm font-medium text-slate-500">
                  Loading roles...
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!isHr && !isCeo) {
    return (
      <>
         <Toaster
  position="top-right"
  richColors
  closeButton
  toastOptions={{
    classNames: {
      toast:
        "w-[420px] min-h-[72px] rounded-2xl border shadow-xl px-5 py-4",
      title: "text-base font-bold",
      description: "text-sm font-medium",
    },
  }}
/>

        <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
          <div className="mx-auto max-w-[1200px]">
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <ShieldCheck
                size={40}
                className="mx-auto mb-4 text-slate-300"
              />

              <h1 className="text-lg font-bold text-slate-900">
                Access denied
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Only HR users can manage roles.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
        <Toaster
  position="top-right"
  richColors
  closeButton
  toastOptions={{
    classNames: {
      toast:
        "w-[420px] min-h-[72px] rounded-2xl border shadow-xl px-5 py-4",
      title: "text-base font-bold",
      description: "text-sm font-medium",
    },
  }}
/>

      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
                <ShieldCheck size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Roles
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  {roles.length} roles configured
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              <Plus size={17} />
              Create Role
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <div
                key={role.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <ShieldCheck size={20} />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(role)}
                      title="Edit role"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-blue-600"
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={() => openPermissionModal(role)}
                      title="Manage permissions"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-purple-600"
                    >
                      <Settings2 size={18} />
                    </button>
                  </div>
                </div>

                <h2 className="text-base font-bold text-slate-900">
                  {role.name}
                </h2>

                <p className="mt-2 min-h-[40px] text-sm leading-5 text-slate-500">
                  {role.description || "No description"}
                </p>
              </div>
            ))}
          </div>

          {roles.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
              <ShieldCheck
                size={32}
                className="mx-auto mb-3 text-slate-300"
              />

              <p className="text-sm font-medium text-slate-500">
                No roles found.
              </p>
            </div>
          )}

          {showRoleModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
              <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {selectedRole ? "Edit Role" : "Create Role"}
                    </h2>

                    <p className="mt-1 text-xs text-slate-400">
                      Configure the role information.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowRoleModal(false);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-5 p-6">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Role Name{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Example: TEAM_LEAD"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                      placeholder="Describe this role..."
                      rows={4}
                      className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRoleModal(false);
                    }}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={saving}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : selectedRole
                        ? "Save Changes"
                        : "Create Role"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {showPermissionModal && selectedRole && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
              <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Manage Permissions
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Configure permissions for{" "}
                      <span className="font-semibold text-purple-600">
                        {selectedRole.name}
                      </span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPermissionModal(false);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="max-h-[65vh] overflow-y-auto p-6">
                  {loadingPermissions ? (
                    <div className="flex min-h-[300px] items-center justify-center">
                      <div className="text-center">
                        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-purple-600" />

                        <p className="text-sm font-medium text-slate-500">
                          Loading permissions...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {permissionsByModule.map(
                        ({ module, permissions: modulePermissions }) => {
                          if (modulePermissions.length === 0) {
                            return null;
                          }

                          const modulePermissionIds =
                            modulePermissions.map(
                              (permission) => permission.id,
                            );

                          const selectedCount =
                            modulePermissionIds.filter((id) =>
                              selectedPermissionIds.includes(id),
                            ).length;

                          const allSelected =
                            selectedCount ===
                            modulePermissionIds.length;

                          return (
                            <div
                              key={module.id}
                              className="overflow-hidden rounded-2xl border border-slate-200"
                            >
                              <div className="flex items-center justify-between bg-slate-50 px-5 py-4">
                                <div>
                                  <h3 className="text-sm font-bold text-slate-900">
                                    {module.name}
                                  </h3>

                                  {module.description && (
                                    <p className="mt-1 text-xs text-slate-500">
                                      {module.description}
                                    </p>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleModule(module.id)
                                  }
                                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                                    allSelected
                                      ? "bg-purple-100 text-purple-700"
                                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                  }`}
                                >
                                  {allSelected
                                    ? "Unselect All"
                                    : "Select All"}
                                </button>
                              </div>

                              <div className="divide-y divide-slate-100">
                                {modulePermissions.map(
                                  (permission) => {
                                    const checked =
                                      selectedPermissionIds.includes(
                                        permission.id,
                                      );

                                    return (
                                      <button
                                        type="button"
                                        key={permission.id}
                                        onClick={() =>
                                          togglePermission(
                                            permission.id,
                                          )
                                        }
                                        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-50"
                                      >
                                        <div>
                                          <p className="text-sm font-semibold text-slate-800">
                                            {permission.name}
                                          </p>

                                          {permission.description && (
                                            <p className="mt-1 text-xs text-slate-500">
                                              {permission.description}
                                            </p>
                                          )}
                                        </div>

                                        <div
                                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                            checked
                                              ? "border-purple-600 bg-purple-600 text-white"
                                              : "border-slate-300 bg-white"
                                          }`}
                                        >
                                          {checked && (
                                            <Check size={13} />
                                          )}
                                        </div>
                                      </button>
                                    );
                                  },
                                )}
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                  <p className="text-xs font-medium text-slate-500">
                    {selectedPermissionIds.length} permissions selected
                  </p>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPermissionModal(false);
                      }}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleSavePermissions}
                      disabled={
                        savingPermissions || loadingPermissions
                      }
                      className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingPermissions
                        ? "Saving..."
                        : "Save Permissions"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}