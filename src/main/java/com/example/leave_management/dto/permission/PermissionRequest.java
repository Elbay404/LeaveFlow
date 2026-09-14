package com.example.leave_management.dto.permission;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PermissionRequest(

        @NotBlank(message = "Permission name is required")
        @Size(max = 255)
        String name,

        @Size(max = 500)
        String description,

        @NotNull(message = "Module ID is required")
        Long moduleId
) {
}