package com.example.leave_management.dto.role;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record RolePermissionsRequest(
        @NotNull
        List<Long> permissionIds
) {
}