package com.example.leave_management.dto.permission;

public record PermissionResponse(
        Long id,
        String name,
        String description,
        Long moduleId,
        String moduleName
) {
}