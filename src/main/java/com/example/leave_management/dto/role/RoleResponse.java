package com.example.leave_management.dto.role;

import com.example.leave_management.dto.permission.PermissionResponse;

import java.util.List;

public record RoleResponse(
        Long id,
        String name,
        String description,
        List<PermissionResponse> permissions

) {
}