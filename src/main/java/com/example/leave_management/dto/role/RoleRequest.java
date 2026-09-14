package com.example.leave_management.dto.role;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record RoleRequest(

        @NotBlank(message = "Role name is required")
        @Size(max = 255)
        String name,

        @Size(max = 500)
        String description,

        List<Long> permissionIds
) {
}