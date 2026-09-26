const API_URL = "http://localhost:8080";



export async function getCurrentUser() {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to get current user");
  }

  return response.json();
}

export async function getMyLeaves() {
  const response = await fetch(`${API_URL}/api/leaves/own_leave`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to get my leaves");
  }

  return response.json();
}

export async function getHolidays() {
  const response = await fetch(`${API_URL}/api/holidays`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to get holidays");
  }

  return response.json();
}

export async function getAvailability(
  departmentId?: number,
  userId?: number,
  page = 0,
  size = 10,
  startDate?: string,
  search?: string
) {
  const params = new URLSearchParams();

  if (departmentId) {
    params.append("departmentId", departmentId.toString());
  }

  if (userId) {
    params.append("userId", userId.toString());
  }

  params.append("page", page.toString());
  params.append("size", size.toString());

  if (startDate) {
    params.append("startDate", startDate);
  }
  if (search?.trim()) {
  params.append("search", search.trim());
}

  const response = await fetch(
    `${API_URL}/api/availability?${params.toString()}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get availability");
  }

  return response.json();
}

export async function getDepartments(page = 0, size = 10) {
  const params = new URLSearchParams();

  params.append("page", page.toString());
  params.append("size", size.toString());

  const response = await fetch(
    `${API_URL}/api/departments?${params.toString()}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to get departments");
  }

  return response.json();
}

export async function getUsers(page = 0, size = 10) {
  const params = new URLSearchParams();

  params.append("page", page.toString());
  params.append("size", size.toString());

  const response = await fetch(
    `${API_URL}/api/users?${params.toString()}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to get users");
  }

  return response.json();
}


export async function getLeaveTypes() {
  const response = await fetch(`${API_URL}/api/leave-types`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to get leave types");
  }

  return response.json();
}


export async function createLeave(
  leaveTypeId: number,
  startDate: string,
  endDate: string,
  reason: string,
  document: File | null
) {
  const formData = new FormData();

  formData.append("leaveTypeId", leaveTypeId.toString());
  formData.append("startDate", startDate);
  formData.append("endDate", endDate);
  formData.append("reason", reason);

  if (document) {
    formData.append("document", document);
  }

  const response = await fetch(`${API_URL}/api/leaves`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

 if (!response.ok) {
  const message = await response.text();
  throw new Error(message || "Failed to create leave request");
}

  return response.json();
}


export async function cancelLeave(leaveId: number) {
  const response = await fetch(
    `${API_URL}/api/leaves/${leaveId}/status?status=CANCELLED`,
    {
      method: "PATCH",
      credentials: "include",
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to cancel leave request");
  }

  return response.json();
}


export async function getTeamLeaves() {
  const response = await fetch(`${API_URL}/api/leaves/team`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to get team leaves");
  }

  return response.json();
}

export async function getLeavesByDepartment(departmentId: number) {
  const response = await fetch(
    `${API_URL}/api/leaves/department/${departmentId}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to get department leaves");
  }

  return response.json();
}

export async function getAllLeaves() {
  const response = await fetch(`${API_URL}/api/leaves/all`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to get all leaves");
  }

  return response.json();
}

export async function updateLeaveStatus(
  leaveId: number,
  status: "APPROVED" | "REJECTED" | "CANCELLED",
  rejectionReason?: string
) {
  const params = new URLSearchParams();

  params.append("status", status);

  if (rejectionReason?.trim()) {
    params.append("rejectionReason", rejectionReason.trim());
  }

  const response = await fetch(
    `${API_URL}/api/leaves/${leaveId}/status?${params.toString()}`,
    {
      method: "PATCH",
      credentials: "include",
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to update leave status");
  }

  return response.json();
}

export async function createUser(data: {
  firstName: string;
  lastName: string;
  phone: string;
  roleId: number;
  departmentId: number | null;
  hireDate: string;
  birthDate: string | null;
  active: boolean;
}) {
  const response = await fetch(`${API_URL}/api/users`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to create user");
  }

  return response.json();
}

export async function updateUser(
  userId: number,
  data: {
    firstName: string;
    lastName: string;
    phone: string;
    roleId: number;
    departmentId: number | null;
    hireDate: string;
    birthDate: string | null;
    active: boolean;
  },
) {
  const response = await fetch(
    `${API_URL}/api/users/${userId}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to update user");
  }

  return response.json();
}

export async function getRoles() {
  const response = await fetch(`${API_URL}/api/roles`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to get roles");
  }

  return response.json();
}

export async function createRole(data: {
  name: string;
  description: string;
}) {
  const response = await fetch(`${API_URL}/api/roles`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to create role");
  }

  return response.json();
}

export async function updateRole(
  roleId: number,
  data: {
    name: string;
    description: string;
  },
) {
  const response = await fetch(
    `${API_URL}/api/roles/${roleId}`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to update role");
  }

  return response.json();
}

export async function getModules() {
  const response = await fetch(`${API_URL}/api/modules`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to get modules");
  }

  return response.json();
}

export async function getPermissions() {
  const response = await fetch(`${API_URL}/api/permissions`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to get permissions");
  }

  return response.json();
}

export async function getRolePermissions(roleId: number) {
  const response = await fetch(
    `${API_URL}/api/roles/${roleId}/permissions`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to get role permissions");
  }

  return response.json();
}

export async function updateRolePermissions(
  roleId: number,
  permissionIds: number[],
) {
  const response = await fetch(
    `${API_URL}/api/roles/${roleId}/permissions`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        permissionIds,
      }),
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to update role permissions");
  }

  return response.json();
}

export async function resetUserPassword(
  userId: number,
  data: {
    password: string;
    confirmPassword: string;
  }
) {
  const response = await fetch(
    `${API_URL}/api/users/${userId}/reset-password`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to reset password");
  }
}


export async function createDepartment(data: {
  name: string;
  description: string;
}) {
  const response = await fetch(`${API_URL}/api/departments`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to create department");
  }

  return response.json();
}

export async function updateDepartment(
  departmentId: number,
  data: {
    name: string;
    description: string;
  }
) {
  const response = await fetch(
    `${API_URL}/api/departments/${departmentId}`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to update department");
  }

  return response.json();
}